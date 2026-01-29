import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthUser, AuthState, LoginCredentials, UserRole } from '@/types';
import { authService } from '@/services/auth.service';
import { seedDatabase } from '@/services/seed';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  canEditTicket: (ticketCreatorId: string) => boolean;
  canAssignTicket: () => boolean;
  canDeleteTicket: () => boolean;
  canManageUsers: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Initialize auth state and seed database
  useEffect(() => {
    seedDatabase(); // Seed if not already seeded
    const user = authService.getCurrentUser();
    setState({
      user,
      isAuthenticated: !!user,
      isLoading: false,
    });
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const result = await authService.login(credentials);
    if (result.success && result.data) {
      setState({
        user: result.data,
        isAuthenticated: true,
        isLoading: false,
      });
      return { success: true };
    }
    return { success: false, error: result.error };
  }, []);

  const logout = useCallback(async () => {
    await authService.logout();
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const hasRole = useCallback((roles: UserRole | UserRole[]) => {
    if (!state.user) return false;
    const roleArray = Array.isArray(roles) ? roles : [roles];
    return roleArray.includes(state.user.role);
  }, [state.user]);

  // RBAC helpers
  const canEditTicket = useCallback((ticketCreatorId: string) => {
    if (!state.user) return false;
    if (state.user.role === 'ADMIN') return true;
    if (state.user.role === 'ACCOUNTING') {
      return state.user.id === ticketCreatorId;
    }
    return false; // CS cannot edit ticket fields
  }, [state.user]);

  const canAssignTicket = useCallback(() => {
    if (!state.user) return false;
    return state.user.role === 'ADMIN' || state.user.role === 'ACCOUNTING';
  }, [state.user]);

  const canDeleteTicket = useCallback(() => {
    if (!state.user) return false;
    return state.user.role === 'ADMIN';
  }, [state.user]);

  const canManageUsers = useCallback(() => {
    if (!state.user) return false;
    return state.user.role === 'ADMIN';
  }, [state.user]);

  const value: AuthContextType = {
    ...state,
    login,
    logout,
    hasRole,
    canEditTicket,
    canAssignTicket,
    canDeleteTicket,
    canManageUsers,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
