import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderDto } from './dto/create-order.dto';

@Injectable()
export class OrdersService {
    constructor(private prisma: PrismaService) { }

    async create(dto: CreateOrderDto) {
        const count = await this.prisma.order.count();
        const orderNumber = `ORD-${new Date().getFullYear()}-${String(count + 1).padStart(4, '0')}`;

        return this.prisma.order.create({
            data: {
                order_number: orderNumber,
                customer_name: dto.customer_name,
                status: 'PENDING',
            },
        });
    }

    async findAll() {
        return this.prisma.order.findMany({
            include: { shipping_company: true },
            orderBy: { created_at: 'desc' },
        });
    }
}
