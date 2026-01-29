import { User, AuthUser, LoginCredentials, ApiResponse } from '@/types';
import { mockDb } from './mockDb';

export const authService = {
  login: async (credentials: LoginCredentials): Promise<ApiResponse<AuthUser>> => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 300));

    // Ensure database is initialized
    mockDb.initialize();

    const user = mockDb.getUserByEmail(credentials.email);

    if (!user) {
      return { success: false, error: 'Invalid email or password' };
    }

    if (!user.is_active) {
      return { success: false, error: 'Account is deactivated' };
    }

    if (!mockDb.validatePassword(user, credentials.password)) {
      return { success: false, error: 'Invalid email or password' };
    }

    const authUser: AuthUser = {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };

    // Store current user in mock DB (persists session to localStorage optionally)
    mockDb.setCurrentUser(user);

    return { success: true, data: authUser };
  },

  logout: async (): Promise<void> => {
    mockDb.setCurrentUser(null);
  },

  getCurrentUser: (): AuthUser | null => {
    const user = mockDb.getCurrentUser();
    if (!user) return null;
    
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    };
  },

  isAuthenticated: (): boolean => {
    return mockDb.getCurrentUser() !== null;
  },
};
