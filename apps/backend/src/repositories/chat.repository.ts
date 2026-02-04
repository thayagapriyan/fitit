import { v4 as uuidv4 } from 'uuid';
import { PutCommand, QueryCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { dynamoClient, TableNames } from '../config/dynamodb.js';
import { DatabaseError } from '../utils/errors.js';
import { logger } from '../utils/logger.js';
import type { ChatMessage } from '@fixit/shared-types';

/**
 * Repository for Chat message operations
 * Uses composite key: sessionId (partition key) + timestamp (sort key)
 */
export class ChatRepository {
  readonly tableName = TableNames.CHAT;
  readonly entityName = 'ChatMessage';

  /**
   * Get chat history for a session
   */
  async getSessionHistory(sessionId: string, limit: number = 50): Promise<ChatMessage[]> {
    try {
      const result = await dynamoClient.send(
        new QueryCommand({
          TableName: this.tableName,
          KeyConditionExpression: '#sessionId = :sessionId',
          ExpressionAttributeNames: { '#sessionId': 'sessionId' },
          ExpressionAttributeValues: { ':sessionId': sessionId },
          ScanIndexForward: true, // Oldest first
          Limit: limit,
        })
      );

      return (result.Items as ChatMessage[]) || [];
    } catch (error) {
      logger.error('Failed to get chat history', {
        sessionId,
        error: String(error),
      });
      throw new DatabaseError('Failed to retrieve chat history');
    }
  }

  /**
   * Add a message to a session
   */
  async addMessage(
    sessionId: string,
    role: 'user' | 'model',
    text: string
  ): Promise<ChatMessage> {
    const message: ChatMessage = {
      id: uuidv4(),
      sessionId,
      role,
      text,
      timestamp: new Date().toISOString(),
    };

    try {
      await dynamoClient.send(
        new PutCommand({
          TableName: this.tableName,
          Item: message,
        })
      );

      logger.debug('Added chat message', { sessionId, role });
      return message;
    } catch (error) {
      logger.error('Failed to add chat message', {
        sessionId,
        error: String(error),
      });
      throw new DatabaseError('Failed to save chat message');
    }
  }

  /**
   * Clear chat history for a session
   */
  async clearSession(sessionId: string): Promise<void> {
    try {
      // First, get all messages for the session
      const messages = await this.getSessionHistory(sessionId, 1000);

      // Delete each message
      for (const message of messages) {
        await dynamoClient.send(
          new DeleteCommand({
            TableName: this.tableName,
            Key: {
              sessionId: message.sessionId,
              timestamp: message.timestamp,
            },
          })
        );
      }

      logger.info('Cleared chat session', { sessionId, messageCount: messages.length });
    } catch (error) {
      logger.error('Failed to clear chat session', {
        sessionId,
        error: String(error),
      });
      throw new DatabaseError('Failed to clear chat session');
    }
  }

  /**
   * Get formatted history for AI context
   */
  async getFormattedHistory(
    sessionId: string
  ): Promise<{ role: 'user' | 'model'; text: string }[]> {
    const messages = await this.getSessionHistory(sessionId);
    return messages.map(m => ({
      role: m.role,
      text: m.text,
    }));
  }
}

// Singleton instance
export const chatRepository = new ChatRepository();
