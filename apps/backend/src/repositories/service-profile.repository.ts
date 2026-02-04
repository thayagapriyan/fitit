import { v4 as uuidv4 } from 'uuid';
import { TableNames } from '../config/dynamodb.js';
import { BaseRepository } from './base.repository.js';
import type { ServiceProfile, ProfessionType, CreateServiceProfileRequest } from '@fixit/shared-types';

/**
 * Repository for ServiceProfile entity operations
 */
export class ServiceProfileRepository extends BaseRepository<ServiceProfile> {
  readonly tableName = TableNames.SERVICE_PROFILES;
  readonly entityName = 'ServiceProfile';

  /**
   * Create a new service profile
   */
  async createProfile(data: CreateServiceProfileRequest): Promise<ServiceProfile> {
    const profile: ServiceProfile = {
      id: uuidv4(),
      name: data.name,
      profession: data.profession,
      rate: data.rate,
      rating: data.rating ?? 0,
      image: data.image || `https://picsum.photos/200/200?random=${Date.now()}`,
      available: data.available ?? true,
    };

    return this.create(profile);
  }

  /**
   * Get profiles by profession
   */
  async getByProfession(profession: ProfessionType): Promise<ServiceProfile[]> {
    return this.scanWithFilter(
      '#profession = :profession',
      { '#profession': 'profession' },
      { ':profession': profession }
    );
  }

  /**
   * Get available service professionals
   */
  async getAvailable(): Promise<ServiceProfile[]> {
    return this.scanWithFilter(
      '#available = :available',
      { '#available': 'available' },
      { ':available': true }
    );
  }

  /**
   * Get available professionals by profession
   */
  async getAvailableByProfession(profession: ProfessionType): Promise<ServiceProfile[]> {
    return this.scanWithFilter(
      '#profession = :profession AND #available = :available',
      { '#profession': 'profession', '#available': 'available' },
      { ':profession': profession, ':available': true }
    );
  }

  /**
   * Update availability status
   */
  async updateAvailability(id: string, available: boolean): Promise<ServiceProfile> {
    return this.update(id, { available } as Partial<ServiceProfile>);
  }

  /**
   * Update rating
   */
  async updateRating(id: string, rating: number): Promise<ServiceProfile> {
    if (rating < 0 || rating > 5) {
      throw new Error('Rating must be between 0 and 5');
    }
    return this.update(id, { rating } as Partial<ServiceProfile>);
  }

  /**
   * Get top-rated professionals
   */
  async getTopRated(limit: number = 10): Promise<ServiceProfile[]> {
    const profiles = await this.getAll();
    return profiles
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  }
}

// Singleton instance
export const serviceProfileRepository = new ServiceProfileRepository();
