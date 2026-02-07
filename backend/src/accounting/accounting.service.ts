import { Injectable, BadRequestException, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CalculatePayrollDto } from './dto/calculate-payroll.dto';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { CreateTransferDto } from './dto/create-transfer.dto';
import { CreateClosingDto } from './dto/create-closing.dto';
import { HRMonthStatus, PayrollStatus, User, TransferType } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

@Injectable()
export class AccountingService {
    constructor(private prisma: PrismaService) { }

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

        // 1. Check HR Month Status
        const hrMonth = await this.prisma.hRMonth.findUnique({
            where: { year_month: { year, month } }
        });
        if (!hrMonth || (hrMonth.status !== HRMonthStatus.SUBMITTED && hrMonth.status !== HRMonthStatus.LOCKED)) {
            throw new BadRequestException('HR Month must be SUBMITTED or LOCKED before calculating payroll.');
        }

        // 2. Check existing Payroll Run
        const existingRun = await this.prisma.payrollRun.findUnique({
            where: { year_month: { year, month } }
        });
        if (existingRun && existingRun.status !== PayrollStatus.DRAFT) {
            throw new ConflictException(`Payroll for ${year}-${month} is already ${existingRun.status}`);
        }

        // 3. Get Active Employees
        const employees = await this.prisma.employee.findMany({
            where: { is_active: true }
        });

        // 4. Get Deductions for the Month
        const deductions = await this.prisma.hRDeduction.findMany({
            where: { hr_month_id: hrMonth.id }
        });

        // 5. Prepare Items
        const payrollItemsData = employees.map(emp => {
            const empDeductions = deductions.filter(d => d.employee_id === emp.id);
            const totalDeductions = empDeductions.reduce((sum, d) => sum + Number(d.amount), 0);
            const netSalary = Number(emp.base_salary) - totalDeductions; // + adjustments if any

            return {
                employee_id: emp.id,
                base_salary: emp.base_salary,
                total_deductions: totalDeductions,
                adjustments: 0,
                net_salary: netSalary,
                breakdown_json: empDeductions.map(d => ({ type: d.type, amount: d.amount, reason: d.reason })),
            };
        });

        // 6. Transaction: Create/Update PayrollRun + Items
        return this.prisma.$transaction(async (tx) => {
            let run = existingRun;
            if (!run) {
                run = await tx.payrollRun.create({
                    data: {
                        year,
                        month,
                        status: PayrollStatus.CALCULATED, // Or DRAFT but with items? Spec says "Calculate sets status CALCULATED"
                        calculated_by: user.id,
                        calculated_at: new Date(),
                    }
                });
            } else {
                // Should we wipe items and re-create? Yes, for recalc.
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
                        ...item
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

        // Auto-create AccountingTransfer for total payroll?
        const totalNet = run.items.reduce((sum, item) => sum + Number(item.net_salary), 0);
        await this.createTransfer({
            type: TransferType.PAYROLL,
            amount: totalNet,
            method: 'BANK', // Default
            date: new Date().toISOString(),
            reference_id: run.id,
            notes: `Auto-generated for Payroll ${run.year}-${run.month}`
        } as any, user); // Casting due to enum mismatch if any

        return run;
    }

    // --- Purchases ---
    async createPurchase(dto: CreatePurchaseDto, user: User) {
        const totalAmount = dto.items ? dto.items.reduce((sum, item) => sum + (Number(item.qty) * Number(item.unit_price)), 0) : 0;

        return this.prisma.accountingPurchase.create({
            data: {
                vendor_name: dto.vendor_name,
                date: new Date(dto.date),
                total_amount: totalAmount || 0, // Should be calculated or passed? Spec implied validation.
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

    async getPurchases() {
        return this.prisma.accountingPurchase.findMany({
            include: { items: true, creator: { select: { name: true } } },
            orderBy: { date: 'desc' }
        });
    }

    // --- Expenses ---
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

    async getExpenses() {
        return this.prisma.accountingExpense.findMany({
            include: { creator: { select: { name: true } } },
            orderBy: { date: 'desc' }
        });
    }

    // --- Transfers ---
    async createTransfer(dto: CreateTransferDto, user: User) {
        if (dto.type === TransferType.PAYROLL && dto.reference_id) {
            // Verify payroll run exists
            const run = await this.prisma.payrollRun.findUnique({ where: { id: dto.reference_id } });
            if (!run) throw new NotFoundException('Payroll Run not found');
        }

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
}
