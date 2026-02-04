import {
  GetCommand,
  PutCommand,
  QueryCommand,
  UpdateCommand,
  ScanCommand,
} from '@aws-sdk/lib-dynamodb';
import { UserRole } from '@fixit/shared-types';
import { dynamoClient } from '../config/dynamodb.js';
import { config } from '../config/index.js';
import { DatabaseError, NotFoundError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

export { UserRole };

/**
 * User profile interface
 * Represents a user in the DynamoDB users table
 */
export interface User {
  id: string;              // Supabase auth user ID (partition key)
  customerId: string;      // Unique 8-digit customer number
  email: string;           // User email
  role: UserRole;          // CUSTOMER or PROFESSIONAL
  displayName?: string;    // Optional display name
  phone?: string;          // Optional phone number
  address?: string;        // Optional address
  profileComplete: boolean; // Whether profile is complete
  createdAt: string;       // ISO timestamp
  updatedAt: string;       // ISO timestamp
}

/**
 * Input for creating a new user
 */
export interface CreateUserInput {
  id: string;              // Supabase auth user ID
  email: string;
  role: UserRole;
  displayName?: string;
}

/**
 * Input for updating a user profile
 */
export interface UpdateUserInput {
  displayName?: string;
  phone?: string;
  address?: string;
  role?: UserRole;
}

/**
 * Counter table for generating sequential customer IDs
 */
const COUNTER_TABLE = 'fixit-counters';
const CUSTOMER_ID_COUNTER_KEY = 'customer_id';
const CUSTOMER_ID_START = 10000000; // Start from 10000001

/**
 * User Repository
 * Enterprise-grade repository for user profile management
 * Handles Supabase auth ID to DynamoDB profile mapping
 */
class UserRepository {
  private readonly tableName = config.DYNAMODB_USERS_TABLE;
  private readonly entityName = 'User';

  /**
   * Generate a unique 8-digit customer ID
   * Uses atomic counter in DynamoDB for thread-safe ID generation
   */
  async generateCustomerId(): Promise<string> {
    try {
      // Try to use atomic counter
      const result = await dynamoClient.send(
        new UpdateCommand({
          TableName: COUNTER_TABLE,
          Key: { id: CUSTOMER_ID_COUNTER_KEY },
          UpdateExpression: 'SET #val = if_not_exists(#val, :start) + :inc',
          ExpressionAttributeNames: { '#val': 'value' },
          ExpressionAttributeValues: {
            ':start': CUSTOMER_ID_START,
            ':inc': 1,
          },
          ReturnValues: 'UPDATED_NEW',
        })
      );

      const newId = result.Attributes?.value as number;
      return String(newId);
    } catch (error) {
      // Fallback: generate timestamp-based ID if counter table doesn't exist
      logger.warn('Counter table not available, using timestamp-based ID', {
        error: String(error),
      });
      
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000);
      return String(CUSTOMER_ID_START + (timestamp % 10000000) + random);
    }
  }

  /**
   * Get user by Supabase auth ID
   */
  async getById(id: string): Promise<User | null> {
    try {
      const result = await dynamoClient.send(
        new GetCommand({
          TableName: this.tableName,
          Key: { id },
        })
      );

      return (result.Item as User) || null;
    } catch (error) {
      logger.error(`Failed to get ${this.entityName} by ID`, {
        tableName: this.tableName,
        id,
        error: String(error),
      });
      throw new DatabaseError(`Failed to retrieve ${this.entityName}`);
    }
  }

  /**
   * Get user by Supabase auth ID, throwing if not found
   */
  async getByIdOrThrow(id: string): Promise<User> {
    const user = await this.getById(id);
    if (!user) {
      throw new NotFoundError(this.entityName, id);
    }
    return user;
  }

  /**
   * Get user by unique customer ID
   */
  async getByCustomerId(customerId: string): Promise<User | null> {
    try {
      const result = await dynamoClient.send(
        new QueryCommand({
          TableName: this.tableName,
          IndexName: 'customerId-index',
          KeyConditionExpression: 'customerId = :customerId',
          ExpressionAttributeValues: { ':customerId': customerId },
        })
      );

      return (result.Items?.[0] as User) || null;
    } catch (error) {
      logger.error(`Failed to get ${this.entityName} by customerId`, {
        tableName: this.tableName,
        customerId,
        error: String(error),
      });
      throw new DatabaseError(`Failed to retrieve ${this.entityName} by customer ID`);
    }
  }

  /**
   * Get user by email
   */
  async getByEmail(email: string): Promise<User | null> {
    try {
      const result = await dynamoClient.send(
        new QueryCommand({
          TableName: this.tableName,
          IndexName: 'email-index',
          KeyConditionExpression: 'email = :email',
          ExpressionAttributeValues: { ':email': email },
        })
      );

      return (result.Items?.[0] as User) || null;
    } catch (error) {
      logger.error(`Failed to get ${this.entityName} by email`, {
        tableName: this.tableName,
        email,
        error: String(error),
      });
      throw new DatabaseError(`Failed to retrieve ${this.entityName} by email`);
    }
  }

  /**
   * Get all users by role
   */
  async getByRole(role: UserRole): Promise<User[]> {
    try {
      const result = await dynamoClient.send(
        new QueryCommand({
          TableName: this.tableName,
          IndexName: 'role-index',
          KeyConditionExpression: '#role = :role',
          ExpressionAttributeNames: { '#role': 'role' },
          ExpressionAttributeValues: { ':role': role },
        })
      );

      return (result.Items as User[]) || [];
    } catch (error) {
      logger.error(`Failed to get ${this.entityName} by role`, {
        tableName: this.tableName,
        role,
        error: String(error),
      });
      throw new DatabaseError(`Failed to retrieve ${this.entityName} by role`);
    }
  }

  /**
   * Create a new user profile
   * Generates unique customerId automatically
   */
  async create(input: CreateUserInput): Promise<User> {
    // Check if user already exists
    const existingUser = await this.getById(input.id);
    if (existingUser) {
      logger.info('User already exists, returning existing profile', {
        id: input.id,
        customerId: existingUser.customerId,
      });
      return existingUser;
    }

    // Generate unique customer ID
    const customerId = await this.generateCustomerId();
    const now = new Date().toISOString();

    const user: User = {
      id: input.id,
      customerId,
      email: input.email,
      role: input.role,
      displayName: input.displayName || input.email.split('@')[0],
      profileComplete: false,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await dynamoClient.send(
        new PutCommand({
          TableName: this.tableName,
          Item: user,
          ConditionExpression: 'attribute_not_exists(id)',
        })
      );

      logger.info(`Created ${this.entityName}`, {
        id: user.id,
        customerId: user.customerId,
        role: user.role,
      });

      return user;
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        // Race condition: user was created between check and put
        const existingUser = await this.getByIdOrThrow(input.id);
        return existingUser;
      }

      logger.error(`Failed to create ${this.entityName}`, {
        tableName: this.tableName,
        id: input.id,
        error: String(error),
      });
      throw new DatabaseError(`Failed to create ${this.entityName}`);
    }
  }

  /**
   * Update user profile
   */
  async update(id: string, updates: UpdateUserInput): Promise<User> {
    const updateExpressionParts: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    // Add updatedAt timestamp
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    // Check if profile is becoming complete
    const currentUser = await this.getById(id);
    if (currentUser && updates.displayName && updates.phone) {
      (updatesWithTimestamp as any).profileComplete = true;
    }

    let index = 0;
    for (const [key, value] of Object.entries(updatesWithTimestamp)) {
      if (key === 'id' || value === undefined) continue;

      const attrName = `#attr${index}`;
      const attrValue = `:val${index}`;

      updateExpressionParts.push(`${attrName} = ${attrValue}`);
      expressionAttributeNames[attrName] = key;
      expressionAttributeValues[attrValue] = value;
      index++;
    }

    if (updateExpressionParts.length === 0) {
      return this.getByIdOrThrow(id);
    }

    try {
      const result = await dynamoClient.send(
        new UpdateCommand({
          TableName: this.tableName,
          Key: { id },
          UpdateExpression: `SET ${updateExpressionParts.join(', ')}`,
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues: expressionAttributeValues,
          ConditionExpression: 'attribute_exists(id)',
          ReturnValues: 'ALL_NEW',
        })
      );

      logger.info(`Updated ${this.entityName}`, { id });
      return result.Attributes as User;
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        throw new NotFoundError(this.entityName, id);
      }

      logger.error(`Failed to update ${this.entityName}`, {
        tableName: this.tableName,
        id,
        error: String(error),
      });
      throw new DatabaseError(`Failed to update ${this.entityName}`);
    }
  }

  /**
   * Get all users (admin only, with pagination support)
   */
  async getAll(limit: number = 50): Promise<User[]> {
    try {
      const result = await dynamoClient.send(
        new ScanCommand({
          TableName: this.tableName,
          Limit: limit,
        })
      );

      return (result.Items as User[]) || [];
    } catch (error) {
      logger.error(`Failed to scan ${this.entityName}`, {
        tableName: this.tableName,
        error: String(error),
      });
      throw new DatabaseError(`Failed to retrieve ${this.entityName} list`);
    }
  }
}

// Singleton instance
export const userRepository = new UserRepository();
