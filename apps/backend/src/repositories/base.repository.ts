import {
  GetCommand,
  PutCommand,
  DeleteCommand,
  ScanCommand,
  QueryCommand,
  UpdateCommand,
} from '@aws-sdk/lib-dynamodb';
import { dynamoClient } from '../config/dynamodb.js';
import { DatabaseError, NotFoundError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';

/**
 * Base repository providing common DynamoDB operations
 * Uses the repository pattern for clean data access abstraction
 */
export abstract class BaseRepository<T extends { id: string }> {
  /**
   * DynamoDB table name for this repository
   */
  abstract readonly tableName: string;

  /**
   * Entity name for error messages
   */
  abstract readonly entityName: string;

  /**
   * Get a single item by ID
   */
  async getById(id: string): Promise<T | null> {
    try {
      const result = await dynamoClient.send(
        new GetCommand({
          TableName: this.tableName,
          Key: { id },
        })
      );

      return (result.Item as T) || null;
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
   * Get a single item by ID, throwing if not found
   */
  async getByIdOrThrow(id: string): Promise<T> {
    const item = await this.getById(id);
    if (!item) {
      throw new NotFoundError(this.entityName, id);
    }
    return item;
  }

  /**
   * Get all items (use with caution for large tables)
   */
  async getAll(limit?: number): Promise<T[]> {
    try {
      const result = await dynamoClient.send(
        new ScanCommand({
          TableName: this.tableName,
          ...(limit && { Limit: limit }),
        })
      );

      return (result.Items as T[]) || [];
    } catch (error) {
      logger.error(`Failed to scan ${this.entityName}`, {
        tableName: this.tableName,
        error: String(error),
      });
      throw new DatabaseError(`Failed to retrieve ${this.entityName} list`);
    }
  }

  /**
   * Create a new item
   */
  async create(item: T): Promise<T> {
    const now = new Date().toISOString();
    const itemWithTimestamps = {
      ...item,
      createdAt: now,
      updatedAt: now,
    };

    try {
      await dynamoClient.send(
        new PutCommand({
          TableName: this.tableName,
          Item: itemWithTimestamps,
          ConditionExpression: 'attribute_not_exists(id)',
        })
      );

      logger.info(`Created ${this.entityName}`, { id: item.id });
      return itemWithTimestamps;
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        throw new DatabaseError(`${this.entityName} with this ID already exists`);
      }
      logger.error(`Failed to create ${this.entityName}`, {
        tableName: this.tableName,
        id: item.id,
        error: String(error),
      });
      throw new DatabaseError(`Failed to create ${this.entityName}`);
    }
  }

  /**
   * Update an existing item
   */
  async update(id: string, updates: Partial<T>): Promise<T> {
    // Build the update expression dynamically
    const updateExpressionParts: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, any> = {};

    // Add updatedAt timestamp
    const updatesWithTimestamp = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    Object.entries(updatesWithTimestamp).forEach(([key, value], index) => {
      if (key === 'id') return; // Don't update the key
      
      const attrName = `#attr${index}`;
      const attrValue = `:val${index}`;
      
      updateExpressionParts.push(`${attrName} = ${attrValue}`);
      expressionAttributeNames[attrName] = key;
      expressionAttributeValues[attrValue] = value;
    });

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
      return result.Attributes as T;
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
   * Delete an item by ID
   */
  async delete(id: string): Promise<void> {
    try {
      await dynamoClient.send(
        new DeleteCommand({
          TableName: this.tableName,
          Key: { id },
          ConditionExpression: 'attribute_exists(id)',
        })
      );

      logger.info(`Deleted ${this.entityName}`, { id });
    } catch (error: any) {
      if (error.name === 'ConditionalCheckFailedException') {
        throw new NotFoundError(this.entityName, id);
      }
      logger.error(`Failed to delete ${this.entityName}`, {
        tableName: this.tableName,
        id,
        error: String(error),
      });
      throw new DatabaseError(`Failed to delete ${this.entityName}`);
    }
  }

  /**
   * Query items by a secondary index
   */
  protected async queryByIndex<K extends keyof T>(
    indexName: string,
    keyName: K,
    keyValue: T[K]
  ): Promise<T[]> {
    try {
      const result = await dynamoClient.send(
        new QueryCommand({
          TableName: this.tableName,
          IndexName: indexName,
          KeyConditionExpression: '#key = :value',
          ExpressionAttributeNames: { '#key': String(keyName) },
          ExpressionAttributeValues: { ':value': keyValue },
        })
      );

      return (result.Items as T[]) || [];
    } catch (error) {
      logger.error(`Failed to query ${this.entityName} by index`, {
        tableName: this.tableName,
        indexName,
        keyName: String(keyName),
        error: String(error),
      });
      throw new DatabaseError(`Failed to query ${this.entityName}`);
    }
  }

  /**
   * Scan with filter expression
   */
  protected async scanWithFilter(
    filterExpression: string,
    expressionAttributeNames: Record<string, string>,
    expressionAttributeValues: Record<string, any>
  ): Promise<T[]> {
    try {
      const result = await dynamoClient.send(
        new ScanCommand({
          TableName: this.tableName,
          FilterExpression: filterExpression,
          ExpressionAttributeNames: expressionAttributeNames,
          ExpressionAttributeValues: expressionAttributeValues,
        })
      );

      return (result.Items as T[]) || [];
    } catch (error) {
      logger.error(`Failed to scan ${this.entityName} with filter`, {
        tableName: this.tableName,
        error: String(error),
      });
      throw new DatabaseError(`Failed to filter ${this.entityName}`);
    }
  }
}
