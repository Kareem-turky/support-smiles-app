import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
    constructor(private prisma: PrismaService) { }

    async findAll() {
        return this.prisma.user.findMany({
            select: {
                id: true,
                name: true,
                email: true,
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
        const existingUser = await this.prisma.user.findUnique({
            where: { email: createUserDto.email },
        });

        if (existingUser) {
            throw new BadRequestException('Email already exists');
        }

        const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

        const newUser = await this.prisma.user.create({
            data: {
                name: createUserDto.name,
                email: createUserDto.email,
                password_hash: hashedPassword,
                role: createUserDto.role,
                is_active: true,
            },
            select: {
                id: true,
                name: true,
                email: true,
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
}
