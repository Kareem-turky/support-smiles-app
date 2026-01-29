/**
 * Notifications Provider Module
 * 
 * Exports the provider interface and implementations.
 * To switch from polling to WebSocket, change the default export.
 */

export * from './types';
export { PollingProvider } from './PollingProvider';
export { WebSocketProvider } from './WebSocketProvider';

// Re-export the default provider
// Change this line when switching to WebSocket:
// export { WebSocketProvider as NotificationsProvider } from './WebSocketProvider';
export { PollingProvider as NotificationsProvider } from './PollingProvider';
