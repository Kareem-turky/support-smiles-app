import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { ShippingService } from './shipping.service';
import { CreateShippingCompanyDto } from './dto/create-shipping-company.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('shipping')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ShippingController {
    constructor(private readonly shippingService: ShippingService) { }

    @Post('companies')
    @Roles(UserRole.ADMIN, UserRole.WH_MANAGER)
    create(@Body() dto: CreateShippingCompanyDto) {
        return this.shippingService.create(dto);
    }

    @Get('companies')
    findAll() {
        return this.shippingService.findAll();
    }
}
