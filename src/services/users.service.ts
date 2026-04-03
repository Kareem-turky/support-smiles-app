import { api } from '@/lib/api';
import { User, ApiResponse, UserRole } from '@/types';

export const usersService = {
  getAll: async (): Promise<ApiResponse<User[]>> => {
    try {
      const response = await api.get<User[]>('/users');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  getById: async (id: string): Promise<ApiResponse<User>> => {
    try {
      const response = await api.get<User>(`/users/${id}`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  getByRole: async (role: UserRole): Promise<ApiResponse<User[]>> => {
    try {
      const response = await api.get<User[]>('/users');
      const filtered = response.data.filter(u => u.role === role);
      return { success: true, data: filtered };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  getCSUsers: async (): Promise<ApiResponse<User[]>> => {
    try {
      const response = await api.get<User[]>('/users');
      // Filter for roles that can handle tickets
      const allowedRoles: UserRole[] = ['CS_AGENT', 'CS_MANAGER', 'ADMIN'];
      const filtered = response.data.filter(u => 
        allowedRoles.includes(u.role) && u.is_active
      );
      return { success: true, data: filtered };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  toggleActive: async (userId: string, currentIsActive: boolean): Promise<ApiResponse<User>> => {
    try {
      const response = await api.patch<User>(`/users/${userId}`, { is_active: !currentIsActive });
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  update: async (userId: string, data: { name?: string; email?: string; is_active?: boolean }): Promise<ApiResponse<User>> => {
    try {
      const response = await api.patch<User>(`/users/${userId}`, data);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  create: async (userData: { name: string; email: string; password: string; role: UserRole }): Promise<ApiResponse<User>> => {
    try {
      const response = await api.post<User>('/users', userData);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  updatePassword: async (userId: string, newPassword: string): Promise<ApiResponse<any>> => {
    try {
      const response = await api.patch(`/users/${userId}/password`, { password: newPassword });
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },
};
