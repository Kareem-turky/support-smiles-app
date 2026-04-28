import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserPermissionDto } from './dto/update-user-permission.dto';
import { PermissionEffect } from '@prisma/client';

@Injectable()
export class PermissionsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.permission.findMany({
      orderBy: { domain: 'asc' },
    });
  }

  async getUserPermissions(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        personal_permissions: {
          include: { permission: true },
        },
      },
    });

    if (!user) throw new NotFoundException('User not found');

    const rolePermissions = await this.prisma.rolePermission.findMany({
      where: { role: user.role },
      include: { permission: true },
    });

    return {
      role: user.role,
      role_permissions: rolePermissions.map(rp => rp.permission.key),
      overrides: user.personal_permissions.map(up => ({
        key: up.permission.key,
        effect: up.effect,
      })),
    };
  }

  async updateUserPermission(userId: string, dto: UpdateUserPermissionDto) {
    const permission = await this.prisma.permission.findUnique({
      where: { key: dto.permission_key },
    });

    if (!permission) throw new NotFoundException('Permission not found');

    return this.prisma.userPermission.upsert({
      where: {
        user_id_permission_id: {
          user_id: userId,
          permission_id: permission.id,
        },
      },
      update: { effect: dto.effect },
      create: {
        user_id: userId,
        permission_id: permission.id,
        effect: dto.effect,
      },
    });
  }

  async removeUserPermission(userId: string, permissionKey: string) {
    const permission = await this.prisma.permission.findUnique({
      where: { key: permissionKey },
    });

    if (!permission) throw new NotFoundException('Permission not found');

    return this.prisma.userPermission.delete({
      where: {
        user_id_permission_id: {
          user_id: userId,
          permission_id: permission.id,
        },
      },
    });
  }
}
