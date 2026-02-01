import { Hono } from 'hono';
import { products } from './products.js';
import { serviceProfiles } from './service-profiles.js';
import { serviceRequests } from './service-requests.js';
import { ai } from './ai.js';
import { users } from './users.js';

/**
 * Route aggregator
 * Mounts all API routes under /api
 */
export function setupRoutes(app: Hono): void {
  // API routes
  app.route('/api/products', products);
  app.route('/api/service-profiles', serviceProfiles);
  app.route('/api/service-requests', serviceRequests);
  app.route('/api/ai', ai);
  app.route('/api/users', users);
}
