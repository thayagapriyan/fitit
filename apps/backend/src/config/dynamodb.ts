import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb';
import { config } from './index.js';

/**
 * DynamoDB client configuration
 * Uses AWS SDK v3 with Document Client for simplified operations
 */

// Base DynamoDB client with retry configuration
const baseClient = new DynamoDBClient({
  region: config.AWS_REGION,
  ...(config.AWS_ACCESS_KEY_ID && config.AWS_SECRET_ACCESS_KEY && {
    credentials: {
      accessKeyId: config.AWS_ACCESS_KEY_ID,
      secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
    },
  }),
  maxAttempts: 3,
});

// Document Client with marshalling options
export const dynamoClient = DynamoDBDocumentClient.from(baseClient, {
  marshallOptions: {
    // Automatically convert empty strings to null
    convertEmptyValues: true,
    // Remove undefined values from objects
    removeUndefinedValues: true,
    // Convert typeof object to map attribute
    convertClassInstanceToMap: true,
  },
  unmarshallOptions: {
    // Return numbers as JavaScript numbers
    wrapNumbers: false,
  },
});

/**
 * Table names from configuration
 */
export const TableNames = {
  PRODUCTS: config.DYNAMODB_PRODUCTS_TABLE,
  SERVICE_PROFILES: config.DYNAMODB_SERVICE_PROFILES_TABLE,
  SERVICE_REQUESTS: config.DYNAMODB_SERVICE_REQUESTS_TABLE,
  CHAT: config.DYNAMODB_CHAT_TABLE,
} as const;

export type TableName = (typeof TableNames)[keyof typeof TableNames];
