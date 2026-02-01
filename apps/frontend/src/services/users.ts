/**
 * Users API Service
 * Handles user profile operations with the backend API
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/**
 * User role enumeration
 */
export enum UserRole {
  GUEST = 'GUEST',
  CUSTOMER = 'CUSTOMER',
  PROFESSIONAL = 'PROFESSIONAL',
}

/**
 * User profile interface from DynamoDB
 */
export interface UserProfile {
  id: string;
  customerId: string;
  email: string;
  role: UserRole;
  displayName?: string;
  phone?: string;
  address?: string;
  profileComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Input for creating a user profile
 */
export interface CreateUserInput {
  id: string;
  email: string;
  role: 'CUSTOMER' | 'PROFESSIONAL';
  displayName?: string;
}

/**
 * Input for updating a user profile
 */
export interface UpdateUserInput {
  displayName?: string;
  phone?: string;
  address?: string;
  role?: 'CUSTOMER' | 'PROFESSIONAL';
}

/**
 * API response wrapper
 */
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Users API client
 */
export const usersApi = {
  /**
   * Create a new user profile after Supabase signup
   */
  async create(input: CreateUserInput): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/api/users`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    const result: ApiResponse<UserProfile> = await response.json();

    if (!result.success || !result.data) {
      throw new Error(result.error?.message || 'Failed to create user profile');
    }

    return result.data;
  },

  /**
   * Get user profile by Supabase auth ID
   */
  async getById(id: string): Promise<UserProfile | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/${id}`);

      if (response.status === 404) {
        return null;
      }

      const result: ApiResponse<UserProfile> = await response.json();

      if (!result.success) {
        return null;
      }

      return result.data || null;
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return null;
    }
  },

  /**
   * Get user profile by customer ID
   */
  async getByCustomerId(customerId: string): Promise<UserProfile | null> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/customer/${customerId}`);

      if (response.status === 404) {
        return null;
      }

      const result: ApiResponse<UserProfile> = await response.json();

      if (!result.success) {
        return null;
      }

      return result.data || null;
    } catch (error) {
      console.error('Failed to get user by customer ID:', error);
      return null;
    }
  },

  /**
   * Update user profile
   */
  async update(id: string, input: UpdateUserInput): Promise<UserProfile> {
    const response = await fetch(`${API_BASE_URL}/api/users/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(input),
    });

    const result: ApiResponse<UserProfile> = await response.json();

    if (!result.success || !result.data) {
      throw new Error(result.error?.message || 'Failed to update user profile');
    }

    return result.data;
  },

  /**
   * Get all users by role
   */
  async getByRole(role: 'CUSTOMER' | 'PROFESSIONAL'): Promise<UserProfile[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/api/users/role/${role}`);
      const result: ApiResponse<UserProfile[]> = await response.json();

      if (!result.success) {
        return [];
      }

      return result.data || [];
    } catch (error) {
      console.error('Failed to get users by role:', error);
      return [];
    }
  },
};
