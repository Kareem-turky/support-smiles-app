import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { TicketReasonsService } from './ticket-reasons.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole, TicketReasonCategory } from '@prisma/client';

@Controller('admin/ticket-reasons')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminTicketReasonsController {
    constructor(private service: TicketReasonsService) { }

    @Get()
    async findAll() {
        return this.service.findAll(false); // All reasons (active & inactive)
    }

    @Post()
    async create(@Body() body: {
        name: string;
        category: TicketReasonCategory;
        sort_order?: number;
        default_assign_role?: UserRole;
        default_priority?: any;
    }) {
        return this.service.create(body);
    }

    @Patch(':id')
    async update(@Param('id') id: string, @Body() body: any) {
        return this.service.update(id, body);
    }

    @Patch(':id/toggle-active')
    async toggleActive(@Param('id') id: string) {
        const reason = await this.service.findOne(id);
        return this.service.update(id, { is_active: !reason.is_active });
    }
}
