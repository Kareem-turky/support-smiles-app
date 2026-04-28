import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { CalculatePayrollDto } from './dto/calculate-payroll.dto';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { CreateClosingDto } from './dto/create-closing.dto';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';

@Controller('accounting')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class AccountingController {

  constructor(private readonly accountingService: AccountingService) {}

  // --- Payroll ---
  @Get('payroll')
  @Roles(UserRole.ACC_MANAGER, UserRole.ADMIN)
  @RequirePermissions('accounting:payroll:read')
  getPayrollRuns() {
    return this.accountingService.getPayrollRuns();
  }


  @Get('payroll/:id')
  @Roles(UserRole.ACC_MANAGER, UserRole.ADMIN)
  getPayrollRun(@Param('id') id: string) {
    return this.accountingService.getPayrollRun(id);
  }

  @Post('payroll/calculate')
  @Roles(UserRole.ACC_MANAGER, UserRole.ADMIN)
  @RequirePermissions('accounting:payroll:calculate')
  calculatePayroll(@Body() dto: CalculatePayrollDto, @Request() req) {
    return this.accountingService.calculatePayroll(dto, req.user);
  }


  @Post('payroll/:id/approve')
  @Roles(UserRole.ACC_MANAGER, UserRole.ADMIN)
  @RequirePermissions('accounting:payroll:approve')
  approvePayroll(@Param('id') id: string, @Request() req) {
    return this.accountingService.approvePayroll(id, req.user);
  }


  @Post('payroll/:id/pay')
  @Roles(UserRole.ACC_MANAGER, UserRole.ADMIN)
  payPayroll(@Param('id') id: string, @Request() req) {
    return this.accountingService.payPayroll(id, req.user);
  }

  // --- Vendors ---
  @Get('vendors')
  @Roles(UserRole.ACC_MANAGER, UserRole.ACC_AGENT, UserRole.ADMIN)
  getVendors() {
    return this.accountingService.getVendors();
  }

  @Post('vendors')
  @Roles(UserRole.ACC_MANAGER, UserRole.ACC_AGENT, UserRole.ADMIN)
  @RequirePermissions('accounting:vendors:create')
  createVendor(@Body() dto: CreateVendorDto) {
    return this.accountingService.createVendor(dto);
  }


  // --- Deposits ---
  @Get('deposits')
  @Roles(UserRole.ACC_MANAGER, UserRole.ADMIN)
  getDeposits() {
    return this.accountingService.getDeposits();
  }

  @Post('deposits')
  @Roles(UserRole.ACC_MANAGER, UserRole.ADMIN)
  @RequirePermissions('accounting:deposits:create')
  createDeposit(@Body() dto: CreateDepositDto) {
    return this.accountingService.createDeposit(dto);
  }


  // --- Purchases ---
  @Get('purchases')
  @Roles(UserRole.ACC_MANAGER, UserRole.ACC_AGENT, UserRole.ADMIN)
  getPurchases() {
    return this.accountingService.getPurchases();
  }

  @Post('purchases')
  @Roles(UserRole.ACC_MANAGER, UserRole.ACC_AGENT, UserRole.ADMIN)
  @RequirePermissions('accounting:purchases:create')
  createPurchase(@Body() dto: CreatePurchaseDto, @Request() req) {
    return this.accountingService.createPurchase(dto, req.user);
  }


  // --- Expenses ---
  @Get('expenses')
  @Roles(UserRole.ACC_MANAGER, UserRole.ACC_AGENT, UserRole.ADMIN)
  getExpenses() {
    return this.accountingService.getExpenses();
  }

  @Post('expenses')
  @Roles(UserRole.ACC_MANAGER, UserRole.ACC_AGENT, UserRole.ADMIN)
  @RequirePermissions('accounting:expenses:create')
  createExpense(@Body() dto: CreateExpenseDto, @Request() req) {
    return this.accountingService.createExpense(dto, req.user);
  }


  // --- Transfers ---
  @Get('transfers')
  @Roles(UserRole.ACC_MANAGER, UserRole.ADMIN)
  getTransfers() {
    return this.accountingService.getTransfers();
  }

  @Post('transfers')
  @Roles(UserRole.ACC_MANAGER, UserRole.ADMIN)
  @RequirePermissions('accounting:transfers:create')
  createTransfer(@Body() dto: CreateTransferDto, @Request() req) {
    return this.accountingService.createTransfer(dto, req.user);
  }


  // --- Closings ---
  @Get('closings')
  @Roles(UserRole.ACC_MANAGER, UserRole.ADMIN)
  getClosings() {
    return this.accountingService.getClosings();
  }

  @Post('closings')
  @Roles(UserRole.ACC_MANAGER, UserRole.ADMIN)
  createClosing(@Body() dto: CreateClosingDto, @Request() req) {
    return this.accountingService.createClosing(dto, req.user);
  }
  @Get('stats')
  @Roles(UserRole.ACC_MANAGER, UserRole.ADMIN)
  getStats() {
    return this.accountingService.getStats();
  }

  // --- Review Deductions ---
  @Get('review-deductions')
  @Roles(UserRole.ACC_MANAGER, UserRole.ADMIN)
  getReviewDeductions() {
    return this.accountingService.getReviewDeductions();
  }

  @Patch('review-deductions/:id/approve')
  @Roles(UserRole.ACC_MANAGER, UserRole.ADMIN)
  @RequirePermissions('accounting:deductions:update')
  approveReviewDeduction(@Param('id') id: string, @Request() req) {
    return this.accountingService.approveReviewDeduction(id, req.user);
  }

  @Patch('review-deductions/:id/reject')
  @Roles(UserRole.ACC_MANAGER, UserRole.ADMIN)
  @RequirePermissions('accounting:deductions:update')
  rejectReviewDeduction(@Param('id') id: string, @Request() req) {
    return this.accountingService.rejectReviewDeduction(id, req.user);
  }

}
