import { User, AuthUser, LoginCredentials, ApiResponse } from '@/types';
import { STORAGE_KEYS, getStorageItem, setStorageItem, removeStorageItem } from './storage';

// Simple hash function for demo (matches seed.ts)
function simpleHash(password: string): string {
  return btoa(password);
}

export const authService = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthUser>> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    const users = getStorageItem<User[]>(STORAGE_KEYS.USERS) || [];
    const user = users.find(u => u.email === credentials.email);

    if (!user) {
      return { success: false, error: 'Invalid email or password' };
    }

    if (!user.is_active) {
      return { success: false, error: 'Account is deactivated' };
    }

    if (user.password_hash !== simpleHash(credentials.password)) {
      return { success: false, error: 'Invalid email or password' };
    }

    const authUser: AuthUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    // Store current user
    setStorageItem(STORAGE_KEYS.CURRENT_USER, authUser);

    return { success: true, data: authUser };
  },

  logout: async (): Promise<void> => {
    removeStorageItem(STORAGE_KEYS.CURRENT_USER);
  },

  getCurrentUser: (): AuthUser | null => {
    return getStorageItem<AuthUser>(STORAGE_KEYS.CURRENT_USER);
  },

  isAuthenticated: (): boolean => {
    return !!getStorageItem<AuthUser>(STORAGE_KEYS.CURRENT_USER);
  },
};
