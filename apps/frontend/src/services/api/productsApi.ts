import { apiClient } from './apiClient';
import type { Product } from '../../types';

/**
 * Products API Service
 * Fetches product data from the backend
 */
export const productsApi = {
  /**
   * Get all products
   */
  async getAll(): Promise<Product[]> {
    return apiClient.get<Product[]>('/api/products');
  },

  /**
   * Get product by ID
   */
  async getById(id: string): Promise<Product> {
    return apiClient.get<Product>(`/api/products/${id}`);
  },

  /**
   * Get products by category
   */
  async getByCategory(category: Product['category']): Promise<Product[]> {
    return apiClient.get<Product[]>(`/api/products/category/${encodeURIComponent(category)}`);
  },

  /**
   * Search products by name/description
   */
  async search(query: string): Promise<Product[]> {
    return apiClient.get<Product[]>(`/api/products/search?q=${encodeURIComponent(query)}`);
  },

  /**
   * Get top rated products
   */
  async getTopRated(limit: number = 10): Promise<Product[]> {
    return apiClient.get<Product[]>(`/api/products/top-rated?limit=${limit}`);
  },

  /**
   * Create a new product
   */
  async create(product: Omit<Product, 'id'>): Promise<Product> {
    return apiClient.post<Product>('/api/products', product);
  },

  /**
   * Update a product
   */
  async update(id: string, product: Partial<Product>): Promise<Product> {
    return apiClient.put<Product>(`/api/products/${id}`, product);
  },

  /**
   * Delete a product
   */
  async delete(id: string): Promise<void> {
    return apiClient.delete<void>(`/api/products/${id}`);
  },
};
