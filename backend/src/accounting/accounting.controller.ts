import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { AccountingService } from './accounting.service';
import { CalculatePayrollDto } from './dto/calculate-payroll.dto';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { CreateClosingDto } from './dto/create-closing.dto';
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
    @Roles(UserRole.ACCOUNTING, UserRole.ADMIN)
    getPayrollRuns() {
        return this.accountingService.getPayrollRuns();
    }

    @Get('payroll/:id')
    @Roles(UserRole.ACCOUNTING, UserRole.ADMIN)
    getPayrollRun(@Param('id') id: string) {
        return this.accountingService.getPayrollRun(id);
    }

    @Post('payroll/calculate')
    @Roles(UserRole.ACCOUNTING, UserRole.ADMIN)
    calculatePayroll(@Body() dto: CalculatePayrollDto, @Request() req) {
        return this.accountingService.calculatePayroll(dto, req.user);
    }

    @Post('payroll/:id/approve')
    @Roles(UserRole.ACCOUNTING, UserRole.ADMIN)
    approvePayroll(@Param('id') id: string, @Request() req) {
        return this.accountingService.approvePayroll(id, req.user);
    }

    @Post('payroll/:id/pay')
    @Roles(UserRole.ACCOUNTING, UserRole.ADMIN)
    payPayroll(@Param('id') id: string, @Request() req) {
        return this.accountingService.payPayroll(id, req.user);
    }

    // --- Purchases ---
    @Get('purchases')
    @Roles(UserRole.ACCOUNTING, UserRole.ADMIN)
    getPurchases() {
        return this.accountingService.getPurchases();
    }

    @Post('purchases')
    @Roles(UserRole.ACCOUNTING, UserRole.ADMIN)
    createPurchase(@Body() dto: CreatePurchaseDto, @Request() req) {
        return this.accountingService.createPurchase(dto, req.user);
    }

    // --- Expenses ---
    @Get('expenses')
    @Roles(UserRole.ACCOUNTING, UserRole.ADMIN)
    getExpenses() {
        return this.accountingService.getExpenses();
    }

    @Post('expenses')
    @Roles(UserRole.ACCOUNTING, UserRole.ADMIN)
    createExpense(@Body() dto: CreateExpenseDto, @Request() req) {
        return this.accountingService.createExpense(dto, req.user);
    }

    // --- Transfers ---
    @Get('transfers')
    @Roles(UserRole.ACCOUNTING, UserRole.ADMIN)
    getTransfers() {
        return this.accountingService.getTransfers();
    }

    @Post('transfers')
    @Roles(UserRole.ACCOUNTING, UserRole.ADMIN)
    createTransfer(@Body() dto: CreateTransferDto, @Request() req) {
        return this.accountingService.createTransfer(dto, req.user);
    }

    // --- Closings ---
    @Get('closings')
    @Roles(UserRole.ACCOUNTING, UserRole.ADMIN)
    getClosings() {
        return this.accountingService.getClosings();
    }

    @Post('closings')
    @Roles(UserRole.ACCOUNTING, UserRole.ADMIN)
    createClosing(@Body() dto: CreateClosingDto, @Request() req) {
        return this.accountingService.createClosing(dto, req.user);
    }
}
