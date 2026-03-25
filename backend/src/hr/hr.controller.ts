import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Delete,
  ParseIntPipe,
  Request,
} from '@nestjs/common';
import { HRService } from './hr.service';
import {
  CreateAttendanceDto,
  BulkAttendanceDto,
} from './dto/create-attendance.dto';
import { CreateLeaveDto } from './dto/create-leave.dto';
import { CreateEmployeeDto } from './dto/create-employee.dto';
import { UpdateEmployeeDto } from './dto/update-employee.dto';
import { CreateDepartmentDto } from './dto/create-department.dto';
import { CreateAdjustmentDto } from './dto/create-adjustment.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('hr')
@UseGuards(JwtAuthGuard, RolesGuard)
export class HRController {
  constructor(private readonly hrService: HRService) {}

  // --- Departments ---
  @Get('departments')
  // Open to all authenticated users for dropdowns
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
  // Open to all authenticated users for dropdowns
  async getEmployees(@Request() req: any) {
    if (req.user.role === UserRole.ADMIN) {
      return this.hrService.getEmployees();
    }

    // Find the calling user's department
    const employee = await this.hrService.getEmployeeByUserId(req.user.id);
    return this.hrService.getEmployees(employee?.department_id);
  }

  @Post('employees')
  @Roles(UserRole.HR_MANAGER, UserRole.ADMIN)
  createEmployee(@Body() dto: CreateEmployeeDto) {
    return this.hrService.createEmployee(dto);
  }

  @Put('employees/:id')
  @Roles(UserRole.HR_MANAGER, UserRole.ADMIN)
  updateEmployee(@Param('id') id: string, @Body() dto: UpdateEmployeeDto) {
    return this.hrService.updateEmployee(id, dto);
  }

  @Delete('employees/:id')
  @Roles(UserRole.ADMIN)
  deleteEmployee(@Param('id') id: string) {
    return this.hrService.deleteEmployee(id);
  }

  @Post('employees/:id/toggle-status')
  @Roles(UserRole.HR_MANAGER, UserRole.ADMIN)
  toggleEmployeeStatus(@Param('id') id: string) {
    return this.hrService.toggleEmployeeStatus(id);
  }

  @Post('employees/:id/reset-password')
  @Roles(UserRole.ADMIN)
  resetEmployeePassword(@Param('id') id: string) {
    return this.hrService.resetEmployeePassword(id);
  }

  @Get('adjustments')
  @Roles(
    UserRole.HR_MANAGER,
    UserRole.HR_AGENT,
    UserRole.ADMIN,
    UserRole.ACC_MANAGER,
  )
  getAdjustments(
    @Query('employeeId') employeeId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('type') type?: string,
  ) {
    // @ts-ignore
    return this.hrService.getAdjustments(employeeId, from, to, type);
  }

  @Post('adjustments')
  @Roles(UserRole.HR_MANAGER, UserRole.ADMIN)
  createAdjustment(@Body() dto: CreateAdjustmentDto, @Request() req) {
    return this.hrService.createAdjustment(dto, req.user);
  }

  // --- Months ---
  @Get('months')
  @Roles(
    UserRole.HR_MANAGER,
    UserRole.HR_AGENT,
    UserRole.ADMIN,
    UserRole.ACC_MANAGER,
  )
  getMonths() {
    return this.hrService.getMonths();
  }

  @Post('months/:year/:month/submit')
  @Roles(UserRole.HR_MANAGER, UserRole.ADMIN)
  submitMonth(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
    @Request() req,
  ) {
    return this.hrService.submitMonth(year, month, req.user);
  }

  @Post('months/:year/:month/lock')
  @Roles(UserRole.ADMIN)
  lockMonth(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
    @Request() req,
  ) {
    return this.hrService.lockMonth(year, month, req.user);
  }

  @Post('months/:year/:month/reopen')
  @Roles(UserRole.ADMIN)
  reopenMonth(
    @Param('year', ParseIntPipe) year: number,
    @Param('month', ParseIntPipe) month: number,
    @Request() req,
  ) {
    return this.hrService.reopenMonth(year, month, req.user);
  }

  // --- Attendance ---
  @Get('attendance')
  @Roles(UserRole.HR_MANAGER, UserRole.HR_AGENT, UserRole.ADMIN)
  getAttendance(
    @Query('from') from: string,
    @Query('to') to: string,
    @Query('employeeId') employeeId?: string,
  ) {
    return this.hrService.getAttendance(from, to, employeeId);
  }

  @Post('attendance')
  @Roles(UserRole.HR_MANAGER, UserRole.HR_AGENT, UserRole.ADMIN)
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
  @Roles(UserRole.HR_MANAGER, UserRole.HR_AGENT, UserRole.ADMIN)
  getLeaves() {
    return this.hrService.getLeaves();
  }

  @Post('leaves')
  @Roles(UserRole.HR_MANAGER, UserRole.HR_AGENT, UserRole.ADMIN)
  createLeave(@Body() dto: CreateLeaveDto, @Request() req) {
    return this.hrService.createLeave(dto, req.user);
  }
}
