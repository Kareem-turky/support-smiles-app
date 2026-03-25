import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { AdjustmentType, TicketStatus } from '@prisma/client';

@Injectable()
export class DashboardService {
  constructor(
    private prisma: PrismaService,
    private readonly gamificationService: GamificationService,
  ) {}

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

    // 1. Aggregations (Financials)
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

    // Payroll
    const payrollRuns = await this.prisma.payrollRun.findMany({
      where: {
        status: 'PAID',
        paid_at: dateFilter,
      },
      include: { items: true },
    });

    let totalPayroll = 0;
    payrollRuns.forEach((run) => {
      run.items.forEach((item) => (totalPayroll += Number(item.net_salary)));
    });

    const transfers = await this.prisma.accountingTransfer.aggregate({
      where: { date: dateFilter },
      _sum: { amount: true },
    });
    const totalTransfers = Number(transfers._sum.amount || 0);

    // HR Adjustments
    const adjustments = await this.prisma.hRAdjustment.groupBy({
      by: ['type'],
      where: { date: dateFilter },
      _sum: { amount: true },
    });

    let totalBonuses = 0;
    let totalDeductions = 0;

    adjustments.forEach((adj) => {
      const val = Number(adj._sum.amount || 0);
      if (adj.type === AdjustmentType.BONUS) totalBonuses += val;
      if (adj.type === AdjustmentType.DEDUCTION) totalDeductions += val;
    });

    const netProfit =
      totalDeposits -
      (totalPurchases +
        totalExpenses +
        totalPayroll +
        totalTransfers +
        (totalBonuses - totalDeductions));

    // 2. Recent Lists
    const recentPurchases = await this.prisma.accountingPurchase.findMany({
      where: { date: dateFilter },
      orderBy: { date: 'desc' },
      take: 5,
      include: { vendor: true },
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
      include: { vendor: true },
    });

    // 3. KPI / Action Counts
    const counts = {
      tickets_open: await this.prisma.ticket.count({
        where: {
          status: {
            in: [
              TicketStatus.NEW,
              TicketStatus.ASSIGNED,
              TicketStatus.IN_PROGRESS,
              TicketStatus.WAITING,
              TicketStatus.REOPENED,
            ],
          },
          deleted_at: null,
        },
      }),
      orders_pending: await this.prisma.order.count({
        where: { status: 'PENDING' },
      }),
      employees_active: await this.prisma.employee.count({
        where: { is_active: true },
      }),
      pending_leaves: await this.prisma.hRLeave.count({
        where: { status: 'PENDING' },
      }),
      avg_response_time: await this.calculateAvgResponseTime(startDate, endDate),
    };

    // 4. Gamification
    const leaderboard = await this.gamificationService.getLeaderboard();

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
      },
      gamification: {
        leaderboard: leaderboard.slice(0, 3),
      },
    };
  }

  private async calculateAvgResponseTime(start: Date, end: Date) {
    const resolved = await this.prisma.ticket.findMany({
      where: {
        resolved_at: { gte: start, lt: end },
        deleted_at: null,
      },
      select: { created_at: true, resolved_at: true },
    });

    if (resolved.length === 0) return 0;

    const totalTime = resolved.reduce((sum, t) => {
      const duration = (t.resolved_at?.getTime() || 0) - t.created_at.getTime();
      return sum + duration;
    }, 0);

    return totalTime / resolved.length / (1000 * 60 * 60); // In hours
  }
}
