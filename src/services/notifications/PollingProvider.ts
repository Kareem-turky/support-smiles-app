/**
 * Polling-based Notifications Provider
 * 
 * Uses HTTP polling to fetch notifications at regular intervals.
 * This is the default implementation, to be replaced with WebSocketProvider later.
 */

import { Notification, ApiResponse } from '@/types';
import { NotificationsProvider, NotificationsProviderConfig } from './types';
import { mockDb } from '../mockDb';

const DEFAULT_POLLING_INTERVAL = 5000; // 5 seconds

export class PollingProvider implements NotificationsProvider {
  private pollingInterval: number;
  private intervalId: ReturnType<typeof setInterval> | null = null;
  private lastNotificationIds: Set<string> = new Set();
  private onNotificationCallback: ((notification: Notification) => void) | null = null;
  private onErrorCallback: ((error: Error) => void) | null = null;

  constructor(config?: NotificationsProviderConfig) {
    this.pollingInterval = config?.pollingInterval ?? DEFAULT_POLLING_INTERVAL;
  }

  connect(
    onNotification: (notification: Notification) => void,
    onError?: (error: Error) => void
  ): void {
    this.onNotificationCallback = onNotification;
    this.onErrorCallback = onError ?? null;

    // Initial fetch to populate known IDs
    this.fetchNotifications(true);

    // Start polling
    this.intervalId = setInterval(() => {
      this.fetchNotifications(false);
    }, this.pollingInterval);
  }

  disconnect(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.onNotificationCallback = null;
    this.onErrorCallback = null;
    this.lastNotificationIds.clear();
  }

  isConnected(): boolean {
    return this.intervalId !== null;
  }

  private async fetchNotifications(isInitial: boolean): Promise<void> {
    try {
      const result = await this.getAll();
      
      if (!result.success || !result.data) {
        return;
      }

      if (isInitial) {
        // On initial fetch, just record all IDs
        result.data.forEach(n => this.lastNotificationIds.add(n.id));
      } else {
        // On subsequent fetches, detect new notifications
        result.data.forEach(notification => {
          if (!this.lastNotificationIds.has(notification.id)) {
            this.lastNotificationIds.add(notification.id);
            this.onNotificationCallback?.(notification);
          }
        });
      }
    } catch (error) {
      this.onErrorCallback?.(error as Error);
    }
  }

  async getAll(): Promise<ApiResponse<Notification[]>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const currentUser = mockDb.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Unauthorized' };
    }

    const notifications = mockDb.getNotificationsByUserId(currentUser.id);
    return { success: true, data: notifications };
  }

  async getUnreadCount(): Promise<ApiResponse<number>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const currentUser = mockDb.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Unauthorized' };
    }

    const notifications = mockDb.getNotificationsByUserId(currentUser.id);
    const unreadCount = notifications.filter(n => !n.is_read).length;
    return { success: true, data: unreadCount };
  }

  async markAsRead(id: string): Promise<ApiResponse<Notification>> {
    // Simulate API delay
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
  }

  async markAllAsRead(): Promise<ApiResponse<void>> {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const currentUser = mockDb.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Unauthorized' };
    }

    mockDb.markAllNotificationsAsRead(currentUser.id);
    return { success: true };
  }
}
