import { Controller, Get, Post, Body, Param, Query, UseGuards, Delete, ParseIntPipe, Request } from '@nestjs/common';
import { HRService } from './hr.service';
import { CreateAttendanceDto, BulkAttendanceDto } from './dto/create-attendance.dto';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { CreateAdjustmentDto } from './dto/create-adjustment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('hr')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HRController {
    constructor(private readonly hrService: HRService) { }

    // --- Departments ---
    @Get('departments')
    @Roles(UserRole.HR_MANAGER, UserRole.HR_ASSISTANT, UserRole.ADMIN)
    getDepartments() {
        return this.hrService.getDepartments();
    }

    @Post('departments')
    @Roles(UserRole.HR_MANAGER, UserRole.ADMIN)
    createDepartment(@Body() dto: CreateDepartmentDto) {
        return this.hrService.createDepartment(dto);
    }

    // --- Employees ---
    @Get('employees')
    @Roles(UserRole.HR_MANAGER, UserRole.HR_ASSISTANT, UserRole.ADMIN, UserRole.ACC_MANAGER, UserRole.ACC_CLERK)
    getEmployees() {
        return this.hrService.getEmployees();
    }

    @Post('employees')
    @Roles(UserRole.HR_MANAGER, UserRole.ADMIN)
    createEmployee(@Body() dto: CreateEmployeeDto) {
        return this.hrService.createEmployee(dto);
    }

    // --- Adjustments ---
    @Get('adjustments')
    @Roles(UserRole.HR_MANAGER, UserRole.HR_ASSISTANT, UserRole.ADMIN, UserRole.ACC_MANAGER)
    getAdjustments(@Query('employeeId') employeeId?: string, @Query('from') from?: string, @Query('to') to?: string) {
        return this.hrService.getAdjustments(employeeId, from, to);
    }

    @Post('adjustments')
    @Roles(UserRole.HR_MANAGER, UserRole.ADMIN)
    createAdjustment(@Body() dto: CreateAdjustmentDto, @Request() req) {
        return this.hrService.createAdjustment(dto, req.user);
    }

    // --- Months ---
    @Get('months')
    @Roles(UserRole.HR_MANAGER, UserRole.HR_ASSISTANT, UserRole.ADMIN, UserRole.ACC_MANAGER)
    getMonths() {
        return this.hrService.getMonths();
    }

    @Post('months/:year/:month/submit')
    @Roles(UserRole.HR_MANAGER, UserRole.ADMIN)
    submitMonth(@Param('year', ParseIntPipe) year: number, @Param('month', ParseIntPipe) month: number, @Request() req) {
        return this.hrService.submitMonth(year, month, req.user);
    }

    @Post('months/:year/:month/lock')
    @Roles(UserRole.ADMIN)
    lockMonth(@Param('year', ParseIntPipe) year: number, @Param('month', ParseIntPipe) month: number, @Request() req) {
        return this.hrService.lockMonth(year, month, req.user);
    }

    @Post('months/:year/:month/reopen')
    @Roles(UserRole.ADMIN)
    reopenMonth(@Param('year', ParseIntPipe) year: number, @Param('month', ParseIntPipe) month: number, @Request() req) {
        return this.hrService.reopenMonth(year, month, req.user);
    }

    // --- Attendance ---
    @Get('attendance')
    @Roles(UserRole.HR_MANAGER, UserRole.HR_ASSISTANT, UserRole.ADMIN)
    getAttendance(@Query('from') from: string, @Query('to') to: string, @Query('employeeId') employeeId?: string) {
        return this.hrService.getAttendance(from, to, employeeId);
    }

    @Post('attendance')
    @Roles(UserRole.HR_MANAGER, UserRole.HR_ASSISTANT, UserRole.ADMIN)
    upsertAttendance(@Body() dto: CreateAttendanceDto, @Request() req) {
        return this.hrService.upsertAttendance(dto, req.user);
    }

    @Post('attendance/bulk')
    @Roles(UserRole.HR_MANAGER, UserRole.ADMIN)
    bulkUpsertAttendance(@Body() dto: BulkAttendanceDto, @Request() req) {
        return this.hrService.bulkUpsertAttendance(dto, req.user);
    }

    // --- Leaves ---
    @Get('leaves')
    @Roles(UserRole.HR_MANAGER, UserRole.HR_ASSISTANT, UserRole.ADMIN)
    getLeaves() {
        return this.hrService.getLeaves();
    }

    @Post('leaves')
    @Roles(UserRole.HR_MANAGER, UserRole.HR_ASSISTANT, UserRole.ADMIN)
    createLeave(@Body() dto: CreateLeaveDto, @Request() req) {
        return this.hrService.createLeave(dto, req.user);
    }
}
