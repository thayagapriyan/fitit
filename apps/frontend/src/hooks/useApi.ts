import { useState, useEffect, useCallback } from 'react';
import { productsApi, serviceProfilesApi, serviceRequestsApi } from '../services/api';
import type { Product, ServiceProfile, ServiceRequest } from '../types';

/**
 * Generic hook for async data fetching
 */
function useAsync<T>(
  asyncFn: () => Promise<T>,
  immediate: boolean = true
): {
  data: T | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(immediate);
  const [error, setError] = useState<string | null>(null);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await asyncFn();
      setData(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  }, [asyncFn]);

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate]);

  return { data, loading, error, refetch: execute };
}

/**
 * Hook for fetching products
 */
export function useProducts() {
  const fetchProducts = useCallback(() => productsApi.getAll(), []);
  return useAsync<Product[]>(fetchProducts);
}

/**
 * Hook for fetching products by category
 */
export function useProductsByCategory(category: Product['category']) {
  const fetchProducts = useCallback(() => productsApi.getByCategory(category), [category]);
  return useAsync<Product[]>(fetchProducts);
}

/**
 * Hook for fetching service profiles
 */
export function useServiceProfiles() {
  const fetchProfiles = useCallback(() => serviceProfilesApi.getAll(), []);
  return useAsync<ServiceProfile[]>(fetchProfiles);
}

/**
 * Hook for fetching available service profiles
 */
export function useAvailableServiceProfiles() {
  const fetchProfiles = useCallback(() => serviceProfilesApi.getAvailable(), []);
  return useAsync<ServiceProfile[]>(fetchProfiles);
}

/**
 * Hook for fetching service requests
 */
export function useServiceRequests() {
  const fetchRequests = useCallback(() => serviceRequestsApi.getAll(), []);
  return useAsync<ServiceRequest[]>(fetchRequests);
}

/**
 * Hook for fetching customer's service requests
 */
export function useCustomerRequests(customerId: string) {
  const fetchRequests = useCallback(
    () => serviceRequestsApi.getByCustomerId(customerId),
    [customerId]
  );
  return useAsync<ServiceRequest[]>(fetchRequests);
}

/**
 * Hook for fetching open service requests (for professionals)
 */
export function useOpenRequests() {
  const fetchRequests = useCallback(() => serviceRequestsApi.getOpenRequests(), []);
  return useAsync<ServiceRequest[]>(fetchRequests);
}

export { useAsync };
