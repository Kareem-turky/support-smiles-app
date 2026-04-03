import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { normalizeEmail } from '../common/utils/email.utils';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        email_normalized: true,
        role: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
    });
  }

  async updateStatus(id: string, isActive: boolean) {
    return this.prisma.user.update({
      where: { id },
      data: { is_active: isActive },
    });
  }

  async create(createUserDto: CreateUserDto) {
    const normalizedEmail = normalizeEmail(createUserDto.email);

    const existingUser = await this.prisma.user.findUnique({
      where: { email_normalized: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    const newUser = await this.prisma.user.create({
      data: {
        name: createUserDto.name,
        email: createUserDto.email,
        email_normalized: normalizedEmail,
        password_hash: hashedPassword,
        role: createUserDto.role || UserRole.CS_AGENT,
        is_active: true,
      },
      select: {
        id: true,
        name: true,
        email: true,
        email_normalized: true,
        role: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
    });

    return newUser;
  }

  async updatePassword(id: string, newPassword: string) {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    return this.prisma.user.update({
      where: { id },
      data: { password_hash: hashedPassword },
    });
  }

  async updateUser(id: string, updateUserDto: UpdateUserDto) {
    const data: any = {};
    if (updateUserDto.name !== undefined) {
      data.name = updateUserDto.name.trim();
    }
    
    if (updateUserDto.email !== undefined) {
      const normalizedEmail = normalizeEmail(updateUserDto.email);
      // Check for conflict
      const existingUser = await this.prisma.user.findUnique({
        where: { email_normalized: normalizedEmail },
      });
      if (existingUser && existingUser.id !== id) {
        throw new ConflictException('Email already in use');
      }
      data.email = updateUserDto.email.trim();
      data.email_normalized = normalizedEmail;
    }

    if (updateUserDto.is_active !== undefined) {
      data.is_active = updateUserDto.is_active;
    }

    return this.prisma.user.update({
      where: { id },
      data,
      select: {
        id: true,
        name: true,
        email: true,
        email_normalized: true,
        role: true,
        is_active: true,
        created_at: true,
        updated_at: true,
      },
    });
  }
}

