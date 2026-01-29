import { User, ApiResponse, UserRole } from '@/types';
import { STORAGE_KEYS, getStorageItem, setStorageItem } from './storage';
import { authService } from './auth.service';

export const usersService = {
  getAll: async (): Promise<ApiResponse<User[]>> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const currentUser = authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    const users = getStorageItem<User[]>(STORAGE_KEYS.USERS) || [];
    // Don't return password hashes
    const safeUsers = users.map(({ password_hash, ...user }) => ({ ...user, password_hash: '***' }));
    
    return { success: true, data: safeUsers as User[] };
  },

  getById: async (id: string): Promise<ApiResponse<User>> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const users = getStorageItem<User[]>(STORAGE_KEYS.USERS) || [];
    const user = users.find(u => u.id === id);
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const { password_hash, ...safeUser } = user;
    return { success: true, data: { ...safeUser, password_hash: '***' } as User };
  },

  getByRole: async (role: UserRole): Promise<ApiResponse<User[]>> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const users = getStorageItem<User[]>(STORAGE_KEYS.USERS) || [];
    const filteredUsers = users.filter(u => u.role === role && u.is_active);
    const safeUsers = filteredUsers.map(({ password_hash, ...user }) => ({ ...user, password_hash: '***' }));
    
    return { success: true, data: safeUsers as User[] };
  },

  getCSUsers: async (): Promise<ApiResponse<User[]>> => {
    return usersService.getByRole('CS');
  },

  toggleActive: async (userId: string): Promise<ApiResponse<User>> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const currentUser = authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    const users = getStorageItem<User[]>(STORAGE_KEYS.USERS) || [];
    const userIndex = users.findIndex(u => u.id === userId);
    
    if (userIndex === -1) {
      return { success: false, error: 'User not found' };
    }

    // Can't deactivate yourself
    if (userId === currentUser.id) {
      return { success: false, error: 'Cannot deactivate your own account' };
    }

    users[userIndex] = {
      ...users[userIndex],
      is_active: !users[userIndex].is_active,
      updated_at: new Date().toISOString(),
    };

    setStorageItem(STORAGE_KEYS.USERS, users);
    
    const { password_hash, ...safeUser } = users[userIndex];
    return { success: true, data: { ...safeUser, password_hash: '***' } as User };
  },

  create: async (userData: { name: string; email: string; password: string; role: UserRole }): Promise<ApiResponse<User>> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const currentUser = authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    const users = getStorageItem<User[]>(STORAGE_KEYS.USERS) || [];
    
    // Check for duplicate email
    if (users.some(u => u.email === userData.email)) {
      return { success: false, error: 'Email already exists' };
    }

    const newUser: User = {
      id: `user-${Date.now()}`,
      name: userData.name,
      email: userData.email,
      password_hash: btoa(userData.password),
      role: userData.role,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    users.push(newUser);
    setStorageItem(STORAGE_KEYS.USERS, users);

    const { password_hash, ...safeUser } = newUser;
    return { success: true, data: { ...safeUser, password_hash: '***' } as User };
  },
};
