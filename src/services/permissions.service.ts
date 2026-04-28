import { api } from '@/lib/api';
import { ApiResponse } from '@/types';

export interface UserPermissionOverride {
  key: string;
  effect: 'ALLOW' | 'DENY';
}

export interface UserPermissions {
  role: string;
  role_permissions: string[];
  overrides: UserPermissionOverride[];
}

export interface PermissionDetail {
  id: string;
  key: string;
  domain: string;
  description: string;
}

export const permissionsService = {
  getAll: async (): Promise<ApiResponse<PermissionDetail[]>> => {
    try {
      const response = await api.get('/permissions');
      return { success: true, data: response.data.data || response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  getUserPermissions: async (userId: string): Promise<ApiResponse<UserPermissions>> => {
    try {
      const response = await api.get(`/permissions/user/${userId}`);
      return { success: true, data: response.data.data || response.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  updateOverride: async (userId: string, key: string, effect: 'ALLOW' | 'DENY'): Promise<ApiResponse<void>> => {
    try {
      await api.patch(`/permissions/user/${userId}`, { permission_key: key, effect });
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  removeOverride: async (userId: string, key: string): Promise<ApiResponse<void>> => {
    try {
      await api.delete(`/permissions/user/${userId}/${key}`);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },
};
