/**
 * Notifications Provider Interface
 * 
 * This abstraction allows swapping between polling and WebSocket implementations
 * without changing the consuming code.
 */

import { Notification, ApiResponse } from '@/types';

export interface NotificationsProviderConfig {
  /** Polling interval in milliseconds (for PollingProvider) */
  pollingInterval?: number;
  /** WebSocket URL (for WebSocketProvider) */
  wsUrl?: string;
}

export interface NotificationsProvider {
  /**
   * Start listening for notifications
   * @param onNotification - Callback when new notification arrives
   * @param onError - Callback on error
   */
  connect(
    onNotification: (notification: Notification) => void,
    onError?: (error: Error) => void
  ): void;

  /**
   * Stop listening for notifications
   */
  disconnect(): void;

  /**
   * Check if provider is connected/active
   */
  isConnected(): boolean;

  /**
   * Get all notifications for current user
   */
  getAll(): Promise<ApiResponse<Notification[]>>;

  /**
   * Get unread notification count
   */
  getUnreadCount(): Promise<ApiResponse<number>>;

  /**
   * Mark a notification as read
   */
  markAsRead(id: string): Promise<ApiResponse<Notification>>;

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): Promise<ApiResponse<void>>;
}

/**
 * Factory function type for creating providers
 */
export type NotificationsProviderFactory = (
  config?: NotificationsProviderConfig
) => NotificationsProvider;
