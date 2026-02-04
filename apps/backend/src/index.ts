import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger as honoLogger } from 'hono/logger';
import { config } from './config/index.js';
import { setupRoutes } from './routes/index.js';
import { logger } from './utils/index.js';
import { AppError, fromError, errors } from './utils/index.js';

/**
 * Fixit Backend Server
 * Enterprise-level API server using Hono.js with DynamoDB
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

// Request logging
app.use('*', honoLogger());

// ============================================
// Health Check
// ============================================

app.get('/health', (c) => {
  return c.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
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
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    path: c.req.path,
    method: c.req.method,
  });

  if (err instanceof AppError) {
    return fromError(c, err);
  }

  return errors.internalError(c, 'An unexpected error occurred');
});

// ============================================
// Start Server
// ============================================

const port = config.PORT;

logger.info(`🚀 Starting Fixit Backend Server`, {
  port,
  environment: config.NODE_ENV,
  region: config.AWS_REGION,
});

serve({
  fetch: app.fetch,
  port,
});

logger.info(`✅ Server running at http://localhost:${port}`);
logger.info(`📚 API endpoints available at http://localhost:${port}/api`);
logger.info(`❤️  Health check at http://localhost:${port}/health`);

export { app };
