import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
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

@Controller('accounting')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AccountingController {
    constructor(private readonly accountingService: AccountingService) { }

    // --- Payroll ---
    @Get('payroll')
    @Roles(UserRole.ACC_MANAGER, UserRole.ADMIN)
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
    calculatePayroll(@Body() dto: CalculatePayrollDto, @Request() req) {
        return this.accountingService.calculatePayroll(dto, req.user);
    }

    @Post('payroll/:id/approve')
    @Roles(UserRole.ACC_MANAGER, UserRole.ADMIN)
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
    @Roles(UserRole.ACC_MANAGER, UserRole.ACC_CLERK, UserRole.ADMIN)
    getVendors() {
        return this.accountingService.getVendors();
    }

    @Post('vendors')
    @Roles(UserRole.ACC_MANAGER, UserRole.ACC_CLERK, UserRole.ADMIN)
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
    createDeposit(@Body() dto: CreateDepositDto) {
        return this.accountingService.createDeposit(dto);
    }

    // --- Purchases ---
    @Get('purchases')
    @Roles(UserRole.ACC_MANAGER, UserRole.ACC_CLERK, UserRole.ADMIN)
    getPurchases() {
        return this.accountingService.getPurchases();
    }

    @Post('purchases')
    @Roles(UserRole.ACC_MANAGER, UserRole.ACC_CLERK, UserRole.ADMIN)
    createPurchase(@Body() dto: CreatePurchaseDto, @Request() req) {
        return this.accountingService.createPurchase(dto, req.user);
    }

    // --- Expenses ---
    @Get('expenses')
    @Roles(UserRole.ACC_MANAGER, UserRole.ACC_CLERK, UserRole.ADMIN)
    getExpenses() {
        return this.accountingService.getExpenses();
    }

    @Post('expenses')
    @Roles(UserRole.ACC_MANAGER, UserRole.ACC_CLERK, UserRole.ADMIN)
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
}
