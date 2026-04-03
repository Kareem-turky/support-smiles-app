import { AuthUser, LoginCredentials, ApiResponse } from '@/types';
import { api } from '@/lib/api';
import { STORAGE_KEYS } from '@/services/storage';

interface LoginResponse {
  user: {
    id: string;
    name: string;
    email: string;
    role: any;
    permissions: string[];
  };
  access_token: string;

  refresh_token: string;
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthUser>> => {
    try {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);

      const response = await api.post<any>('/auth/login', credentials);

      // Handle potential double-wrapping of data depending on backend/mock adapter
      const rawData = response.data;
      const loginData = (rawData.data || rawData) as LoginResponse;

      if (!loginData?.access_token) {
        throw new Error('No access token received');
      }

      const user: AuthUser = {
        id: loginData.user.id,
        name: loginData.user.name,
        email: loginData.user.email,
        role: loginData.user.role,
        permissions: loginData.user.permissions || [],
      };


      // Store Auth Data
      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, loginData.access_token);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, loginData.refresh_token);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));

      return { success: true, data: user };
    } catch (error: any) {
      console.error('[Auth] Login failed:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Login failed. Please check your credentials.'
      };
    }
  },

  impersonate: async (targetUserId: string): Promise<ApiResponse<AuthUser>> => {
    try {
      const response = await api.post<any>(`/auth/impersonate/${targetUserId}`);
      const rawData = response.data;
      const loginData = (rawData.data || rawData) as LoginResponse;

      if (!loginData?.access_token) {
        throw new Error('No access token received');
      }

      const user: AuthUser = {
        id: loginData.user.id,
        name: loginData.user.name,
        email: loginData.user.email,
        role: loginData.user.role,
        permissions: loginData.user.permissions || [],
      };


      // Destroy previous session explicitly and hook new token in
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);

      localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, loginData.access_token);
      localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, loginData.refresh_token);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));

      // Force a full React re-mount with the new authentication context
      window.location.href = '/';

      return { success: true, data: user };
    } catch (error: any) {
      console.error('[Auth] Impersonation failed:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'Impersonation failed.'
      };
    }
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      console.warn('Logout API call failed', e);
    } finally {
      localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
      window.location.href = '/login';
    }
  },

  getCurrentUser: (): AuthUser | null => {
    const userJson = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!userJson) return null;
    try {
      return JSON.parse(userJson);
    } catch {
      return null;
    }
  },

  isAuthenticated: (): boolean => {
    return !!localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  },
};
