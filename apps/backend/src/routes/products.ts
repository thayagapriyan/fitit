import { Hono } from 'hono';
import { z } from 'zod';
import { productRepository } from '../repositories/index.js';
import { success, created, noContent, fromError, errors } from '../utils/response.js';
import { AppError, ValidationError } from '../utils/errors.js';
import type { ProductCategory } from '@fixit/shared-types';

/**
 * Product API Routes
 */
const products = new Hono();

// Validation schemas
const createProductSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  price: z.number().positive('Price must be positive'),
  category: z.enum(['Power Tools', 'Hand Tools', 'Electrical', 'Plumbing', 'Safety']),
  image: z.string().url().optional(),
  description: z.string().min(1, 'Description is required').max(500),
  rating: z.number().min(0).max(5).optional(),
});

const updateProductSchema = createProductSchema.partial();

/**
 * GET /api/products - Get all products
 */
products.get('/', async (c) => {
  try {
    const data = await productRepository.getAll();
    return success(c, data);
  } catch (error) {
    if (error instanceof AppError) return fromError(c, error);
    return errors.internalError(c);
  }
});

/**
 * GET /api/products/category/:category - Get products by category
 */
products.get('/category/:category', async (c) => {
  try {
    const category = c.req.param('category') as ProductCategory;
    const validCategories = ['Power Tools', 'Hand Tools', 'Electrical', 'Plumbing', 'Safety'];
    
    if (!validCategories.includes(category)) {
      return errors.badRequest(c, `Invalid category. Valid options: ${validCategories.join(', ')}`);
    }
    
    const data = await productRepository.getByCategory(category);
    return success(c, data);
  } catch (error) {
    if (error instanceof AppError) return fromError(c, error);
    return errors.internalError(c);
  }
});

/**
 * GET /api/products/search - Search products
 */
products.get('/search', async (c) => {
  try {
    const query = c.req.query('q');
    if (!query || query.length < 2) {
      return errors.badRequest(c, 'Search query must be at least 2 characters');
    }
    
    const data = await productRepository.searchByName(query);
    return success(c, data);
  } catch (error) {
    if (error instanceof AppError) return fromError(c, error);
    return errors.internalError(c);
  }
});

/**
 * GET /api/products/top-rated - Get top rated products
 */
products.get('/top-rated', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '10', 10);
    const data = await productRepository.getTopRated(limit);
    return success(c, data);
  } catch (error) {
    if (error instanceof AppError) return fromError(c, error);
    return errors.internalError(c);
  }
});

/**
 * GET /api/products/:id - Get product by ID
 */
products.get('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const data = await productRepository.getById(id);
    
    if (!data) {
      return errors.notFound(c, 'Product', id);
    }
    
    return success(c, data);
  } catch (error) {
    if (error instanceof AppError) return fromError(c, error);
    return errors.internalError(c);
  }
});

/**
 * POST /api/products - Create a new product
 */
products.post('/', async (c) => {
  try {
    const body = await c.req.json();
    const result = createProductSchema.safeParse(body);
    
    if (!result.success) {
      throw new ValidationError('Invalid product data', {
        errors: result.error.flatten().fieldErrors,
      });
    }
    
    const data = await productRepository.createProduct(result.data);
    return created(c, data);
  } catch (error) {
    if (error instanceof AppError) return fromError(c, error);
    return errors.internalError(c);
  }
});

/**
 * PUT /api/products/:id - Update a product
 */
products.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json();
    const result = updateProductSchema.safeParse(body);
    
    if (!result.success) {
      throw new ValidationError('Invalid product data', {
        errors: result.error.flatten().fieldErrors,
      });
    }
    
    const data = await productRepository.updateProduct(id, result.data);
    return success(c, data);
  } catch (error) {
    if (error instanceof AppError) return fromError(c, error);
    return errors.internalError(c);
  }
});

/**
 * DELETE /api/products/:id - Delete a product
 */
products.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    await productRepository.delete(id);
    return noContent(c);
  } catch (error) {
    if (error instanceof AppError) return fromError(c, error);
    return errors.internalError(c);
  }
});

export { products };
