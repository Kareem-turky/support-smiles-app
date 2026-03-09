import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateOrderDto, userId: string) {
        const count = await this.prisma.order.count();
        const orderNumber = `ORD-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

        return this.prisma.order.create({
            data: {
                order_number: orderNumber,
                customer_name: dto.customer_name,
                department_id: dto.department_id,
                assigned_employee_id: dto.assigned_employee_id,
                shipping_company_id: dto.shipping_company_id,
                amount: dto.amount,
                notes: dto.notes,
                created_by_user_id: userId,
                assigned_by_user_id: dto.assigned_employee_id ? userId : undefined,
                status: 'PENDING',
            },
        });
    }

    async findAll(filters: any = {}) {
        const where: any = {};
        if (filters.status) where.status = filters.status;
        if (filters.department_id) where.department_id = filters.department_id;
        if (filters.assigned_employee_id) where.assigned_employee_id = filters.assigned_employee_id;
        if (filters.start_date && filters.end_date) {
            where.created_at = {
                gte: new Date(filters.start_date),
                lte: new Date(filters.end_date),
            };
        }

        return this.prisma.order.findMany({
            where,
            include: {
                shipping_company: true,
                department: true,
                assigned_employee: true,
                created_by: { select: { name: true, email: true } },
                assigned_by: { select: { name: true, email: true } },
            },
            orderBy: { created_at: 'desc' },
        });
    }

    async findOne(id: string) {
        return this.prisma.order.findUnique({
            where: { id },
            include: {
                shipping_company: true,
                department: true,
                assigned_employee: true,
                created_by: { select: { name: true, email: true } },
                assigned_by: { select: { name: true, email: true } },
            },
        });
    }

    async update(id: string, dto: any, userId: string) {
        const currentOrder = await this.prisma.order.findUnique({ where: { id } });
        if (!currentOrder) throw new Error('Order not found');

        const updateData: any = { ...dto };
        if (dto.assigned_employee_id && currentOrder.assigned_employee_id !== dto.assigned_employee_id) {
            updateData.assigned_by_user_id = userId;
        }

        return this.prisma.order.update({
            where: { id },
            data: updateData,
        });
    }
}
