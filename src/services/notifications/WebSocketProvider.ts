/**
 * WebSocket-based Notifications Provider (Placeholder)
 * 
 * This is a placeholder implementation for future WebSocket support.
 * Currently falls back to polling, but provides the interface for
 * real-time notifications when a WebSocket server is available.
 * 
 * To activate WebSocket:
 * 1. Implement the actual WebSocket connection logic
 * 2. Update the NotificationsContext to use this provider
 */

import { Notification, ApiResponse } from '@/types';
import { NotificationsProvider, NotificationsProviderConfig } from './types';
import { PollingProvider } from './PollingProvider';

export class WebSocketProvider implements NotificationsProvider {
  private wsUrl: string;
  private ws: WebSocket | null = null;
  private fallbackProvider: PollingProvider;
  private onNotificationCallback: ((notification: Notification) => void) | null = null;
  private onErrorCallback: ((error: Error) => void) | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(config?: NotificationsProviderConfig) {
    this.wsUrl = config?.wsUrl ?? '';
    // Use polling as fallback
    this.fallbackProvider = new PollingProvider(config);
  }

  connect(
    onNotification: (notification: Notification) => void,
    onError?: (error: Error) => void
  ): void {
    this.onNotificationCallback = onNotification;
    this.onErrorCallback = onError ?? null;

    if (!this.wsUrl) {
      // No WebSocket URL configured, use polling fallback
      console.log('[WebSocketProvider] No WebSocket URL, falling back to polling');
      this.fallbackProvider.connect(onNotification, onError);
      return;
    }

    this.connectWebSocket();
  }

  private connectWebSocket(): void {
    try {
      this.ws = new WebSocket(this.wsUrl);

      this.ws.onopen = () => {
        console.log('[WebSocketProvider] Connected');
        this.reconnectAttempts = 0;
        
        // Send authentication message
        // this.ws?.send(JSON.stringify({ type: 'auth', token: getAccessToken() }));
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'notification' && data.data) {
            this.onNotificationCallback?.(data.data as Notification);
          }
        } catch (e) {
          console.error('[WebSocketProvider] Failed to parse message:', e);
        }
      };

      this.ws.onerror = (error) => {
        console.error('[WebSocketProvider] Error:', error);
        this.onErrorCallback?.(new Error('WebSocket connection error'));
      };

      this.ws.onclose = () => {
        console.log('[WebSocketProvider] Disconnected');
        this.attemptReconnect();
      };
    } catch (error) {
      console.error('[WebSocketProvider] Failed to connect:', error);
      // Fall back to polling
      this.fallbackProvider.connect(
        this.onNotificationCallback!,
        this.onErrorCallback ?? undefined
      );
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('[WebSocketProvider] Max reconnect attempts reached, falling back to polling');
      this.fallbackProvider.connect(
        this.onNotificationCallback!,
        this.onErrorCallback ?? undefined
      );
      return;
    }

    this.reconnectAttempts++;
    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
    
    setTimeout(() => {
      console.log(`[WebSocketProvider] Reconnect attempt ${this.reconnectAttempts}`);
      this.connectWebSocket();
    }, delay);
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.fallbackProvider.disconnect();
    this.onNotificationCallback = null;
    this.onErrorCallback = null;
  }

  isConnected(): boolean {
    return (this.ws?.readyState === WebSocket.OPEN) || this.fallbackProvider.isConnected();
  }

  // These methods delegate to the fallback provider since we need
  // HTTP endpoints for fetching historical data even with WebSocket

  async getAll(): Promise<ApiResponse<Notification[]>> {
    return this.fallbackProvider.getAll();
  }

  async getUnreadCount(): Promise<ApiResponse<number>> {
    return this.fallbackProvider.getUnreadCount();
  }

  async markAsRead(id: string): Promise<ApiResponse<Notification>> {
    return this.fallbackProvider.markAsRead(id);
  }

  async markAllAsRead(): Promise<ApiResponse<void>> {
    return this.fallbackProvider.markAllAsRead();
  }
}
