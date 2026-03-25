import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { User, UserRole, AttendanceStatus } from '@prisma/client';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class KpiService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService,
    private gamificationService: GamificationService,
  ) {}

  // --- KPI Metrics Admin ---
  async getAllMetrics() {
    return this.prisma.kpiMetric.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getActiveMetrics() {
    return this.prisma.kpiMetric.findMany({
      where: { is_active: true },
      orderBy: { name: 'asc' },
    });
  }

  async createMetric(name: string) {
    if (!name || !name.trim())
      throw new BadRequestException('Name is required');
    try {
      return await this.prisma.kpiMetric.create({
        data: { name: name.trim() },
      });
    } catch (e: any) {
      if (e.code === 'P2002')
        throw new BadRequestException(
          'A metric with this name already exists.',
        );
      throw e;
    }
  }

  async toggleMetric(id: string, is_active: boolean) {
    return this.prisma.kpiMetric.update({
      where: { id },
      data: { is_active },
    });
  }

  async deleteMetric(id: string) {
    return this.prisma.kpiMetric.delete({ where: { id } }).catch(() => {
      throw new BadRequestException('Cannot delete metric. It may be in use.');
    });
  }
  // --- END KPI Metrics Admin ---

  async getMetrics(employeeId: string, period?: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: true },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    const monthKey = period || new Date().toISOString().slice(0, 7); // YYYY-MM
    const startDate = new Date(monthKey + '-01');
    const endDate = new Date(
      startDate.getFullYear(),
      startDate.getMonth() + 1,
      1,
    );

    // 1. Get Targets for Employee (valid for this period)
    const targetsList = await this.prisma.kPITarget.findMany({
      where: {
        employee_id: employee.id,
        date: { lt: endDate },
      },
      orderBy: { date: 'desc' },
    });

    const latestTargetsMap = new Map();
    for (const t of targetsList) {
      if (!latestTargetsMap.has(t.metric_name))
        latestTargetsMap.set(t.metric_name, t);
    }
    const targets = Array.from(latestTargetsMap.values());

    // 2. Get Actuals for the period
    const actuals = await this.prisma.kPIActual.findMany({
      where: {
        employee_id: employee.id,
        period_key: { startsWith: monthKey },
      },
    });

    // 3. Get Issues
    const issues = await this.prisma.employeeIssue.findMany({
      where: {
        employee_id: employee.id,
        date: {
          gte: startDate,
          lt: endDate,
        },
      },
    });

    // 4. Calculate Scores
    const metrics = targets.map((target) => {
      const metricActuals = actuals.filter(
        (a) => a.metric_name.toUpperCase() === target.metric_name.toUpperCase(),
      );
      const actualVal = metricActuals.reduce(
        (sum, a) => sum + Number(a.actual_value),
        0,
      );
      const targetVal = Number(target.target_value);
      const weight = Number(target.weight);

      // Score = (Actual / Target) * Weight
      let rawScore = targetVal > 0 ? (actualVal / targetVal) * weight : 0;
      if (rawScore > weight * 1.2) rawScore = weight * 1.2;

      return {
        name: target.metric_name,
        target: targetVal,
        weight: weight,
        actual: actualVal,
        score: Math.round(rawScore * 100) / 100,
      };
    });

    const totalBaseScore = metrics.reduce((sum, m) => sum + m.score, 0);
    const totalDeductions = issues.reduce(
      (sum, i) => sum + Number(i.deduction_points),
      0,
    );
    const finalScore = Math.max(0, totalBaseScore - totalDeductions);

    // Fetch Last 30 Days Score Trend (relative to period end)
    const trendEndDate = endDate;
    const trendStartDate = new Date(
      new Date(trendEndDate).setDate(trendEndDate.getDate() - 30),
    );

    const recentScores = await this.prisma.kPIScore.findMany({
      where: {
        employee_id: employee.id,
        date: { gte: trendStartDate, lt: trendEndDate },
      },
      orderBy: { date: 'asc' },
    });

    const scoreTrend = recentScores.map((rs) => ({
      date: rs.period_key, // YYYY-MM-DD
      score: Number(rs.total_score),
    }));

    // Fetch Gamification Badges
    const badges = employee.user_id
      ? await this.prisma.userBadge.findMany({
          where: { user_id: employee.user_id },
          include: { badge: true },
        })
      : [];

    const gamificationBadges = badges.map((b) => ({
      name: b.badge.name,
      icon: b.badge.icon,
      earned_at: b.earned_at,
    }));

    return {
      period: monthKey,
      user_role: employee.user?.role || 'Employee',
      metrics,
      issues: issues.map((i) => ({
        type: i.type,
        deduction: Number(i.deduction_points),
        date: i.date,
      })),
      total_base_score: Math.round(totalBaseScore * 100) / 100,
      total_deductions: Math.round(totalDeductions * 100) / 100,
      final_score: Math.round(finalScore * 100) / 100,
      scoreTrend,
      gamificationBadges,
    };
  }

  async getTeamStats(user: any, period?: string) {
    const whereClause: any = {};
    let employeeIds: string[] = [];
    let userIds: string[] = [];

    if (user.role !== UserRole.ADMIN) {
      // Find manager's department
      const managerEmployee = await this.prisma.employee.findUnique({
        where: { email: user.email },
      });

      if (managerEmployee) {
        whereClause.department_id = managerEmployee.department_id;
      }
    }

    const employees = await this.prisma.employee.findMany({
      where: whereClause,
      include: { user: true },
    });

    employeeIds = employees.map((e) => e.id);
    userIds = employees.map((e) => e.user?.id).filter(Boolean);

    const stats = await Promise.all(
      employees.map(async (emp) => {
        const metrics = await this.getMetrics(emp.id, period);
        const score = metrics.final_score;
        const issuesCount = metrics.issues.length;

        return {
          id: emp.id,
          name: emp.full_name,
          // @ts-ignore
          role: emp.user?.role || 'Employee',
          score,
          issuesCount,
          status: score < 50 ? 'AT_RISK' : 'ON_TRACK',
        };
      }),
    );

    // Aggregate Team Stats
    const startDate = new Date(
      (period || new Date().toISOString().slice(0, 7)) + '-01',
    );
    const endDate = new Date(
      startDate.getFullYear(),
      startDate.getMonth() + 1,
      1,
    );

    // 1. Total Tickets for the team (resolved in this period)
    const totalTickets = await this.prisma.ticket.count({
      where: {
        AND: [
          userIds.length > 0
            ? { assigned_to: { in: userIds } }
            : { id: 'none' },
          { resolved_at: { gte: startDate, lt: endDate } },
        ],
      },
    });

    // 2. Average Resolution Time (resolved in this period)
    const resolvedTickets = await this.prisma.ticket.findMany({
      where: {
        assigned_to: { in: userIds },
        resolved_at: { gte: startDate, lt: endDate },
      },
      select: { created_at: true, resolved_at: true },
    });

    let avgResponseTime = 0;
    if (resolvedTickets.length > 0) {
      const totalTime = resolvedTickets.reduce((sum, t) => {
        const duration = t.resolved_at.getTime() - t.created_at.getTime();
        return sum + duration;
      }, 0);
      avgResponseTime = totalTime / resolvedTickets.length / (1000 * 60 * 60); // In hours
    }

    // Calculate summaries from individual stats
    const totalIssues = stats.reduce((sum, s) => sum + s.issuesCount, 0);

    return {
      total_tickets: totalTickets,
      avg_response_time: avgResponseTime,
      open_issues: totalIssues,
      member_performance: stats.sort((a, b) => b.score - a.score), // Best first
    };
  }

  async calculateDailyScore(employeeId: string, date: Date) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: true, department: true },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    const role = employee.user?.role;

    // 1. Get Targets
    const targetsList = await this.prisma.kPITarget.findMany({
      where: { employee_id: employeeId },
      orderBy: { date: 'desc' },
    });
    const latestTargetsMap = new Map();
    for (const t of targetsList) {
      if (!latestTargetsMap.has(t.metric_name))
        latestTargetsMap.set(t.metric_name, t);
    }
    const targets = Array.from(latestTargetsMap.values());

    // Period Key for daily actuals
    const periodKey = new Date(date).toISOString().split('T')[0];

    // 2. Get Actuals for the day
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    // @ts-ignore
    const actuals = await this.prisma.kPIActual.findMany({
      where: { employee_id: employeeId, period_key: periodKey },
    });

    // 3. Calculate Component Scores
    let efficiencyScore = 0;
    const behaviorScore = 100; // Default pending manager input
    const qualityScore = 100;

    // -- Warehouse Logic: Productivity Deficit --
    const orderTarget = targets.find((t) => t.metric_name === 'Daily Orders');
    const orderActual = actuals.find((a) => a.metric_name === 'Daily Orders');

    if (orderTarget && orderActual) {
      const targetVal = Number(orderTarget.target_value);
      const actualVal = Number(orderActual.actual_value);

      // Efficiency %
      efficiencyScore = Math.min((actualVal / targetVal) * 100, 120);

      // Deficit Logic
      if (actualVal < targetVal) {
        const deficitRatio = (targetVal - actualVal) / targetVal;
        // Hourly Rate = base_salary / (30 * 9)
        const hourlyRate = Number(employee.base_salary) / (30 * 9);
        const workDayHours = 9;
        const deficitHours = deficitRatio * workDayHours;
        const deductionAmount = deficitHours * hourlyRate;

        // Log Deduction Issue
        // Check if already exists to avoid dupes
        const existingIssue = await this.prisma.employeeIssue.findFirst({
          where: {
            employee_id: employeeId,
            type: 'PRODUCTIVITY_DEDUCTION',
            date: { gte: dayStart, lte: dayEnd },
          },
        });

        if (!existingIssue && deductionAmount > 0) {
          const systemAdmin = await this.prisma.user.findFirst({
            where: { role: UserRole.ADMIN },
          });
          const fallbackUserId =
            employee.user_id || systemAdmin?.id || 'system';

          await this.prisma.$transaction([
            this.prisma.employeeIssue.create({
              data: {
                employee_id: employeeId,
                department_id: employee.department_id,
                category_key: 'PRODUCTIVITY',
                type: 'PRODUCTIVITY_DEDUCTION',
                description: `Productivity Deficit: ${Math.round(deficitRatio * 100)}% (${deficitHours.toFixed(1)}h)`,
                date: new Date(),
                severity: 'MEDIUM',
                deduction_points: deductionAmount,
                created_by: fallbackUserId,
                reported_by_user_id: fallbackUserId,
              },
            }),
            this.prisma.reviewDeduction.create({
              data: {
                employee_id: employeeId,
                department_id: employee.department_id,
                period_key: periodKey,
                reason_key: 'PRODUCTIVITY_DEFICIT',
                details_json: JSON.stringify({
                  deficitRatio: Math.round(deficitRatio * 100),
                  deficitHours: deficitHours.toFixed(1),
                  hourlyRate,
                }),
                suggested_amount: deductionAmount,
                status: 'REVIEW_NEEDED',
                created_by_system: true,
              },
            }),
          ]);
        }
      }
    } else {
      // Generic Logic for CS/Others
      const ticketTarget = targets.find(
        (t) => t.metric_name === 'Daily Tickets',
      );
      const ticketActual = actuals.find(
        (a) => a.metric_name === 'Daily Tickets',
      );
      if (ticketTarget && ticketActual) {
        efficiencyScore = Math.min(
          (Number(ticketActual.actual_value) /
            Number(ticketTarget.target_value)) *
            100,
          120,
        );
      }
    }

    // 4. Punctuality (Attendance)
    const attendance = await this.prisma.hRAttendance.findFirst({
      where: { employee_id: employeeId, date: { gte: dayStart, lte: dayEnd } },
    });

    let punctualityScore = 100;
    if (attendance) {
      if (attendance.status === 'ABSENT') punctualityScore = 0;
      else if (attendance.minutes_late > 0) {
        // -1 point per minute?
        punctualityScore = Math.max(0, 100 - attendance.minutes_late);
      }
    }

    // 5. Total Weighted Score
    // Fetch weights from targets or use defaults
    // For now, simple average behavior
    const totalScore =
      efficiencyScore * 0.4 + qualityScore * 0.3 + punctualityScore * 0.3;

    // 6. Upsert Daily Rollup
    // @ts-ignore
    const existingScore = await this.prisma.kPIScore.upsert({
      where: {
        employee_id_period_key: {
          employee_id: employeeId,
          period_key: periodKey,
        },
      },
      update: {
        efficiency_score: efficiencyScore,
        quality_score: qualityScore,
        behavior_score: behaviorScore,
        punctuality_score: punctualityScore,
        total_score: totalScore,
        // Gamification Points: 10 points if score > 90
        points_awarded: totalScore > 90 ? 10 : 0,
      },
      create: {
        employee_id: employeeId,
        department_id: employee.department_id,
        period_key: periodKey,
        date: dayStart,
        efficiency_score: efficiencyScore,
        quality_score: qualityScore,
        behavior_score: behaviorScore,
        punctuality_score: punctualityScore,
        total_score: totalScore,
        points_awarded: totalScore > 90 ? 10 : 0,
      },
    });

    // 7. Gamification Integrations
    if (totalScore > 90 && employee.user_id) {
      // Award Gamification Points using the service
      await this.gamificationService.awardPoints(
        employee.user_id,
        10,
        `Daily KPI Bonus: ${totalScore.toFixed(0)}% (${periodKey})`,
      );
      await this.gamificationService.updateMissionProgress(
        employee.user_id,
        'HIGH_KPI_SCORE',
        1,
      );
    }

    // Check Streak: No Fatal Issues
    const recentFatalIssues = await this.prisma.employeeIssue.count({
      where: {
        employee_id: employeeId,
        severity: 'FATAL',
        date: { gte: new Date(dayStart.getTime() - 7 * 24 * 60 * 60 * 1000) },
      },
    });

    if (recentFatalIssues === 0 && employee.user_id) {
      await this.gamificationService.updateMissionProgress(
        employee.user_id,
        'NO_FATAL_ISSUES_7_DAYS',
        1,
      );
    }

    // Check Streak: Warehouse 100% Target
    if (
      (role === UserRole.WH_MANAGER || role === ('WH_WORKER' as any)) &&
      efficiencyScore >= 100 &&
      employee.user_id
    ) {
      await this.gamificationService.updateMissionProgress(
        employee.user_id,
        'WH_100_PERCENT_5_DAYS',
        1,
      );
    }

    return { efficiencyScore, punctualityScore, totalScore };
  }

  async logIssue(dto: any, creatorId: string) {
    console.log('logIssue DTO:', JSON.stringify(dto, null, 2));
    console.log('logIssue Creator:', creatorId);
    const { employeeId, type, description, date, severity, deductionPoints } =
      dto;

    if (!employeeId) throw new BadRequestException('Employee ID is required');

    // Validate employee exists
    const emp = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!emp) throw new NotFoundException('Employee not found');

    // @ts-ignore
    return this.prisma.$transaction(async (tx) => {
      const issue = await tx.employeeIssue.create({
        data: {
          employee_id: employeeId,
          department_id: emp.department_id,
          type,
          description,
          date: new Date(date),
          severity,
          deduction_points: deductionPoints,
          created_by: creatorId,
        },
      });

      if (deductionPoints > 0) {
        await tx.reviewDeduction.create({
          data: {
            employee_id: employeeId,
            department_id: emp.department_id,
            period_key: new Date(date).toISOString().slice(0, 7),
            reason_key: type,
            suggested_amount: deductionPoints,
            status: 'REVIEW_NEEDED',
            created_by_system: false,
            details_json: JSON.stringify({
              description,
              severity,
              manual_entry: true,
            }),
          },
        });
      }

      return issue;
    });
  }

  async createTarget(dto: any, managerId: string, managerUser: any) {
    const { employeeId, employee_code, date, metric, targetValue, weight } =
      dto;

    let targetEmployee;
    if (employeeId) {
      targetEmployee = await this.prisma.employee.findUnique({
        where: { id: employeeId },
      });
    } else if (employee_code) {
      targetEmployee = await this.prisma.employee.findUnique({
        where: { code: employee_code },
      });
    }
    if (!targetEmployee)
      throw new NotFoundException('Target employee not found');

    if (managerUser.role !== UserRole.ADMIN) {
      const managerEmployee = await this.prisma.employee.findUnique({
        where: { email: managerUser.email },
      });
      if (!managerEmployee)
        throw new NotFoundException('Manager employee record not found');

      if (managerEmployee.department_id !== targetEmployee.department_id) {
        throw new ForbiddenException(
          'Managers can only assign targets to their own department members.',
        );
      }
    }

    return this.prisma.kPITarget.create({
      data: {
        employee_id: targetEmployee.id,
        manager_id: managerId,
        department_id: targetEmployee.department_id,
        date: new Date(date || new Date()),
        metric_name: metric.toUpperCase().trim(),
        target_value: targetValue,
        weight: weight || 100,
      },
    });
  }

  async getTeamTargets(user: any, dateStr?: string) {
    if (user.role === UserRole.ADMIN) {
      return this.prisma.kPITarget.findMany({
        orderBy: { date: 'desc' },
        include: { employee: true },
      });
    }

    const managerEmployee = await this.prisma.employee.findUnique({
      where: { email: user.email },
    });
    if (!managerEmployee) throw new NotFoundException('Manager not found');

    return this.prisma.kPITarget.findMany({
      where: { department_id: managerEmployee.department_id },
      orderBy: { date: 'desc' },
      include: { employee: true },
    });
  }

  async getMyTargets(userId: string, dateStr?: string) {
    const employee = await this.prisma.employee.findUnique({
      where: { user_id: userId },
    });
    if (!employee) return [];

    return this.prisma.kPITarget.findMany({
      where: { employee_id: employee.id },
      orderBy: { date: 'desc' },
    });
  }

  async logActual(dto: any, creatorUser: any) {
    const { employeeId, employee_code, metric, date, actualValue } = dto;

    let targetEmployee;
    if (employeeId) {
      targetEmployee = await this.prisma.employee.findUnique({
        where: { id: employeeId },
      });
    } else if (employee_code) {
      targetEmployee = await this.prisma.employee.findUnique({
        where: { code: employee_code },
      });
    }
    if (!targetEmployee)
      throw new NotFoundException('Target employee not found');

    if (creatorUser.role !== UserRole.ADMIN) {
      const managerEmployee = await this.prisma.employee.findUnique({
        where: { email: creatorUser.email },
      });
      if (!managerEmployee)
        throw new NotFoundException('Manager record not found');
      if (managerEmployee.department_id !== targetEmployee.department_id) {
        throw new ForbiddenException(
          'Managers can only log actuals for their own department members.',
        );
      }
    }

    const periodKey = date
      ? new Date(date).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10);

    // @ts-ignore
    return this.prisma.kPIActual.upsert({
      where: {
        employee_id_metric_name_period_key: {
          employee_id: targetEmployee.id,
          metric_name: metric.toUpperCase().trim(),
          period_key: periodKey,
        },
      },
      update: {
        actual_value: actualValue,
      },
      create: {
        employee_id: targetEmployee.id,
        metric_name: metric.toUpperCase().trim(),
        period_key: periodKey,
        actual_value: actualValue,
      },
    });
  }

  async getEmployeeByUserId(userId: string) {
    return this.prisma.employee.findUnique({ where: { user_id: userId } });
  }
}
