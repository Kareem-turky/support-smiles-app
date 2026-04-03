import React, { createContext, useState, useEffect, useCallback } from 'react';
import { AuthState, LoginCredentials, UserRole } from '@/types';
import { authService } from '@/services/auth.service';
import { seedDatabase } from '@/services/seed';

export interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<{ success: boolean; error?: string }>;
  logout: () => Promise<void>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  can: (permission: string) => boolean;
  canEditTicket: (ticketCreatorId: string) => boolean;
  canAssignTicket: () => boolean;
  canDeleteTicket: () => boolean;
  canManageUsers: () => boolean;
}


export const AuthContext = createContext<AuthContextType | undefined>(undefined);

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

  const can = useCallback((permission: string) => {
    if (!state.user) return false;
    // ADMIN has all permissions by default (as safety, but DB seed should cover it)
    if (state.user.role === 'ADMIN') return true;
    return (state.user.permissions || []).includes(permission);
  }, [state.user]);

  // RBAC helpers -> now powered by permissions
  const canEditTicket = useCallback((ticketCreatorId: string) => {
    if (!state.user) return false;
    if (can('tickets:tickets:update')) return true;
    // Allow creator to edit regardless of granular update permission (specific flow)
    return state.user.id === ticketCreatorId;
  }, [state.user, can]);

  const canAssignTicket = useCallback(() => {
    return can('tickets:tickets:manage');
  }, [can]);

  const canDeleteTicket = useCallback(() => {
    return can('tickets:tickets:manage'); // Assuming manage includes delete for CS, or map to specific key
  }, [can]);

  const canManageUsers = useCallback(() => {
    return can('security:users:manage');
  }, [can]);


  const value: AuthContextType = {
    ...state,
    login,
    logout,
    hasRole,
    can,
    canEditTicket,
    canAssignTicket,
    canDeleteTicket,
    canManageUsers,
  };


  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
