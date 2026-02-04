import { Hono } from 'hono';
import { z } from 'zod';
import { serviceRequestRepository } from '../repositories/index.js';
import { success, created, fromError, errors } from '../utils/response.js';
import { AppError, ValidationError } from '../utils/errors.js';
import type { RequestStatus } from '@fixit/shared-types';

/**
 * Service Requests API Routes
 */
const serviceRequests = new Hono();

// Validation schemas
const createRequestSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  customerName: z.string().min(1, 'Customer name is required').max(100),
  description: z.string().min(1, 'Description is required').max(1000),
  category: z.string().min(1, 'Category is required'),
});

const updateStatusSchema = z.object({
  status: z.enum(['OPEN', 'IN_PROGRESS', 'COMPLETED']),
  professionalId: z.string().optional(),
});

/**
 * GET /api/service-requests - Get all service requests
 */
serviceRequests.get('/', async (c) => {
  try {
    const data = await serviceRequestRepository.getAll();
    return success(c, data);
  } catch (error) {
    if (error instanceof AppError) return fromError(c, error);
    return errors.internalError(c);
  }
});

/**
 * GET /api/service-requests/open - Get open requests
 */
serviceRequests.get('/open', async (c) => {
  try {
    const data = await serviceRequestRepository.getOpenRequests();
    return success(c, data);
  } catch (error) {
    if (error instanceof AppError) return fromError(c, error);
    return errors.internalError(c);
  }
});

/**
 * GET /api/service-requests/recent - Get recent requests
 */
serviceRequests.get('/recent', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '20', 10);
    const data = await serviceRequestRepository.getRecent(limit);
    return success(c, data);
  } catch (error) {
    if (error instanceof AppError) return fromError(c, error);
    return errors.internalError(c);
  }
});

/**
 * GET /api/service-requests/status/:status - Get by status
 */
serviceRequests.get('/status/:status', async (c) => {
  try {
    const status = c.req.param('status') as RequestStatus;
    const validStatuses = ['OPEN', 'IN_PROGRESS', 'COMPLETED'];
    
    if (!validStatuses.includes(status)) {
      return errors.badRequest(c, `Invalid status. Valid options: ${validStatuses.join(', ')}`);
    }
    
    const data = await serviceRequestRepository.getByStatus(status);
    return success(c, data);
  } catch (error) {
    if (error instanceof AppError) return fromError(c, error);
    return errors.internalError(c);
  }
});

/**
 * GET /api/service-requests/customer/:customerId - Get by customer
 */
serviceRequests.get('/customer/:customerId', async (c) => {
  try {
    const customerId = c.req.param('customerId');
    const data = await serviceRequestRepository.getByCustomerId(customerId);
    return success(c, data);
  } catch (error) {
    if (error instanceof AppError) return fromError(c, error);
    return errors.internalError(c);
  }
});

/**
 * GET /api/service-requests/professional/:professionalId - Get by professional
 */
serviceRequests.get('/professional/:professionalId', async (c) => {
  try {
    const professionalId = c.req.param('professionalId');
    const data = await serviceRequestRepository.getByProfessionalId(professionalId);
    return success(c, data);
  } catch (error) {
    if (error instanceof AppError) return fromError(c, error);
    return errors.internalError(c);
  }
});

/**
 * GET /api/service-requests/:id - Get request by ID
 */
serviceRequests.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const data = await serviceRequestRepository.getById(id);
    
    if (!data) {
      return errors.notFound(c, 'ServiceRequest', id);
    }
    
    return success(c, data);
  } catch (error) {
    if (error instanceof AppError) return fromError(c, error);
    return errors.internalError(c);
  }
});

/**
 * POST /api/service-requests - Create a new request
 */
serviceRequests.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const result = createRequestSchema.safeParse(body);
    
    if (!result.success) {
      throw new ValidationError('Invalid request data', {
        errors: result.error.flatten().fieldErrors,
      });
    }
    
    const data = await serviceRequestRepository.createRequest(result.data);
    return created(c, data);
  } catch (error) {
    if (error instanceof AppError) return fromError(c, error);
    return errors.internalError(c);
  }
});

/**
 * PATCH /api/service-requests/:id/status - Update status
 */
serviceRequests.patch('/:id/status', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const result = updateStatusSchema.safeParse(body);
    
    if (!result.success) {
      throw new ValidationError('Invalid status data', {
        errors: result.error.flatten().fieldErrors,
      });
    }
    
    const data = await serviceRequestRepository.updateStatus(id, result.data);
    return success(c, data);
  } catch (error) {
    if (error instanceof AppError) return fromError(c, error);
    return errors.internalError(c);
  }
});

/**
 * POST /api/service-requests/:id/accept - Accept a job
 */
serviceRequests.post('/:id/accept', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    
    if (!body.professionalId) {
      return errors.badRequest(c, 'Professional ID is required');
    }
    
    const data = await serviceRequestRepository.acceptJob(id, body.professionalId);
    return success(c, data);
  } catch (error) {
    if (error instanceof AppError) return fromError(c, error);
    return errors.internalError(c);
  }
});

/**
 * POST /api/service-requests/:id/complete - Complete a job
 */
serviceRequests.post('/:id/complete', async (c) => {
  try {
    const id = c.req.param('id');
    const data = await serviceRequestRepository.completeJob(id);
    return success(c, data);
  } catch (error) {
    if (error instanceof AppError) return fromError(c, error);
    return errors.internalError(c);
  }
});

export { serviceRequests };
