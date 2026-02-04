/**
 * Shared TypeScript types for the Fixit platform
 * Used by both frontend and backend
 */

// ============================================
// Enums
// ============================================

export enum UserRole {
  GUEST = 'GUEST',
  CUSTOMER = 'CUSTOMER',
  PROFESSIONAL = 'PROFESSIONAL',
}

export type ProductCategory = 'Power Tools' | 'Hand Tools' | 'Electrical' | 'Plumbing' | 'Safety';

export type ProfessionType = 'Electrician' | 'Carpenter' | 'Plumber' | 'HVAC' | 'General Handyman';

export type RequestStatus = 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';

// ============================================
// Entity Interfaces
// ============================================

export interface Product {
  id: string;
  name: string;
  price: number;
  category: ProductCategory;
  image: string;
  description: string;
  rating: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceProfile {
  id: string;
  name: string;
  profession: ProfessionType;
  rate: number;
  rating: number;
  image: string;
  available: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface ServiceRequest {
  id: string;
  customerId: string;
  customerName: string;
  description: string;
  category: string;
  status: RequestStatus;
  date: string;
  professionalId?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'model';
  text: string;
  timestamp: string;
}

// ============================================
// API Request/Response Types
// ============================================

export interface CreateProductRequest {
  name: string;
  price: number;
  category: ProductCategory;
  image?: string;
  description: string;
  rating?: number;
}

export interface UpdateProductRequest {
  name?: string;
  price?: number;
  category?: ProductCategory;
  image?: string;
  description?: string;
  rating?: number;
}

export interface CreateServiceProfileRequest {
  name: string;
  profession: ProfessionType;
  rate: number;
  rating?: number;
  image?: string;
  available?: boolean;
}

export interface CreateServiceRequestRequest {
  customerId: string;
  customerName: string;
  description: string;
  category: string;
}

export interface UpdateServiceRequestStatusRequest {
  status: RequestStatus;
  professionalId?: string;
}

export interface AIRequest {
  prompt: string;
  history: { role: 'user' | 'model'; text: string }[];
  sessionId?: string;
}

export interface AIResponse {
  text: string;
  sessionId?: string;
}

// ============================================
// Generic API Response Types
// ============================================

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  meta?: {
    count?: number;
    page?: number;
    totalPages?: number;
  };
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
