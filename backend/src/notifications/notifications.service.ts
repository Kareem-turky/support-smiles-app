import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class NotificationsService {
    constructor(private prisma: PrismaService) { }

    async findAll(user: User) {
        return this.prisma.notification.findMany({
            where: { user_id: user.id },
            orderBy: { created_at: 'desc' },
        });
    }

    async markRead(id: string, user: User) {
        const notification = await this.prisma.notification.findUnique({
            where: { id },
        });

        if (!notification) {
            throw new NotFoundException('Notification not found');
        }

        if (notification.user_id !== user.id) {
            throw new ForbiddenException('Access denied');
        }

        return this.prisma.notification.update({
            where: { id },
            data: { is_read: true },
        });
    }

    async markAllRead(user: User) {
        return this.prisma.notification.updateMany({
            where: { user_id: user.id, is_read: false },
            data: { is_read: true },
        });
    }
}
