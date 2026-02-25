import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { CreateVendorDto } from './dto/create-vendor.dto';
import { CreateDepositDto } from './dto/create-deposit.dto';
import { CalculatePayrollDto } from './dto/calculate-payroll.dto';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { CreateClosingDto } from './dto/create-closing.dto';
import { HRMonthStatus, PayrollStatus, User } from '@prisma/client';

@Injectable()
export class AccountingService {
    constructor(private prisma: PrismaService) { }

    // --- Vendors ---
    async getVendors() {
        return this.prisma.vendor.findMany({
            include: { _count: { select: { purchases: true, deposits: true } } }
        });
    }

    async createVendor(dto: CreateVendorDto) {
        return this.prisma.vendor.create({
            data: {
                name: dto.vendor_name,
                phone: dto.phone
            }
        });
    }

    // --- Deposits ---
    async getDeposits() {
        return this.prisma.vendorDeposit.findMany({
            include: { vendor: true },
            orderBy: { date: 'desc' }
        });
    }

    async createDeposit(dto: CreateDepositDto) {
        return this.prisma.vendorDeposit.create({
            data: {
                vendor_id: dto.vendor_id,
                amount: dto.amount,
                date: new Date(dto.date),
                profit_loss: dto.profit_loss,
                notes: dto.notes
            }
        });
    }

    // --- Purchases ---
    async getPurchases() {
        return this.prisma.accountingPurchase.findMany({
            include: {
                vendor: true,
                items: true,
                creator: { select: { name: true } }
            },
            orderBy: { date: 'desc' }
        });
    }

    async createPurchase(dto: CreatePurchaseDto, user: User) {
        const totalAmount = dto.items ? dto.items.reduce((sum, item) => sum + (Number(item.qty) * Number(item.unit_price)), 0) : 0;

        return this.prisma.accountingPurchase.create({
            data: {
                vendor_id: dto.vendor_id,
                date: new Date(dto.date),
                total_amount: totalAmount,
                notes: dto.notes,
                created_by: user.id,
                items: {
                    create: dto.items?.map(item => ({
                        item_name: item.item_name,
                        qty: item.qty,
                        unit_price: item.unit_price,
                        line_total: Number(item.qty) * Number(item.unit_price)
                    }))
                }
            },
            include: { items: true }
        });
    }

    // --- Expenses ---
    async getExpenses() {
        return this.prisma.accountingExpense.findMany({
            include: { creator: { select: { name: true } } },
            orderBy: { date: 'desc' }
        });
    }

    async createExpense(dto: CreateExpenseDto, user: User) {
        return this.prisma.accountingExpense.create({
            data: {
                category: dto.category,
                date: new Date(dto.date),
                amount: dto.amount,
                notes: dto.notes,
                created_by: user.id
            }
        });
    }

    // --- Payroll ---
    async getPayrollRuns() {
        return this.prisma.payrollRun.findMany({
            orderBy: [{ year: 'desc' }, { month: 'desc' }]
        });
    }

    async getPayrollRun(id: string) {
        return this.prisma.payrollRun.findUnique({
            where: { id },
            include: { items: { include: { employee: true } } }
        });
    }

    async calculatePayroll(dto: CalculatePayrollDto, user: User) {
        const { year, month } = dto;

        const hrMonth = await this.prisma.hRMonth.findUnique({
            where: { year_month: { year, month } }
        });
        if (!hrMonth || (hrMonth.status !== HRMonthStatus.SUBMITTED && hrMonth.status !== HRMonthStatus.LOCKED)) {
            throw new BadRequestException('HR Month must be SUBMITTED or LOCKED before calculating payroll.');
        }

        const existingRun = await this.prisma.payrollRun.findUnique({
            where: { year_month: { year, month } }
        });
        if (existingRun && existingRun.status !== PayrollStatus.DRAFT) {
            throw new ConflictException(`Payroll for ${year}-${month} is already ${existingRun.status}`);
        }

        const employees = await this.prisma.employee.findMany({
            where: { is_active: true }
        });

        const adjustments = await this.prisma.hRAdjustment.findMany({
            where: {
                date: {
                    gte: new Date(year, month - 1, 1),
                    lt: new Date(year, month, 1)
                }
            }
        });

        const payrollItemsData = employees.map(emp => {
            const empAdjustments = adjustments.filter(a => a.employee_id === emp.id);
            let totalDeductions = 0;
            let totalBonuses = 0;

            empAdjustments.forEach(adj => {
                if (adj.type === 'DEDUCTION') totalDeductions += Number(adj.amount);
                if (adj.type === 'BONUS') totalBonuses += Number(adj.amount);
            });

            const netSalary = Number(emp.base_salary) - totalDeductions + totalBonuses;

            return {
                employee_id: emp.id,
                base_salary: emp.base_salary,
                total_deductions: totalDeductions,
                adjustments: totalBonuses,
                net_salary: netSalary,
                breakdown_json: JSON.stringify(empAdjustments.map(d => ({ type: d.type, amount: d.amount, reason: d.reason }))),
            };
        });

        return this.prisma.$transaction(async (tx) => {
            let run = existingRun;
            if (!run) {
                run = await tx.payrollRun.create({
                    data: {
                        year,
                        month,
                        status: PayrollStatus.CALCULATED,
                        calculated_by: user.id,
                        calculated_at: new Date(),
                    }
                });
            } else {
                await tx.payrollItem.deleteMany({ where: { payroll_run_id: run.id } });
                run = await tx.payrollRun.update({
                    where: { id: run.id },
                    data: {
                        status: PayrollStatus.CALCULATED,
                        calculated_by: user.id,
                        calculated_at: new Date(),
                    }
                });
            }

            for (const item of payrollItemsData) {
                await tx.payrollItem.create({
                    data: {
                        payroll_run_id: run.id,
                        employee_id: item.employee_id,
                        base_salary: item.base_salary,
                        total_deductions: item.total_deductions,
                        adjustments: item.adjustments,
                        net_salary: item.net_salary,
                        breakdown_json: item.breakdown_json
                    }
                });
            }
            return run;
        });
    }

    async approvePayroll(id: string, user: User) {
        return this.prisma.payrollRun.update({
            where: { id },
            data: {
                status: PayrollStatus.APPROVED,
                approved_by: user.id,
                approved_at: new Date(),
            }
        });
    }

    async payPayroll(id: string, user: User) {
        const run = await this.prisma.payrollRun.update({
            where: { id },
            data: {
                status: PayrollStatus.PAID,
                paid_by: user.id,
                paid_at: new Date(),
            },
            include: { items: true }
        });

        // const totalNet = run.items.reduce((sum, item) => sum + Number(item.net_salary), 0);
        // Auto-transfer logic can be enabled later
        return run;
    }

    // --- Transfers ---
    async createTransfer(dto: CreateTransferDto, user: User) {
        return this.prisma.accountingTransfer.create({
            data: {
                type: dto.type,
                amount: dto.amount,
                method: dto.method,
                date: new Date(dto.date),
                reference_id: dto.reference_id,
                notes: dto.notes,
                created_by: user.id
            }
        });
    }

    async getTransfers() {
        return this.prisma.accountingTransfer.findMany({
            include: { creator: { select: { name: true } } },
            orderBy: { date: 'desc' }
        });
    }

    // --- Closings ---
    async createClosing(dto: CreateClosingDto, user: User) {
        const delta = Number(dto.actual_amount) - Number(dto.expected_amount);
        return this.prisma.accountingClosing.create({
            data: {
                closing_type: dto.closing_type,
                period_from: new Date(dto.period_from),
                period_to: new Date(dto.period_to),
                expected_amount: dto.expected_amount,
                actual_amount: dto.actual_amount,
                delta_amount: delta,
                notes: dto.notes,
                created_by: user.id
            }
        });
    }

    async getClosings() {
        return this.prisma.accountingClosing.findMany({
            include: { creator: { select: { name: true } } },
            orderBy: { period_to: 'desc' }
        });
    }

    // --- Stats ---
    async getStats() {
        const deposits = await this.prisma.vendorDeposit.aggregate({ _sum: { amount: true } });
        const expenses = await this.prisma.accountingExpense.aggregate({ _sum: { amount: true } });
        const purchases = await this.prisma.accountingPurchase.aggregate({ _sum: { total_amount: true } });

        const totalIncome = Number(deposits._sum.amount || 0);
        const totalExpenses = Number(expenses._sum.amount || 0) + Number(purchases._sum.total_amount || 0);
        const netProfit = totalIncome - totalExpenses;

        const recentTransactions = [
            ...(await this.prisma.vendorDeposit.findMany({ take: 5, orderBy: { date: 'desc' }, include: { vendor: true } })).map(d => ({ type: 'DEPOSIT', amount: Number(d.amount), date: d.date, description: `Deposit from ${d.vendor.name}` })),
            ...(await this.prisma.accountingExpense.findMany({ take: 5, orderBy: { date: 'desc' } })).map(e => ({ type: 'EXPENSE', amount: Number(e.amount), date: e.date, description: e.category })),
            ...(await this.prisma.accountingPurchase.findMany({ take: 5, orderBy: { date: 'desc' }, include: { vendor: true } })).map(p => ({ type: 'PURCHASE', amount: Number(p.total_amount), date: p.date, description: `Purchase from ${p.vendor.name}` })),
        ].sort((a, b) => b.date.getTime() - a.date.getTime()).slice(0, 10);

        return {
            totalIncome,
            totalExpenses,
            netProfit,
            recentTransactions
        };
    }
}
