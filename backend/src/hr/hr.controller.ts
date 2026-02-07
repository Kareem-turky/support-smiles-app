import { Controller, Get, Post, Body, Param, Query, UseGuards, Delete, ParseIntPipe, Request } from '@nestjs/common';
import { HRService } from './hr.service';
import { CreateAttendanceDto, BulkAttendanceDto } from './dto/create-attendance.dto';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { CreateDeductionDto } from './dto/create-deduction.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('hr')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HRController {
    constructor(private readonly hrService: HRService) { }

    // --- Months ---
    @Get('months')
    @Roles(UserRole.HR, UserRole.ADMIN, UserRole.ACCOUNTING)
    getMonths() {
        return this.hrService.getMonths();
    }

    @Post('months/:year/:month/submit')
    @Roles(UserRole.HR, UserRole.ADMIN)
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
    @Roles(UserRole.HR, UserRole.ADMIN)
    getAttendance(@Query('from') from: string, @Query('to') to: string, @Query('employeeId') employeeId?: string) {
        return this.hrService.getAttendance(from, to, employeeId);
    }

    @Post('attendance')
    @Roles(UserRole.HR, UserRole.ADMIN)
    upsertAttendance(@Body() dto: CreateAttendanceDto, @Request() req) {
        return this.hrService.upsertAttendance(dto, req.user);
    }

    @Post('attendance/bulk')
    @Roles(UserRole.HR, UserRole.ADMIN)
    bulkUpsertAttendance(@Body() dto: BulkAttendanceDto, @Request() req) {
        return this.hrService.bulkUpsertAttendance(dto, req.user);
    }

    // --- Leaves ---
    @Get('leaves')
    @Roles(UserRole.HR, UserRole.ADMIN)
    getLeaves() {
        return this.hrService.getLeaves();
    }

    @Post('leaves')
    @Roles(UserRole.HR, UserRole.ADMIN)
    createLeave(@Body() dto: CreateLeaveDto, @Request() req) {
        return this.hrService.createLeave(dto, req.user);
    }

    // --- Deductions ---
    @Get('deductions')
    @Roles(UserRole.HR, UserRole.ADMIN, UserRole.ACCOUNTING)
    getDeductions(@Query('year', ParseIntPipe) year: number, @Query('month', ParseIntPipe) month: number, @Query('employeeId') employeeId?: string) {
        return this.hrService.getDeductions(year, month, employeeId);
    }

    @Post('deductions')
    @Roles(UserRole.HR, UserRole.ADMIN)
    createDeduction(@Body() dto: CreateDeductionDto, @Request() req) {
        return this.hrService.createDeduction(dto, req.user);
    }

    @Delete('deductions/:id')
    @Roles(UserRole.HR, UserRole.ADMIN)
    deleteDeduction(@Param('id') id: string) {
        return this.hrService.deleteDeduction(id);
    }
}
