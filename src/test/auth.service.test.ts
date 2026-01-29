import { describe, it, expect, beforeEach } from 'vitest';
import { authService } from '@/services/auth.service';
import { mockDb } from '@/services/mockDb';

describe('AuthService', () => {
  beforeEach(() => {
    mockDb.reset();
  });

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const result = await authService.login({
        email: 'admin@company.com',
        password: 'admin123',
      });

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data?.email).toBe('admin@company.com');
      expect(result.data?.role).toBe('ADMIN');
    });

    it('should fail with invalid password', async () => {
      const result = await authService.login({
        email: 'admin@company.com',
        password: 'wrongpassword',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password');
    });

    it('should fail with non-existent email', async () => {
      const result = await authService.login({
        email: 'nonexistent@company.com',
        password: 'password123',
      });

      expect(result.success).toBe(false);
      expect(result.error).toBe('Invalid email or password');
    });

    it('should store current user after successful login', async () => {
      await authService.login({
        email: 'sarah@company.com',
        password: 'accounting123',
      });

      const currentUser = authService.getCurrentUser();
      expect(currentUser).toBeDefined();
      expect(currentUser?.email).toBe('sarah@company.com');
      expect(currentUser?.role).toBe('ACCOUNTING');
    });
  });

  describe('logout', () => {
    it('should clear current user on logout', async () => {
      await authService.login({
        email: 'admin@company.com',
        password: 'admin123',
      });

      expect(authService.isAuthenticated()).toBe(true);

      await authService.logout();

      expect(authService.isAuthenticated()).toBe(false);
      expect(authService.getCurrentUser()).toBeNull();
    });
  });

  describe('isAuthenticated', () => {
    it('should return false when not logged in', () => {
      expect(authService.isAuthenticated()).toBe(false);
    });

    it('should return true when logged in', async () => {
      await authService.login({
        email: 'admin@company.com',
        password: 'admin123',
      });

      expect(authService.isAuthenticated()).toBe(true);
    });
  });
});
