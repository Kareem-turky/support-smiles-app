import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AdjustmentType } from '@prisma/client';

@Injectable()
export class DashboardService {
    constructor(private prisma: PrismaService) { }

    async getSummary(from?: string, to?: string) {
        const startDate = from ? new Date(from) : new Date('2000-01-01');
        const endDate = to ? new Date(to) : new Date();

        if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
            throw new Error('Invalid date range');
        }

        const dateFilter = {
            gte: startDate,
            lte: endDate,
        };

        // 1. Aggregations
        const deposits = await this.prisma.vendorDeposit.aggregate({
            where: { date: dateFilter },
            _sum: { amount: true },
        });
        const totalDeposits = Number(deposits._sum.amount || 0);

        const purchases = await this.prisma.accountingPurchase.aggregate({
            where: { date: dateFilter },
            _sum: { total_amount: true },
        });
        const totalPurchases = Number(purchases._sum.total_amount || 0);

        const expenses = await this.prisma.accountingExpense.aggregate({
            where: { date: dateFilter },
            _sum: { amount: true },
        });
        const totalExpenses = Number(expenses._sum.amount || 0);

        // Payroll: Sum net_salary of items in PAID runs within date range
        // Note: Schema has paid_at in PayrollRun.
        // We need to filter PayrollRun by paid_at, then sum items.net_salary
        const payrollRuns = await this.prisma.payrollRun.findMany({
            where: {
                status: 'PAID',
                paid_at: dateFilter,
            },
            include: { items: true },
        });

        let totalPayroll = 0;
        payrollRuns.forEach(run => {
            run.items.forEach(item => totalPayroll += Number(item.net_salary));
        });

        const transfers = await this.prisma.accountingTransfer.aggregate({
            where: { date: dateFilter },
            _sum: { amount: true },
        });
        const totalTransfers = Number(transfers._sum.amount || 0);

        // HR Adjustments (Bonuses, etc)
        const adjustments = await this.prisma.hRAdjustment.groupBy({
            by: ['type'],
            where: { date: dateFilter },
            _sum: { amount: true },
        });

        let totalBonuses = 0;
        let totalDeductions = 0;

        adjustments.forEach(adj => {
            const val = Number(adj._sum.amount || 0);
            if (adj.type === AdjustmentType.BONUS) totalBonuses += val;
            if (adj.type === AdjustmentType.DEDUCTION) totalDeductions += val;
        });

        // Net Calculation
        // Net = Deposits - (Purchases + Expenses + Payroll + Transfers + Bonuses) 
        // Deductions are usually withheld from payroll, so if we use net_salary, we don't add deductions back unless specific logic required.
        const totalOperationalCosts = totalPurchases + totalExpenses + totalPayroll + totalTransfers + totalBonuses;
        const netProfit = totalDeposits - (totalPurchases + totalExpenses + totalPayroll + totalTransfers + (totalBonuses - totalDeductions));

        // 2. Recent Lists (Last 5)
        const recentPurchases = await this.prisma.accountingPurchase.findMany({
            where: { date: dateFilter },
            orderBy: { date: 'desc' },
            take: 5,
            include: { vendor: true }
        });

        const recentExpenses = await this.prisma.accountingExpense.findMany({
            where: { date: dateFilter },
            orderBy: { date: 'desc' },
            take: 5,
        });

        const recentDeposits = await this.prisma.vendorDeposit.findMany({
            where: { date: dateFilter },
            orderBy: { date: 'desc' },
            take: 5,
            include: { vendor: true }
        });

        // 3. KPI Counts
        const counts = {
            tickets_open: await this.prisma.ticket.count({ where: { status: { not: 'CLOSED' } } }),
            orders_pending: await this.prisma.order.count({ where: { status: 'PENDING' } }),
            employees_active: await this.prisma.employee.count({ where: { is_active: true } }),
        };

        return {
            period: { from: startDate, to: endDate },
            financials: {
                deposits_total: totalDeposits,
                purchases_total: totalPurchases,
                expenses_total: totalExpenses,
                payroll_total: totalPayroll,
                transfers_total: totalTransfers,
                hr_bonus_total: totalBonuses,
                hr_deduction_total: totalDeductions,
                net_profit_loss: netProfit,
            },
            counts,
            recent: {
                purchases: recentPurchases,
                expenses: recentExpenses,
                deposits: recentDeposits,
            }
        };
    }
}
