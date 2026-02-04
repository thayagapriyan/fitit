import { v4 as uuidv4 } from 'uuid';
import { TableNames } from '../config/dynamodb.js';
import { BaseRepository } from './base.repository.js';
import type { Product, ProductCategory, CreateProductRequest, UpdateProductRequest } from '@fixit/shared-types';

/**
 * Repository for Product entity operations
 */
export class ProductRepository extends BaseRepository<Product> {
  readonly tableName = TableNames.PRODUCTS;
  readonly entityName = 'Product';

  /**
   * Create a new product
   */
  async createProduct(data: CreateProductRequest): Promise<Product> {
    const product: Product = {
      id: uuidv4(),
      name: data.name,
      price: data.price,
      category: data.category,
      image: data.image || `https://picsum.photos/300/300?random=${Date.now()}`,
      description: data.description,
      rating: data.rating ?? 0,
    };

    return this.create(product);
  }

  /**
   * Update an existing product
   */
  async updateProduct(id: string, data: UpdateProductRequest): Promise<Product> {
    return this.update(id, data as Partial<Product>);
  }

  /**
   * Get products by category
   */
  async getByCategory(category: ProductCategory): Promise<Product[]> {
    return this.scanWithFilter(
      '#category = :category',
      { '#category': 'category' },
      { ':category': category }
    );
  }

  /**
   * Get products sorted by rating (descending)
   */
  async getTopRated(limit: number = 10): Promise<Product[]> {
    const products = await this.getAll();
    return products
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }

  /**
   * Search products by name
   */
  async searchByName(searchTerm: string): Promise<Product[]> {
    // Note: For production, consider using OpenSearch or similar
    const products = await this.getAll();
    const lowerSearch = searchTerm.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(lowerSearch) ||
      p.description.toLowerCase().includes(lowerSearch)
    );
  }
}

// Singleton instance
export const productRepository = new ProductRepository();
