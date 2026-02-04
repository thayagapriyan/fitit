import { v4 as uuidv4 } from 'uuid';
import { TableNames } from '../config/dynamodb.js';
import { BaseRepository } from './base.repository.js';
import type { ServiceRequest, RequestStatus, CreateServiceRequestRequest, UpdateServiceRequestStatusRequest } from '@fixit/shared-types';

/**
 * Repository for ServiceRequest entity operations
 */
export class ServiceRequestRepository extends BaseRepository<ServiceRequest> {
  readonly tableName = TableNames.SERVICE_REQUESTS;
  readonly entityName = 'ServiceRequest';

  /**
   * Create a new service request
   */
  async createRequest(data: CreateServiceRequestRequest): Promise<ServiceRequest> {
    const request: ServiceRequest = {
      id: uuidv4(),
      customerId: data.customerId,
      customerName: data.customerName,
      description: data.description,
      category: data.category,
      status: 'OPEN',
      date: new Date().toLocaleDateString(),
    };

    return this.create(request);
  }

  /**
   * Get requests by customer ID
   */
  async getByCustomerId(customerId: string): Promise<ServiceRequest[]> {
    return this.scanWithFilter(
      '#customerId = :customerId',
      { '#customerId': 'customerId' },
      { ':customerId': customerId }
    );
  }

  /**
   * Get requests by status
   */
  async getByStatus(status: RequestStatus): Promise<ServiceRequest[]> {
    return this.scanWithFilter(
      '#status = :status',
      { '#status': 'status' },
      { ':status': status }
    );
  }

  /**
   * Get open requests
   */
  async getOpenRequests(): Promise<ServiceRequest[]> {
    return this.getByStatus('OPEN');
  }

  /**
   * Get requests by category
   */
  async getByCategory(category: string): Promise<ServiceRequest[]> {
    return this.scanWithFilter(
      '#category = :category',
      { '#category': 'category' },
      { ':category': category }
    );
  }

  /**
   * Update request status
   */
  async updateStatus(id: string, data: UpdateServiceRequestStatusRequest): Promise<ServiceRequest> {
    const updates: Partial<ServiceRequest> = {
      status: data.status,
    };

    if (data.professionalId) {
      updates.professionalId = data.professionalId;
    }

    return this.update(id, updates);
  }

  /**
   * Accept a job (change status to IN_PROGRESS and assign professional)
   */
  async acceptJob(id: string, professionalId: string): Promise<ServiceRequest> {
    return this.updateStatus(id, {
      status: 'IN_PROGRESS',
      professionalId,
    });
  }

  /**
   * Complete a job
   */
  async completeJob(id: string): Promise<ServiceRequest> {
    return this.updateStatus(id, { status: 'COMPLETED' });
  }

  /**
   * Get requests by professional ID
   */
  async getByProfessionalId(professionalId: string): Promise<ServiceRequest[]> {
    return this.scanWithFilter(
      '#professionalId = :professionalId',
      { '#professionalId': 'professionalId' },
      { ':professionalId': professionalId }
    );
  }

  /**
   * Get recent requests
   */
  async getRecent(limit: number = 20): Promise<ServiceRequest[]> {
    const requests = await this.getAll();
    // Sort by createdAt descending
    return requests
      .sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, limit);
  }
}

// Singleton instance
export const serviceRequestRepository = new ServiceRequestRepository();
