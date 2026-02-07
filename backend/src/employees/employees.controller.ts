import { Controller, Get, Post, Patch, Body, Param, Query, UseGuards } from '@nestjs/common';
import { EmployeesService } from './employees.service';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('employees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class EmployeesController {
    constructor(private readonly employeesService: EmployeesService) { }

    @Get()
    @Roles(UserRole.HR, UserRole.ACCOUNTING, UserRole.ADMIN)
    findAll(@Query('active') active?: string) {
        return this.employeesService.findAll(active === 'true');
    }

    @Get(':id')
    @Roles(UserRole.HR, UserRole.ACCOUNTING, UserRole.ADMIN)
    findOne(@Param('id') id: string) {
        return this.employeesService.findOne(id);
    }

    @Post()
    @Roles(UserRole.HR, UserRole.ADMIN)
    create(@Body() createEmployeeDto: CreateEmployeeDto) {
        return this.employeesService.create(createEmployeeDto);
    }

    @Patch(':id')
    @Roles(UserRole.HR, UserRole.ADMIN)
    update(@Param('id') id: string, @Body() updateEmployeeDto: UpdateEmployeeDto) {
        return this.employeesService.update(id, updateEmployeeDto);
    }
}
