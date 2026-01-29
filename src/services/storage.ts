// LocalStorage wrapper for mock persistence

const STORAGE_KEYS = {
  USERS: 'tms_users',
  TICKETS: 'tms_tickets',
  MESSAGES: 'tms_messages',
  NOTIFICATIONS: 'tms_notifications',
  EVENTS: 'tms_events',
  CURRENT_USER: 'tms_current_user',
} as const;

export function getStorageItem<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
}

export function setStorageItem<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}

export function removeStorageItem(key: string): void {
  localStorage.removeItem(key);
}

export { STORAGE_KEYS };
