import { Hono } from 'hono';
import { handle } from 'hono/aws-lambda';
import { cors } from 'hono/cors';
import { logger as honoLogger } from 'hono/logger';
import { setupRoutes } from './routes/index.js';
import { logger } from './utils/index.js';
import { AppError, fromError, errors } from './utils/index.js';

/**
 * Fixit Backend Lambda Handler
 *
 * This is the Lambda-optimized entry point for the Hono.js API.
 * Uses hono/aws-lambda adapter for API Gateway integration.
 */

// Initialize Hono app
const app = new Hono();

// ============================================
// Middleware
// ============================================

// CORS - allow frontend access
app.use('*', cors({
  origin: '*', // In production, restrict to your frontend domain
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
}));

// Request logging (CloudWatch compatible)
app.use('*', honoLogger((message, ...rest) => {
  // Format for CloudWatch Logs
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    message,
    details: rest,
  }));
}));

// ============================================
// Health Check
// ============================================

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    runtime: 'lambda',
    region: process.env.AWS_REGION,
  });
});

// Root endpoint
app.get('/', (c) => {
  return c.json({
    name: 'Fixit Backend API',
    version: '1.0.0',
    status: 'running',
    runtime: 'lambda',
  });
});

// ============================================
// API Routes
// ============================================

setupRoutes(app);

// ============================================
// 404 Handler
// ============================================

app.notFound((c) => {
  return errors.notFound(c, 'Endpoint');
});

// ============================================
// Global Error Handler
// ============================================

app.onError((err, c) => {
  // Log error for CloudWatch
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    path: c.req.path,
    method: c.req.method,
    requestId: c.req.header('x-amzn-requestid'),
  });

  if (err instanceof AppError) {
    return fromError(c, err);
  }

  return errors.internalError(c, 'An unexpected error occurred');
});

// ============================================
// Lambda Handler Export
// ============================================

/**
 * AWS Lambda handler
 * Converts API Gateway events to Hono requests and back
 */
export const handler = handle(app);

// Export app for testing
export { app };
