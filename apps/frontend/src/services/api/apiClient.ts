/**
 * Simple fetch wrapper for API calls
 */

import type { ApiSuccessResponse, ApiErrorResponse } from '@fixit/shared-types';

export interface ApiError {
  message: string;
  status?: number;
}

export type { ApiSuccessResponse, ApiErrorResponse };
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }

  private async request<T>(endpoint: string, options: RequestInit): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, options);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw {
          message: errorData.error?.message || errorData.message || `HTTP ${response.status}: ${response.statusText}`,
          status: response.status,
        } as ApiError;
      }

      const json = await response.json();
      
      // Handle wrapped API response from backend
      if (json && typeof json === 'object' && 'success' in json) {
        if (json.success === true) {
          return json.data as T;
        } else if (json.success === false && json.error) {
          throw {
            message: json.error.message,
            status: response.status,
          } as ApiError;
        }
      }
      
      // Handle raw response (for backwards compatibility)
      return json as T;
    } catch (error) {
      if ((error as ApiError).status) {
        throw error;
      }
      throw {
        message: error instanceof Error ? error.message : 'Network error',
      } as ApiError;
    }
  }
}

// Backend API base URL - defaults to localhost:3000 for development
// @ts-ignore - Vite environment variable
const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL) || 'http://localhost:3000';

export const apiClient = new ApiClient(API_BASE_URL);

