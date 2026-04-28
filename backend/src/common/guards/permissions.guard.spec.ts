import { PermissionsGuard } from './permissions.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { PermissionEffect } from '@prisma/client';

describe('PermissionsGuard', () => {
  let guard: PermissionsGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new PermissionsGuard(reflector);
    // Mock Prisma on the instance
    (guard as any).prisma = {
      featureFlag: {
        findUnique: jest.fn().mockResolvedValue({ is_enabled: true }),
      },
      rolePermission: {
        findMany: jest.fn(),
      },
      userPermission: {
        findMany: jest.fn(),
      },
    };
  });

  const mockContext = (user: any, permissions: string[] = []) => {
    const context = {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;

    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(permissions);
    return context;
  };

  it('should allow access if no permissions are required', async () => {
    const context = mockContext({ id: '1', role: 'ADMIN' }, []);
    expect(await guard.canActivate(context)).toBe(true);
  });

  it('should allow ADMIN with correct role permissions', async () => {
    const context = mockContext({ id: 'admin-id', role: 'ADMIN' }, ['hr:employees:read']);
    
    (guard as any).prisma.rolePermission.findMany.mockResolvedValue([
      { permission: { key: 'hr:employees:read' } },
    ]);
    (guard as any).prisma.userPermission.findMany.mockResolvedValue([]);

    expect(await guard.canActivate(context)).toBe(true);
  });

  it('should block user if missing permission', async () => {
    const context = mockContext({ id: 'user-id', role: 'CS_AGENT' }, ['hr:employees:read']);
    
    (guard as any).prisma.rolePermission.findMany.mockResolvedValue([]);
    (guard as any).prisma.userPermission.findMany.mockResolvedValue([]);

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should block even if role has permission but user has DENY override', async () => {
    const context = mockContext({ id: 'user-id', role: 'HR_MANAGER' }, ['hr:employees:delete']);
    
    (guard as any).prisma.rolePermission.findMany.mockResolvedValue([
      { permission: { key: 'hr:employees:delete' } },
    ]);
    (guard as any).prisma.userPermission.findMany.mockResolvedValue([
      { permission: { key: 'hr:employees:delete' }, effect: PermissionEffect.DENY },
    ]);

    await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
  });

  it('should allow if role lacks permission but user has ALLOW override', async () => {
    const context = mockContext({ id: 'user-id', role: 'CS_AGENT' }, ['hr:employees:read']);
    
    (guard as any).prisma.rolePermission.findMany.mockResolvedValue([]);
    (guard as any).prisma.userPermission.findMany.mockResolvedValue([
      { permission: { key: 'hr:employees:read' }, effect: PermissionEffect.ALLOW },
    ]);

    expect(await guard.canActivate(context)).toBe(true);
  });
});
