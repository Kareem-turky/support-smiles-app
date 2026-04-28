import { Notification, ApiResponse } from '@/types';
import { api } from '@/lib/api';

export const notificationsService = {
  getAll: async (): Promise<ApiResponse<Notification[]>> => {
    try {
      const response = await api.get<Notification[]>('/notifications');
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  getUnreadCount: async (): Promise<ApiResponse<number>> => {
    try {
      const response = await api.get<Notification[]>('/notifications');
      const count = response.data.filter((n: Notification) => !n.is_read).length;
      return { success: true, data: count };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  markAsRead: async (id: string): Promise<ApiResponse<Notification>> => {
    try {
      const response = await api.post<Notification>(`/notifications/${id}/read`);
      return { success: true, data: response.data };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },

  markAllAsRead: async (): Promise<ApiResponse<void>> => {
    try {
      await api.post('/notifications/read-all');
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.response?.data?.message || error.message };
    }
  },
};
