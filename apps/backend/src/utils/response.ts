import type { Context } from 'hono';
import type { ApiSuccessResponse, ApiErrorResponse } from '@fixit/shared-types';
import { AppError } from './errors.js';

/**
 * API Response utilities
 * Provides consistent response formatting across all endpoints
 */

/**
 * Send a success response
 */
export function success<T>(
  c: Context,
  data: T,
  statusCode: number = 200,
  meta?: ApiSuccessResponse<T>['meta']
): Response {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
    ...(meta && { meta }),
  };

  return c.json(response, statusCode as 200 | 201 | 400 | 401 | 403 | 404 | 409 | 500);
}

/**
 * Send a created response (201)
 */
export function created<T>(c: Context, data: T): Response {
  return success(c, data, 201);
}

/**
 * Send a no content response (204)
 */
export function noContent(_c: Context): Response {
  return new Response(null, { status: 204 });
}

/**
 * Send an error response
 */
export function error(
  c: Context,
  statusCode: number,
  code: string,
  message: string,
  details?: Record<string, unknown>
): Response {
  const response: ApiErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...(details && { details }),
    },
  };

  return c.json(response, statusCode as 200 | 201 | 400 | 401 | 403 | 404 | 409 | 500);
}

/**
 * Send an error response from an AppError
 */
export function fromError(c: Context, err: AppError): Response {
  return c.json(err.toJSON(), err.statusCode as 200 | 201 | 400 | 401 | 403 | 404 | 409 | 500);
}

/**
 * Send a paginated response
 */
export function paginated<T>(
  c: Context,
  data: T[],
  page: number,
  pageSize: number,
  totalCount: number
): Response {
  return success(c, data, 200, {
    count: data.length,
    page,
    totalPages: Math.ceil(totalCount / pageSize),
  });
}

/**
 * Common error responses
 */
export const errors = {
  badRequest: (c: Context, message: string = 'Invalid request', details?: Record<string, unknown>) =>
    error(c, 400, 'BAD_REQUEST', message, details),

  unauthorized: (c: Context, message: string = 'Authentication required') =>
    error(c, 401, 'UNAUTHORIZED', message),

  forbidden: (c: Context, message: string = 'Access denied') =>
    error(c, 403, 'FORBIDDEN', message),

  notFound: (c: Context, resource: string = 'Resource', id?: string) =>
    error(c, 404, 'NOT_FOUND', id ? `${resource} with ID '${id}' not found` : `${resource} not found`),

  conflict: (c: Context, message: string, details?: Record<string, unknown>) =>
    error(c, 409, 'CONFLICT', message, details),

  internalError: (c: Context, message: string = 'Internal server error') =>
    error(c, 500, 'INTERNAL_ERROR', message),
};
