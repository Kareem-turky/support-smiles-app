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

  async getSummary(user: any, from?: string, to?: string) {
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
    // Financials usually limited to Admin and Accounting Managers
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

    // 3. Ticket RBAC Filter for "Open Issues"
    const ticketWhereClause: any = {
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
    };

    if (
      user.role === 'CS_AGENT' ||
      user.role === 'WH_AGENT' ||
      user.role === 'HR_AGENT' ||
      user.role === 'ACC_AGENT'
    ) {
      ticketWhereClause.OR = [
        { assigned_to: user.id },
        { created_by: user.id },
      ];
    } else if (user.role !== 'ADMIN') {
      // Must be a Manager
      const managerEmp = await this.prisma.employee.findUnique({
        where: { user_id: user.id },
        include: { department: true },
      });
      if (managerEmp) {
        // Manager sees targets/tickets for their department
        const deptEmployees = await this.prisma.employee.findMany({
          where: { department_id: managerEmp.department_id },
          select: { user_id: true },
        });
        const deptUserIds = deptEmployees.map((e) => e.user_id).filter(Boolean);

        // Also include unassigned tickets with matching category
        const deptName = managerEmp.department.name.toLowerCase();
        let cat: any = null;
        if (deptName.includes('cs')) cat = 'CS';
        else if (deptName.includes('accounting')) cat = 'ACCOUNTING';
        else if (deptName.includes('shipping')) cat = 'SHIPPING';

        ticketWhereClause.OR = [
          { assigned_to: { in: deptUserIds } },
          cat ? { assigned_to: null, reason: { category: cat } } : undefined,
        ].filter(Boolean);
      }
    }

    // 4. KPI / Action Counts
    const counts = {
      tickets_open: await this.prisma.ticket.count({
        where: ticketWhereClause,
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
      avg_response_time: await this.calculateAvgResponseTime(
        startDate,
        endDate,
      ),
    };

    // 5. Gamification
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
