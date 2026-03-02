import { useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { apiClient, type RequestOptions } from '@/lib/dataClient';
import { BusinessUnits } from '@/lib/config';

/**
 * Hook that provides an authenticated version of the API client
 * Automatically adds Authorization header to requests
 */
export function useAuthenticatedApi() {
  const { getAccessToken } = useAuthStore();

  function getCountryHeader(): Record<string, string> {
    const urlParams = new URLSearchParams(window.location.search);
    const selectedCountry = urlParams.get('country');

    if (!selectedCountry) {
      return {};
    }
    return {
      'x-country-code': selectedCountry,
      'x-business-unit': BusinessUnits,
    };
  }

  const createAuthOptions = useCallback(
    (options?: RequestOptions): RequestOptions => {
      const token = getAccessToken();
      const headers: Record<string, string> = {
        ...(options?.headers || {}),
        ...getCountryHeader(),
      };

      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      return {
        ...options,
        headers,
      };
    },
    [getAccessToken]
  );

  const get = useCallback(
    <T = unknown>(path: string, opts?: RequestOptions) => {
      return apiClient.get<T>(path, createAuthOptions(opts));
    },
    [createAuthOptions]
  );

  const post = useCallback(
    <T = unknown>(path: string, body?: unknown, opts?: RequestOptions) => {
      return apiClient.post<T>(path, body, createAuthOptions(opts));
    },
    [createAuthOptions]
  );

  const put = useCallback(
    <T = unknown>(path: string, body?: unknown, opts?: RequestOptions) => {
      return apiClient.put<T>(path, body, createAuthOptions(opts));
    },
    [createAuthOptions]
  );

  const patch = useCallback(
    <T = unknown>(path: string, body?: unknown, opts?: RequestOptions) => {
      return apiClient.patch<T>(path, body, createAuthOptions(opts));
    },
    [createAuthOptions]
  );

  const del = useCallback(
    <T = unknown>(path: string, body?: unknown, opts?: RequestOptions) => {
      return apiClient.delete<T>(path, body, createAuthOptions(opts));
    },
    [createAuthOptions]
  );

  return {
    get,
    post,
    put,
    patch,
    delete: del,
  };
}

export default useAuthenticatedApi;
