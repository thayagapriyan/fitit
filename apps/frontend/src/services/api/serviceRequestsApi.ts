import { apiClient } from './apiClient';
import type { ServiceRequest } from '../../types';

/**
 * Service Requests API Service
 * Fetches and manages service request data from the backend
 */
export const serviceRequestsApi = {
  /**
   * Get all service requests
   */
  async getAll(): Promise<ServiceRequest[]> {
    return apiClient.get<ServiceRequest[]>('/api/service-requests');
  },

  /**
   * Get request by ID
   */
  async getById(id: string): Promise<ServiceRequest> {
    return apiClient.get<ServiceRequest>(`/api/service-requests/${id}`);
  },

  /**
   * Get open requests
   */
  async getOpenRequests(): Promise<ServiceRequest[]> {
    return apiClient.get<ServiceRequest[]>('/api/service-requests/open');
  },

  /**
   * Get recent requests
   */
  async getRecent(limit: number = 20): Promise<ServiceRequest[]> {
    return apiClient.get<ServiceRequest[]>(`/api/service-requests/recent?limit=${limit}`);
  },

  /**
   * Get requests by status
   */
  async getByStatus(status: ServiceRequest['status']): Promise<ServiceRequest[]> {
    return apiClient.get<ServiceRequest[]>(`/api/service-requests/status/${status}`);
  },

  /**
   * Get requests by customer ID
   */
  async getByCustomerId(customerId: string): Promise<ServiceRequest[]> {
    return apiClient.get<ServiceRequest[]>(`/api/service-requests/customer/${customerId}`);
  },

  /**
   * Create a new service request
   */
  async create(request: {
    customerId: string;
    customerName: string;
    description: string;
    category: string;
  }): Promise<ServiceRequest> {
    return apiClient.post<ServiceRequest>('/api/service-requests', request);
  },

  /**
   * Update request status
   */
  async updateStatus(id: string, status: ServiceRequest['status'], professionalId?: string): Promise<ServiceRequest> {
    return apiClient.patch<ServiceRequest>(`/api/service-requests/${id}/status`, { status, professionalId });
  },

  /**
   * Accept a job (for professionals)
   */
  async acceptJob(id: string, professionalId: string): Promise<ServiceRequest> {
    return apiClient.post<ServiceRequest>(`/api/service-requests/${id}/accept`, { professionalId });
  },

  /**
   * Complete a job
   */
  async completeJob(id: string): Promise<ServiceRequest> {
    return apiClient.post<ServiceRequest>(`/api/service-requests/${id}/complete`, {});
  },
};
