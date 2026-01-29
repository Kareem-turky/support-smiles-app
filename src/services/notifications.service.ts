import { Notification, ApiResponse } from '@/types';
import { mockDb } from './mockDb';

export const notificationsService = {
  getAll: async (): Promise<ApiResponse<Notification[]>> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const currentUser = mockDb.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Unauthorized' };
    }

    const notifications = mockDb.getNotificationsByUserId(currentUser.id);
    return { success: true, data: notifications };
  },

  getUnreadCount: async (): Promise<ApiResponse<number>> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const currentUser = mockDb.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Unauthorized' };
    }

    const notifications = mockDb.getNotificationsByUserId(currentUser.id);
    const unreadCount = notifications.filter(n => !n.is_read).length;

    return { success: true, data: unreadCount };
  },

  markAsRead: async (id: string): Promise<ApiResponse<Notification>> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const currentUser = mockDb.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Unauthorized' };
    }

    const notification = mockDb.getNotificationById(id);
    
    if (!notification || notification.user_id !== currentUser.id) {
      return { success: false, error: 'Notification not found' };
    }

    const updated = mockDb.updateNotification(id, { is_read: true });

    if (!updated) {
      return { success: false, error: 'Failed to update notification' };
    }

    return { success: true, data: updated };
  },

  markAllAsRead: async (): Promise<ApiResponse<void>> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const currentUser = mockDb.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Unauthorized' };
    }

    mockDb.markAllNotificationsAsRead(currentUser.id);

    return { success: true };
  },
};
