import {
  Injectable,
  UnauthorizedException,
  ForbiddenException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { LoginDto } from './dto/login.dto';
import { ConfigService } from '@nestjs/config';
import { normalizeEmail } from '../common/utils/email.utils';
import { PermissionEffect } from '@prisma/client';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { ConflictException } from '@nestjs/common';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  async login(loginDto: LoginDto) {
    console.log('Login attempt for:', loginDto.email);
    const normalizedEmail = normalizeEmail(loginDto.email);
    const user = await this.prisma.user.findUnique({
      where: { email_normalized: normalizedEmail },
    });

    if (!user) {
      console.log('User not found');
      throw new UnauthorizedException('Invalid email or password');
    }

    if (!user.is_active) {
      console.log('User inactive');
      throw new ForbiddenException('Account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(
      loginDto.password,
      user.password_hash,
    );
    if (!isPasswordValid) {
      console.log('Invalid password');
      throw new UnauthorizedException('Invalid email or password');
    }

    const payload = { sub: user.id, email: user.email, role: user.role };

    // Create refresh token
    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn:
        this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d',
    } as any);

    // Store refresh token
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.prisma.refreshToken
      .upsert({
        where: { token: refreshToken },
        create: {
          token: refreshToken,
          user_id: user.id,
          expires_at: expiresAt,
        },
        update: {
          expires_at: expiresAt,
        },
      })
      .catch(async () => {
        await this.prisma.refreshToken.deleteMany({
          where: { user_id: user.id },
        });
        await this.prisma.refreshToken.create({
          data: {
            token: refreshToken,
            user_id: user.id,
            expires_at: expiresAt,
          },
        });
      });

    return {
      success: true,
      data: {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
          permissions: Array.from(await this.getUserPermissions(user.id, user.role)),
        },

        access_token: this.jwtService.sign(payload),
        refresh_token: refreshToken,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      },
    };
  }

  async refresh(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      });

      const tokenRecord = await this.prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });

      if (!tokenRecord || tokenRecord.expires_at < new Date()) {
        throw new UnauthorizedException('Invalid or expired refresh token');
      }

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user) {
        throw new UnauthorizedException('User not found');
      }

      const newPayload = { sub: user.id, email: user.email, role: user.role };

      return {
        success: true,
        data: {
          access_token: this.jwtService.sign(newPayload),
          refresh_token: refreshToken,
          expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
        },
      };
    } catch (e) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  async logout(userId: string) {
    await this.prisma.refreshToken.deleteMany({ where: { user_id: userId } });
    return { success: true };
  }

  async impersonate(targetUserId: string) {
    const targetUser = await this.prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      throw new UnauthorizedException('Target user not found');
    }

    if (!targetUser.is_active) {
      throw new ForbiddenException('Target account is deactivated');
    }

    const payload = {
      sub: targetUser.id,
      email: targetUser.email,
      role: targetUser.role,
    };

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get<string>('JWT_REFRESH_SECRET'),
      expiresIn:
        this.configService.get<string>('JWT_REFRESH_EXPIRATION') || '7d',
    } as any);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        user_id: targetUser.id,
        expires_at: expiresAt,
      },
    });

    return {
      success: true,
      data: {
        user: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email,
          role: targetUser.role,
          permissions: Array.from(await this.getUserPermissions(targetUser.id, targetUser.role)),
        },

        access_token: this.jwtService.sign(payload),
        refresh_token: refreshToken,
        expires_at: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
      },
    };
  }
  async getProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) throw new UnauthorizedException('User not found');

    return {
      success: true,
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        permissions: Array.from(await this.getUserPermissions(user.id, user.role)),
      },
    };
  }

  async updateProfile(userId: string, dto: UpdateProfileDto) {
    const data: any = {};
    if (dto.name !== undefined) {
      data.name = dto.name.trim();
    }
    
    if (dto.email !== undefined) {
      const normalizedEmail = normalizeEmail(dto.email);
      // Check for conflict
      const existing = await this.prisma.user.findUnique({
        where: { email_normalized: normalizedEmail },
      });
      if (existing && existing.id !== userId) {
        throw new ConflictException('Email already in use');
      }
      data.email = dto.email.trim();
      data.email_normalized = normalizedEmail;
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data,
    });

    return {
      success: true,
      data: {
        id: updatedUser.id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        permissions: Array.from(await this.getUserPermissions(updatedUser.id, updatedUser.role)),
      },
    };
  }

  async getUserPermissions(userId: string, role: string): Promise<Set<string>> {
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

