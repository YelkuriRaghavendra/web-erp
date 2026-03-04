import { useAuthStore } from '@/store/authStore';
import { AUTH_ENDPOINTS } from './config';

let refreshInProgress = false;

export async function handle401Retry(
  originalUrl: string,
  init: RequestInit,
  headers: Record<string, string>,
  isRetryAttempt = false
): Promise<Response> {
  const { getAccessToken, refreshToken, logout } = useAuthStore.getState();
  if (isRetryAttempt) {
    logout?.();
    throw new Error(
      'Authentication failed after token refresh - session invalid'
    );
  }
  if (refreshInProgress) {
    await new Promise(resolve => setTimeout(resolve, 100));

    const currentToken = getAccessToken();
    if (currentToken) {
      const retryHeaders = {
        ...headers,
        Authorization: `Bearer ${currentToken}`,
      };
      return await fetch(originalUrl, { ...init, headers: retryHeaders });
    } else {
      console.error('No token available after waiting for refresh completion');
      logout?.();
      throw new Error('No valid token available after refresh completion');
    }
  }

  try {
    refreshInProgress = true;
    await refreshToken();

    const newAccessToken = getAccessToken();
    if (!newAccessToken) {
      throw new Error('No new access token after refresh');
    }
    const retryHeaders = {
      ...headers,
      Authorization: `Bearer ${newAccessToken}`,
    };
    const retryInit = { ...init, headers: retryHeaders };

    // Make the retry request and mark it as a retry attempt
    const response = await fetch(originalUrl, retryInit);

    if (response.status === 401) {
      return await handle401Retry(originalUrl, init, headers, true);
    }

    return response;
  } catch (err) {
    logout?.();
    throw err;
  } finally {
    refreshInProgress = false;
  }
}

export function isAuthEndpoint(path: string): boolean {
  const isAuth = AUTH_ENDPOINTS.some((endpoint: string) =>
    path.includes(endpoint)
  );
  return isAuth;
}
