import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PrismaClient, PermissionEffect } from '@prisma/client';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  private prisma = new PrismaClient();

  constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    if (!user) {
      return false;
    }

    // Check Feature Flag
    const isEnforced = await this.checkEnforcementFlag();
    if (!isEnforced) {
      return true; // Fallback to RBAC only (RolesGuard handles that)
    }

    const userPermissions = await this.getUserPermissions(user.id, user.role);

    // All required permissions must be present in userPermissions and not DENY
    const hasPermission = requiredPermissions.every((permission) =>
      userPermissions.has(permission),
    );

    if (!hasPermission) {
      throw new ForbiddenException('Access Denied: Missing required permissions');
    }

    return true;
  }

  private async checkEnforcementFlag(): Promise<boolean> {
    // Check .env first
    if (process.env.PERMISSIONS_ENFORCED === 'false') return false;
    
    // Check DB
    try {
      const flag = await this.prisma.featureFlag.findUnique({
        where: { key: 'PERMISSIONS_ENFORCED' },
      });
      return flag?.is_enabled ?? true;
    } catch {
      return true;
    }
  }

  private async getUserPermissions(userId: string, role: string): Promise<Set<string>> {
    const effectivePermissions = new Set<string>();

    // 1. Get Role Permissions
    const rolePerms = await this.prisma.rolePermission.findMany({
      where: { role: role as any },
      include: { permission: true },
    });
    rolePerms.forEach((rp) => effectivePermissions.add(rp.permission.key));

    // 2. Get User Specific Overrides
    const userPerms = await this.prisma.userPermission.findMany({
      where: { user_id: userId },
      include: { permission: true },
    });

    userPerms.forEach((up) => {
      if (up.effect === PermissionEffect.ALLOW) {
        effectivePermissions.add(up.permission.key);
      } else {
        effectivePermissions.delete(up.permission.key); // DENY wins
      }
    });

    return effectivePermissions;
  }
}
