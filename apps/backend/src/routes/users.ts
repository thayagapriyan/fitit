import { Hono } from 'hono';
import { z } from 'zod';
import { userRepository, UserRole, CreateUserInput, UpdateUserInput } from '../repositories/user.repository.js';
import { errors } from '../utils/response.js';
import { logger } from '../utils/logger.js';

/**
 * User Routes
 * Handles user profile management for Supabase-authenticated users
 */
export const users = new Hono();

// ============================================
// Validation Schemas
// ============================================

const createUserSchema = z.object({
  id: z.string().min(1, 'User ID is required'),
  email: z.string().email('Valid email is required'),
  role: z.enum(['CUSTOMER', 'PROFESSIONAL']),
  displayName: z.string().optional(),
});

const updateUserSchema = z.object({
  displayName: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  role: z.enum(['CUSTOMER', 'PROFESSIONAL']).optional(),
});

// ============================================
// Routes
// ============================================

/**
 * POST /api/users
 * Create a new user profile after Supabase signup
 */
users.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const validation = createUserSchema.safeParse(body);

    if (!validation.success) {
      return errors.badRequest(c, validation.error.issues[0].message);
    }

    const input: CreateUserInput = {
      id: validation.data.id,
      email: validation.data.email,
      role: validation.data.role as UserRole,
      displayName: validation.data.displayName,
    };

    const user = await userRepository.create(input);

    logger.info('User profile created', {
      id: user.id,
      customerId: user.customerId,
      role: user.role,
    });

    return c.json({
      success: true,
      data: user,
    }, 201);
  } catch (error) {
    logger.error('Failed to create user', { error: String(error) });
    return errors.internalError(c, 'Failed to create user profile');
  }
});

/**
 * GET /api/users/:id
 * Get user by Supabase auth ID
 */
users.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const user = await userRepository.getById(id);

    if (!user) {
      return errors.notFound(c, 'User');
    }

    return c.json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error('Failed to get user', { error: String(error) });
    return errors.internalError(c, 'Failed to retrieve user');
  }
});

/**
 * GET /api/users/customer/:customerId
 * Get user by unique customer ID
 */
users.get('/customer/:customerId', async (c) => {
  try {
    const customerId = c.req.param('customerId');
    const user = await userRepository.getByCustomerId(customerId);

    if (!user) {
      return errors.notFound(c, 'User');
    }

    return c.json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error('Failed to get user by customerId', { error: String(error) });
    return errors.internalError(c, 'Failed to retrieve user');
  }
});

/**
 * GET /api/users/email/:email
 * Get user by email
 */
users.get('/email/:email', async (c) => {
  try {
    const email = c.req.param('email');
    const user = await userRepository.getByEmail(email);

    if (!user) {
      return errors.notFound(c, 'User');
    }

    return c.json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error('Failed to get user by email', { error: String(error) });
    return errors.internalError(c, 'Failed to retrieve user');
  }
});

/**
 * GET /api/users/role/:role
 * Get all users by role (CUSTOMER or PROFESSIONAL)
 */
users.get('/role/:role', async (c) => {
  try {
    const role = c.req.param('role').toUpperCase();

    if (role !== 'CUSTOMER' && role !== 'PROFESSIONAL') {
      return errors.badRequest(c, 'Invalid role. Must be CUSTOMER or PROFESSIONAL');
    }

    const users = await userRepository.getByRole(role as UserRole);

    return c.json({
      success: true,
      data: users,
      count: users.length,
    });
  } catch (error) {
    logger.error('Failed to get users by role', { error: String(error) });
    return errors.internalError(c, 'Failed to retrieve users');
  }
});

/**
 * PUT /api/users/:id
 * Update user profile
 */
users.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const validation = updateUserSchema.safeParse(body);

    if (!validation.success) {
      return errors.badRequest(c, validation.error.issues[0].message);
    }

    const updates: UpdateUserInput = {};
    if (validation.data.displayName) updates.displayName = validation.data.displayName;
    if (validation.data.phone) updates.phone = validation.data.phone;
    if (validation.data.address) updates.address = validation.data.address;
    if (validation.data.role) updates.role = validation.data.role as UserRole;

    const user = await userRepository.update(id, updates);

    logger.info('User profile updated', { id: user.id });

    return c.json({
      success: true,
      data: user,
    });
  } catch (error) {
    logger.error('Failed to update user', { error: String(error) });
    return errors.internalError(c, 'Failed to update user profile');
  }
});

/**
 * GET /api/users
 * Get all users (admin endpoint)
 */
users.get('/', async (c) => {
  try {
    const limitParam = c.req.query('limit');
    const limit = limitParam ? parseInt(limitParam, 10) : 50;

    const allUsers = await userRepository.getAll(limit);

    return c.json({
      success: true,
      data: allUsers,
      count: allUsers.length,
    });
  } catch (error) {
    logger.error('Failed to get all users', { error: String(error) });
    return errors.internalError(c, 'Failed to retrieve users');
  }
});
