import { Controller, Get, Param, Patch, Body, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
    constructor(private usersService: UsersService) { }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.ACCOUNTING)
    findAll() {
        return this.usersService.findAll();
    }

    @Patch(':id')
    @Roles(UserRole.ADMIN)
    updateStatus(@Param('id') id: string, @Body('is_active') isActive: boolean) {
        return this.usersService.updateStatus(id, isActive);
    }
}
