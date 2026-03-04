import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { jwtDecode } from 'jwt-decode';
import { apiClient } from '@/lib/dataClient';
import { keyCloakConfig, Endpoints, buildGoogleLoginUrl } from '@/lib/config';
import { queryClient } from '@/lib/react-query';

export interface UserInfo {
  email: string;
  name: string;
  given_name: string;
  family_name: string;
  preferred_username: string;
  roles: string[];
  country_access?: string[] | string;
  default_country?: string;
  userid: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  type: string;
  expiryTimeInMinutes: number;
  expiresAt: number;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    refreshToken: string;
    type: string;
    expiryTimeInMinutes: number;
  };
}

interface DecodedToken {
  exp: number;
  iat: number;
  sub: string;
  name: string;
  given_name: string;
  family_name: string;
  preferred_username: string;
  email: string;
  email_verified: boolean;
  country_access?: string;
  default_country?: string;
  realm_access?: {
    roles: string[];
  };
  resource_access?: Record<string, { roles: string[] }>;
}

interface AuthState {
  tokens: AuthTokens | null;
  userInfo: UserInfo | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // Actions
  login: (credentials: LoginCredentials) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  getUserInfo: () => UserInfo | null;
  isTokenExpired: () => boolean;
  getAccessToken: () => string | null;
  hasRole: (...roles: string[]) => boolean;
  loginWithGoogle: () => void;
  loginWithGoogleCallback: (code: string) => Promise<void>;
  setUserInfo: (userInfo: UserInfo) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      tokens: null,
      userInfo: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      login: async (credentials: LoginCredentials) => {
        try {
          const keyCloakClientId = keyCloakConfig.clientId;
          set({ isLoading: true, error: null });

          const payload: Record<string, unknown> = {
            ...credentials,
            keyCloakClientId,
          };
          const response = await apiClient.post<LoginResponse>(
            Endpoints.login,
            payload
          );

          if (!response.success) {
            throw new Error(response.message || 'Login failed');
          }

          const { data } = response;

          const decoded: DecodedToken = jwtDecode(data.accessToken);

          const expiresAt =
            decoded.exp * 1000 ||
            Date.now() + data.expiryTimeInMinutes * 60 * 1000;

          const roles = [
            ...(decoded.realm_access?.roles || []),
            ...Object.values(decoded.resource_access || {}).flatMap(
              r => r.roles
            ),
          ];

          const tokens: AuthTokens = {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            type: data.type,
            expiryTimeInMinutes: data.expiryTimeInMinutes,
            expiresAt,
          };

          const userInfo: UserInfo = {
            email: decoded.email,
            name: decoded.name,
            given_name: decoded.given_name,
            family_name: decoded.family_name,
            preferred_username: decoded.preferred_username,
            roles,
            country_access: decoded.country_access,
            default_country: decoded.default_country,
            userid: decoded.sub,
          };

          set({
            tokens,
            userInfo,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });

          // Set default country in localStorage
          if (userInfo.default_country) {
            localStorage.setItem('selectedCountry', userInfo.default_country);
          }
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Login failed';
          set({
            tokens: null,
            userInfo: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      logout: () => {
        try {
          queryClient.clear();
        } catch (e) {
          console.error('Failed to clear query client on logout', e);
        }

        set({
          tokens: null,
          userInfo: null,
          isAuthenticated: false,
          isLoading: false,
          error: null,
        });
      },

      refreshToken: async () => {
        try {
          const { tokens } = get();
          const keyCloakClientId = keyCloakConfig.clientId;
          if (!tokens?.refreshToken) {
            throw new Error('No refresh token available');
          }

          set({ isLoading: true, error: null });
          const payload = {
            refreshToken: tokens.refreshToken,
            keyCloakClientId: keyCloakClientId,
            grantType: 'refresh_token',
          };

          const response = await apiClient.post<LoginResponse>(
            Endpoints.refreshToken,
            payload
          );

          if (!response.success) {
            throw new Error(response.message || 'Token refresh failed');
          }

          const { data } = response;
          const decoded: DecodedToken = jwtDecode(data.accessToken);

          const expiresAt =
            decoded.exp * 1000 ||
            Date.now() + data.expiryTimeInMinutes * 60 * 1000;

          const roles = [
            ...(decoded.realm_access?.roles || []),
            ...Object.values(decoded.resource_access || {}).flatMap(
              r => r.roles
            ),
          ];

          const newTokens: AuthTokens = {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            type: data.type,
            expiryTimeInMinutes: data.expiryTimeInMinutes,
            expiresAt,
          };

          const newUserInfo: UserInfo = {
            email: decoded.email,
            name: decoded.name,
            given_name: decoded.given_name,
            family_name: decoded.family_name,
            preferred_username: decoded.preferred_username,
            roles,
            country_access: decoded.country_access,
            default_country: decoded.default_country,
            userid: decoded.sub,
          };

          set({
            tokens: newTokens,
            userInfo: newUserInfo,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Token refresh failed';
          set({
            tokens: null,
            userInfo: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },
      loginWithGoogle: () => {
        const url = buildGoogleLoginUrl();
        // console.log(`redirect URL ${JSON.stringify(url)}`);
        window.location.href = url;
      },

      loginWithGoogleCallback: async (code: string) => {
        try {
          set({ isLoading: true, error: null });

          const response = await apiClient.post<LoginResponse>(
            Endpoints.googleExchange,
            { code }
          );

          if (!response.success) {
            throw new Error(response.message || 'Google login failed');
          }

          const { data } = response;

          const decoded: DecodedToken = jwtDecode(data.accessToken);

          const expiresAt =
            decoded.exp * 1000 ||
            Date.now() + data.expiryTimeInMinutes * 60 * 1000;

          const roles = [
            ...(decoded.realm_access?.roles || []),
            ...Object.values(decoded.resource_access || {}).flatMap(
              r => r.roles
            ),
          ];

          const tokens: AuthTokens = {
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            type: data.type,
            expiryTimeInMinutes: data.expiryTimeInMinutes,
            expiresAt,
          };

          const userInfo: UserInfo = {
            email: decoded.email,
            name: decoded.name,
            given_name: decoded.given_name,
            family_name: decoded.family_name,
            preferred_username: decoded.preferred_username,
            roles,
            country_access: decoded.country_access,
            default_country: decoded.default_country,
            userid: decoded.sub,
          };

          set({
            tokens,
            userInfo,
            isAuthenticated: true,
            isLoading: false,
            error: null,
          });
        } catch (error) {
          const errorMessage =
            error instanceof Error ? error.message : 'Google login failed';
          set({
            tokens: null,
            userInfo: null,
            isAuthenticated: false,
            isLoading: false,
            error: errorMessage,
          });
          throw error;
        }
      },

      clearError: () => set({ error: null }),

      getUserInfo: () => get().userInfo,

      isTokenExpired: () => {
        const { tokens } = get();
        if (!tokens) return true;

        return Date.now() >= tokens.expiresAt - 30000;
      },

      getAccessToken: () => get().tokens?.accessToken || null,

      hasRole: (...rolesToCheck: string[]) => {
        const { userInfo } = get();
        if (!userInfo || !userInfo.roles) return false;
        const normalizedRoles = userInfo.roles.map(r => r.toUpperCase());
        return rolesToCheck.some(r =>
          normalizedRoles.includes(r.toUpperCase())
        );
      },

      setUserInfo: userInfo => {
        set({ userInfo });
        if (userInfo?.default_country) {
          localStorage.setItem('selectedCountry', userInfo.default_country);
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: state => ({
        tokens: state.tokens,
        userInfo: state.userInfo,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
