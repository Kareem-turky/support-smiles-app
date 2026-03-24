import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TicketReason, TicketReasonCategory, Prisma } from '@prisma/client';

@Injectable()
export class TicketReasonsService {
    constructor(private prisma: PrismaService) { }

    async findAll(activeOnly: boolean = false) {
        const where: Prisma.TicketReasonWhereInput = activeOnly ? { is_active: true } : {};
        return this.prisma.ticketReason.findMany({
            where,
            orderBy: [
                { sort_order: 'asc' },
                { name: 'asc' },
            ],
        });
    }

    async findOne(id: string) {
        const reason = await this.prisma.ticketReason.findUnique({ where: { id } });
        if (!reason) throw new NotFoundException('Reason not found');
        return reason;
    }

    async create(data: {
        name: string;
        category: TicketReasonCategory;
        sort_order?: number;
        is_active?: boolean;
        default_assign_role?: any; // UserRole
        default_priority?: any; // Priority 
    }) {
        // Check dupe name
        const existing = await this.prisma.ticketReason.findUnique({ where: { name: data.name } });
        if (existing) throw new ConflictException('Reason with this name already exists');

        return this.prisma.ticketReason.create({
            data: {
                name: data.name,
                category: data.category,
                sort_order: data.sort_order ?? 0,
                is_active: data.is_active ?? true,
                default_assign_role: data.default_assign_role,
                default_priority: data.default_priority,
            },
        });
    }

    async update(id: string, data: {
        name?: string;
        category?: TicketReasonCategory;
        sort_order?: number;
        is_active?: boolean;
        default_assign_role?: any;
        default_priority?: any;
    }) {
        // Check exists
        await this.findOne(id);

        if (data.name) {
            const existing = await this.prisma.ticketReason.findUnique({ where: { name: data.name } });
            if (existing && existing.id !== id) throw new ConflictException('Reason name taken');
        }

        return this.prisma.ticketReason.update({
            where: { id },
            data,
        });
    }
}
