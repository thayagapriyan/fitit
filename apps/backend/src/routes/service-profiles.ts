import { Hono } from 'hono';
import { z } from 'zod';
import { serviceProfileRepository } from '../repositories/index.js';
import { success, created, fromError, errors } from '../utils/response.js';
import { AppError, ValidationError } from '../utils/errors.js';
import type { ProfessionType } from '@fixit/shared-types';

/**
 * Service Profiles API Routes
 */
const serviceProfiles = new Hono();

// Validation schemas
const createProfileSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  profession: z.enum(['Electrician', 'Carpenter', 'Plumber', 'HVAC', 'General Handyman']),
  rate: z.number().positive('Rate must be positive'),
  rating: z.number().min(0).max(5).optional(),
  image: z.string().url().optional(),
  available: z.boolean().optional(),
});

const updateAvailabilitySchema = z.object({
  available: z.boolean(),
});

/**
 * GET /api/service-profiles - Get all service profiles
 */
serviceProfiles.get('/', async (c) => {
  try {
    const data = await serviceProfileRepository.getAll();
    return success(c, data);
  } catch (error) {
    if (error instanceof AppError) return fromError(c, error);
    return errors.internalError(c);
  }
});

/**
 * GET /api/service-profiles/available - Get available professionals
 */
serviceProfiles.get('/available', async (c) => {
  try {
    const data = await serviceProfileRepository.getAvailable();
    return success(c, data);
  } catch (error) {
    if (error instanceof AppError) return fromError(c, error);
    return errors.internalError(c);
  }
});

/**
 * GET /api/service-profiles/top-rated - Get top rated professionals
 */
serviceProfiles.get('/top-rated', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '10', 10);
    const data = await serviceProfileRepository.getTopRated(limit);
    return success(c, data);
  } catch (error) {
    if (error instanceof AppError) return fromError(c, error);
    return errors.internalError(c);
  }
});

/**
 * GET /api/service-profiles/profession/:profession - Get by profession
 */
serviceProfiles.get('/profession/:profession', async (c) => {
  try {
    const profession = c.req.param('profession') as ProfessionType;
    const validProfessions = ['Electrician', 'Carpenter', 'Plumber', 'HVAC', 'General Handyman'];
    
    if (!validProfessions.includes(profession)) {
      return errors.badRequest(c, `Invalid profession. Valid options: ${validProfessions.join(', ')}`);
    }
    
    const data = await serviceProfileRepository.getByProfession(profession);
    return success(c, data);
  } catch (error) {
    if (error instanceof AppError) return fromError(c, error);
    return errors.internalError(c);
  }
});

/**
 * GET /api/service-profiles/:id - Get profile by ID
 */
serviceProfiles.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const data = await serviceProfileRepository.getById(id);
    
    if (!data) {
      return errors.notFound(c, 'ServiceProfile', id);
    }
    
    return success(c, data);
  } catch (error) {
    if (error instanceof AppError) return fromError(c, error);
    return errors.internalError(c);
  }
});

/**
 * POST /api/service-profiles - Create a new profile
 */
serviceProfiles.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const result = createProfileSchema.safeParse(body);
    
    if (!result.success) {
      throw new ValidationError('Invalid profile data', {
        errors: result.error.flatten().fieldErrors,
      });
    }
    
    const data = await serviceProfileRepository.createProfile(result.data);
    return created(c, data);
  } catch (error) {
    if (error instanceof AppError) return fromError(c, error);
    return errors.internalError(c);
  }
});

/**
 * PATCH /api/service-profiles/:id/availability - Update availability
 */
serviceProfiles.patch('/:id/availability', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const result = updateAvailabilitySchema.safeParse(body);
    
    if (!result.success) {
      throw new ValidationError('Invalid availability data', {
        errors: result.error.flatten().fieldErrors,
      });
    }
    
    const data = await serviceProfileRepository.updateAvailability(id, result.data.available);
    return success(c, data);
  } catch (error) {
    if (error instanceof AppError) return fromError(c, error);
    return errors.internalError(c);
  }
});

export { serviceProfiles };
