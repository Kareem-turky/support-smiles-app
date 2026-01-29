import { User, ApiResponse, UserRole } from '@/types';
import { mockDb } from './mockDb';

export const usersService = {
  getAll: async (): Promise<ApiResponse<User[]>> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const currentUser = mockDb.getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    const users = mockDb.getUsers();
    // Don't return password hashes
    const safeUsers = users.map(({ password_hash, ...user }) => ({ ...user, password_hash: '***' }));
    
    return { success: true, data: safeUsers as User[] };
  },

  getById: async (id: string): Promise<ApiResponse<User>> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const user = mockDb.getUserById(id);
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    const { password_hash, ...safeUser } = user;
    return { success: true, data: { ...safeUser, password_hash: '***' } as User };
  },

  getByRole: async (role: UserRole): Promise<ApiResponse<User[]>> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const users = mockDb.getUsersByRole(role);
    const safeUsers = users.map(({ password_hash, ...user }) => ({ ...user, password_hash: '***' }));
    
    return { success: true, data: safeUsers as User[] };
  },

  getCSUsers: async (): Promise<ApiResponse<User[]>> => {
    return usersService.getByRole('CS');
  },

  toggleActive: async (userId: string): Promise<ApiResponse<User>> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const currentUser = mockDb.getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    const user = mockDb.getUserById(userId);
    
    if (!user) {
      return { success: false, error: 'User not found' };
    }

    // Can't deactivate yourself
    if (userId === currentUser.id) {
      return { success: false, error: 'Cannot deactivate your own account' };
    }

    const updated = mockDb.updateUser(userId, {
      is_active: !user.is_active,
    });

    if (!updated) {
      return { success: false, error: 'Failed to update user' };
    }
    
    const { password_hash, ...safeUser } = updated;
    return { success: true, data: { ...safeUser, password_hash: '***' } as User };
  },

  create: async (userData: { name: string; email: string; password: string; role: UserRole }): Promise<ApiResponse<User>> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const currentUser = mockDb.getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    // Check for duplicate email
    const existingUser = mockDb.getUserByEmail(userData.email);
    if (existingUser) {
      return { success: false, error: 'Email already exists' };
    }

    const newUser = mockDb.createUser({
      name: userData.name,
      email: userData.email,
      password_hash: btoa(userData.password),
      role: userData.role,
      is_active: true,
    });

    const { password_hash, ...safeUser } = newUser;
    return { success: true, data: { ...safeUser, password_hash: '***' } as User };
  },
};
