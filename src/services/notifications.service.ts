import { Notification, ApiResponse } from '@/types';
import { STORAGE_KEYS, getStorageItem, setStorageItem } from './storage';
import { authService } from './auth.service';

export const notificationsService = {
  getAll: async (): Promise<ApiResponse<Notification[]>> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Unauthorized' };
    }

    const notifications = getStorageItem<Notification[]>(STORAGE_KEYS.NOTIFICATIONS) || [];
    const userNotifications = notifications
      .filter(n => n.user_id === currentUser.id)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return { success: true, data: userNotifications };
  },

  getUnreadCount: async (): Promise<ApiResponse<number>> => {
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Unauthorized' };
    }

    const notifications = getStorageItem<Notification[]>(STORAGE_KEYS.NOTIFICATIONS) || [];
    const unreadCount = notifications.filter(
      n => n.user_id === currentUser.id && !n.is_read
    ).length;

    return { success: true, data: unreadCount };
  },

  markAsRead: async (id: string): Promise<ApiResponse<Notification>> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Unauthorized' };
    }

    const notifications = getStorageItem<Notification[]>(STORAGE_KEYS.NOTIFICATIONS) || [];
    const notificationIndex = notifications.findIndex(
      n => n.id === id && n.user_id === currentUser.id
    );

    if (notificationIndex === -1) {
      return { success: false, error: 'Notification not found' };
    }

    notifications[notificationIndex] = {
      ...notifications[notificationIndex],
      is_read: true,
    };

    setStorageItem(STORAGE_KEYS.NOTIFICATIONS, notifications);

    return { success: true, data: notifications[notificationIndex] };
  },

  markAllAsRead: async (): Promise<ApiResponse<void>> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Unauthorized' };
    }

    const notifications = getStorageItem<Notification[]>(STORAGE_KEYS.NOTIFICATIONS) || [];
    const updatedNotifications = notifications.map(n => 
      n.user_id === currentUser.id ? { ...n, is_read: true } : n
    );

    setStorageItem(STORAGE_KEYS.NOTIFICATIONS, updatedNotifications);

    return { success: true };
  },
};
