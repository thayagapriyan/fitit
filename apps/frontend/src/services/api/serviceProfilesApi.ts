import { apiClient } from './apiClient';
import type { ServiceProfile } from '../../types';

/**
 * Service Profiles API Service
 * Fetches service professional data from the backend
 */
export const serviceProfilesApi = {
  /**
   * Get all service profiles
   */
  async getAll(): Promise<ServiceProfile[]> {
    return apiClient.get<ServiceProfile[]>('/api/service-profiles');
  },

  /**
   * Get profile by ID
   */
  async getById(id: string): Promise<ServiceProfile> {
    return apiClient.get<ServiceProfile>(`/api/service-profiles/${id}`);
  },

  /**
   * Get available professionals
   */
  async getAvailable(): Promise<ServiceProfile[]> {
    return apiClient.get<ServiceProfile[]>('/api/service-profiles/available');
  },

  /**
   * Get profiles by profession
   */
  async getByProfession(profession: ServiceProfile['profession']): Promise<ServiceProfile[]> {
    return apiClient.get<ServiceProfile[]>(`/api/service-profiles/profession/${encodeURIComponent(profession)}`);
  },

  /**
   * Get top rated professionals
   */
  async getTopRated(limit: number = 10): Promise<ServiceProfile[]> {
    return apiClient.get<ServiceProfile[]>(`/api/service-profiles/top-rated?limit=${limit}`);
  },

  /**
   * Create a new service profile
   */
  async create(profile: Omit<ServiceProfile, 'id'>): Promise<ServiceProfile> {
    return apiClient.post<ServiceProfile>('/api/service-profiles', profile);
  },

  /**
   * Update availability status
   */
  async updateAvailability(id: string, available: boolean): Promise<ServiceProfile> {
    return apiClient.patch<ServiceProfile>(`/api/service-profiles/${id}/availability`, { available });
  },
};
