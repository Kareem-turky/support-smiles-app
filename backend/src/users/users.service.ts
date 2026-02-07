import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

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
}
