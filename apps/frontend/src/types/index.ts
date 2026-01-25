export enum UserRole {
  GUEST = 'GUEST',
  CUSTOMER = 'CUSTOMER',
  PROFESSIONAL = 'PROFESSIONAL'
}

export enum View {
  HOME = 'HOME',
  STORE = 'STORE',
  SERVICES = 'SERVICES',
  DASHBOARD = 'DASHBOARD',
  AI_HELPER = 'AI_HELPER'
}

export interface Product {
  id: string;
  name: string;
  price: number;
  category: 'Power Tools' | 'Hand Tools' | 'Electrical' | 'Plumbing' | 'Safety';
  image: string;
  description: string;
  rating: number;
}

export interface ServiceProfile {
  id: string;
  name: string;
  profession: 'Electrician' | 'Carpenter' | 'Plumber' | 'HVAC' | 'General Handyman';
  rate: number;
  rating: number;
  image: string;
  available: boolean;
}

export interface ServiceRequest {
  id: string;
  customerId: string;
  customerName: string;
  description: string;
  category: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'COMPLETED';
  date: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  isThinking?: boolean;
}
