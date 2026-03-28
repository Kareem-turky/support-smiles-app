import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import {
  User,
  UserRole,
  AttendanceStatus,
  TicketStatus,
  TicketReasonCategory,
} from '@prisma/client';
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

  async getMetrics(employeeId: string, period?: string, frequency?: string) {
    const freq = frequency || 'DAILY';
    const periodKey =
      period ||
      (freq === 'DAILY'
        ? new Date().toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 7));

    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: true },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    // 1. Get Targets for Employee and Frequency
    const targets = await this.prisma.kPITarget.findMany({
      where: {
        employee_id: employee.id,
        frequency: freq as any,
      },
    });

    // 2. Get Actuals for the period and frequency
    const actuals = await this.prisma.kPIActual.findMany({
      where: {
        employee_id: employee.id,
        frequency: freq as any,
        period_key: periodKey,
      },
    });

    // 3. Get Issues for the period (scoping issues to the same overall month if daily, or month if monthly)
    const monthPrefix = periodKey.slice(0, 7);
    const startDate = new Date(monthPrefix + '-01');
    const endDate = new Date(
      startDate.getFullYear(),
      startDate.getMonth() + 1,
      1,
    );

    const issues = await this.prisma.employeeIssue.findMany({
      where: {
        employee_id: employee.id,
        date: { gte: startDate, lt: endDate },
      },
    });

    // 4. Calculate Scores
    const metrics = targets.map((target) => {
      const actual = actuals.find((a) => a.metric_name === target.metric_name);
      const actualVal = Number(actual?.actual_value || 0);
      const targetVal = Number(target.target_value);
      const weight = Number(target.weight);

      // Score = (Actual / Target) * Weight
      let rawScore = targetVal > 0 ? (actualVal / targetVal) * weight : 0;
      if (rawScore > weight * 1.2) rawScore = weight * 1.2;

      return {
        name: target.metric_label || target.metric_name,
        target: targetVal,
        weight: weight,
        actual: actualVal,
        score: Math.round(rawScore * 100) / 100,
        frequency: target.frequency,
      };
    });

    const totalBaseScore = metrics.reduce((sum, m) => sum + m.score, 0);
    const totalDeductions = issues.reduce(
      (sum, i) => sum + Number(i.deduction_points),
      0,
    );
    const finalScore = Math.max(0, totalBaseScore - totalDeductions);

    // Fetch Last 10 Periods Trend
    const recentScores = await this.prisma.kPIScore.findMany({
      where: { employee_id: employee.id },
      orderBy: { date: 'desc' },
      take: 10,
    });

    const scoreTrend = recentScores.reverse().map((rs) => ({
      date: rs.period_key, // YYYY-MM-DD or YYYY-MM
      score: Number(rs.total_score),
    }));

    // Fetch Gamification Badges
    const badges = employee.user_id
      ? await this.prisma.userBadge.findMany({
          where: { user_id: employee.user_id },
          include: { badge: true },
        })
      : [];

    return {
      period: periodKey,
      frequency: freq,
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
      gamificationBadges: badges.map((b) => ({
        name: b.badge.name,
        icon: b.badge.icon,
        earned_at: b.earned_at,
      })),
    };
  }

  async getTeamStats(user: any, period?: string, frequency?: string) {
    const freq = frequency || 'DAILY';
    const periodKey = period || (freq === 'DAILY' ? new Date().toISOString().slice(0, 10) : new Date().toISOString().slice(0, 7));
    
    const whereClause: any = {};
    let employeeIds: string[] = [];
    let userIds: string[] = [];

    let managerEmployee = null;
    // ... (RBAC logic same as before)

    if (user.role !== UserRole.ADMIN) {
      // Find manager's department
      managerEmployee = await this.prisma.employee.findUnique({
        where: { user_id: user.id },
        include: { department: true },
      });

      console.log(
        '[DEBUG] managerEmployee found:',
        managerEmployee?.id,
        managerEmployee?.department_id,
      );

      if (managerEmployee) {
        whereClause.department_id = managerEmployee.department_id;
      } else {
        console.log(
          '[DEBUG] No managerEmployee found for user, returning empty',
        );
        // If manager has no employee record, they can't see team stats
        return {
          total_tickets: 0,
          avg_response_time: 0,
          open_issues: 0,
          member_performance: [],
        };
      }
    }

    console.log('[DEBUG] whereClause:', JSON.stringify(whereClause));

    const employees = await this.prisma.employee.findMany({
      where: whereClause,
      include: { user: true },
    });

    console.log('[DEBUG] employees found count:', employees.length);
    employees.forEach((e) =>
      console.log(` - Employee: ${e.full_name}, UserID: ${e.user?.id}`),
    );

    employeeIds = employees.map((e) => e.id);
    userIds = employees.map((e) => e.user?.id).filter(Boolean);
    console.log('[DEBUG] userIds extracted:', JSON.stringify(userIds));

    // Map Department to Ticket Category for unassigned tickets
    const deptName = managerEmployee?.department?.name?.toLowerCase() || '';
    let categoryFilter: TicketReasonCategory | null = null;
    if (deptName.includes('cs')) categoryFilter = TicketReasonCategory.CS;
    else if (deptName.includes('accounting'))
      categoryFilter = TicketReasonCategory.ACCOUNTING;
    else if (deptName.includes('shipping'))
      categoryFilter = TicketReasonCategory.SHIPPING;

    console.log('[DEBUG] categoryFilter:', categoryFilter);

    const stats = await Promise.all(
      employees.map(async (emp) => {
        const metrics = await this.getMetrics(emp.id, periodKey, freq);
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

    // Aggregate Team Stats (Tickets and RT are usually monthly even on daily view, or scoped to day if daily)
    // For now, let's scope to the month of the periodKey
    const monthPrefix = periodKey.slice(0, 7);
    const startDate = new Date(monthPrefix + '-01');
    const endDate = new Date(
      startDate.getFullYear(),
      startDate.getMonth() + 1,
      1,
    );

    // 1. Total Tickets for the team (resolved in this period)
    const totalTickets = await this.prisma.ticket.count({
      where: {
        OR: [
          { assigned_to: { in: userIds } },
          categoryFilter
            ? { assigned_to: null, reason: { category: categoryFilter } }
            : (undefined as any),
        ].filter(Boolean),
        resolved_at: { gte: startDate, lt: endDate },
        deleted_at: null,
      },
    });

    // 2. Average Resolution Time (resolved in this period)
    const resolvedTickets = await this.prisma.ticket.findMany({
      where: {
        OR: [
          { assigned_to: { in: userIds } },
          categoryFilter
            ? { assigned_to: null, reason: { category: categoryFilter } }
            : (undefined as any),
        ].filter(Boolean),
        resolved_at: { gte: startDate, lt: endDate },
        deleted_at: null,
      },
      select: { created_at: true, resolved_at: true },
    });

    let avgResponseTime = 0;
    if (resolvedTickets.length > 0) {
      const totalTime = resolvedTickets.reduce((sum, t) => {
        const duration =
          (t.resolved_at?.getTime() || 0) - t.created_at.getTime();
        return sum + duration;
      }, 0);
      avgResponseTime = totalTime / resolvedTickets.length / (1000 * 60 * 60); // In hours
    }

    // 3. Open Tickets (Unresolved problems)
    const openTicketsCount = await this.prisma.ticket.count({
      where: {
        OR: [
          { assigned_to: { in: userIds } },
          categoryFilter
            ? { assigned_to: null, reason: { category: categoryFilter } }
            : (undefined as any),
        ].filter(Boolean),
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
    });

    return {
      total_tickets: totalTickets,
      avg_response_time: avgResponseTime,
      open_issues: openTicketsCount,
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
    const {
      employeeId,
      metric_name,
      metric_key,
      metric,
      metric_label,
      frequency,
      target_value,
      weight,
    } = dto;

    const finalMetricName = metric_name || metric_key || metric || metric_label;

    if (!employeeId) throw new BadRequestException('Employee ID is required');
    if (!finalMetricName) throw new BadRequestException('Metric name/key is required');

    const targetEmployee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
    });
    if (!targetEmployee)
      throw new NotFoundException('Target employee not found');

    if (managerUser.role !== UserRole.ADMIN) {
      const managerEmployee = await this.prisma.employee.findUnique({
        where: { user_id: managerId },
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
        date: new Date(),
        metric_name: finalMetricName,
        metric_label: metric_label || finalMetricName,
        target_value: target_value,
        weight: weight || 0,
        frequency: frequency || 'DAILY',
        period_key: '', // Targets can be general or specific; user spec says period_key handles matching for actuals.
        // We set period_key in Actuals, but Targets are often "active templates".
      },
    });
  }

  async updateTarget(id: string, dto: any, user: any) {
    const target = await this.prisma.kPITarget.findUnique({ where: { id } });
    if (!target) throw new NotFoundException('Target not found');

    // RBAC
    if (user.role !== UserRole.ADMIN) {
      const managerEmployee = await this.prisma.employee.findUnique({
        where: { user_id: user.id },
      });
      if (
        !managerEmployee ||
        managerEmployee.department_id !== target.department_id
      ) {
        throw new ForbiddenException('Not authorized to edit this target');
      }
    }

    return this.prisma.kPITarget.update({
      where: { id },
      data: dto,
    });
  }

  async getTeamTargets(
    user: any,
    query?: { period?: string; frequency?: string },
  ) {
    const freq = (query?.frequency || 'DAILY') as any;
    const period =
      query?.period ||
      (freq === 'DAILY'
        ? new Date().toISOString().slice(0, 10)
        : new Date().toISOString().slice(0, 7));

    let whereClause: any = { is_active: true };

    if (user.role !== UserRole.ADMIN) {
      const managerEmployee = await this.prisma.employee.findUnique({
        where: { user_id: user.id },
      });
      if (!managerEmployee) throw new NotFoundException('Manager not found');
      whereClause = {
        OR: [
          { department_id: managerEmployee.department_id || 'UNKNOWN' },
          { manager_id: user.id },
        ],
      };
    }

    const targets = await this.prisma.kPITarget.findMany({
      where: {
        ...whereClause,
        frequency: freq as any,
      },
      include: {
        employee: {
          include: { department: true },
        },
      },
      orderBy: { metric_name: 'asc' },
    });

    return Promise.all(
      targets.map(async (target) => {
        const actual = await this.prisma.kPIActual.findUnique({
          where: {
            employee_id_metric_name_frequency_period_key: {
              employee_id: target.employee_id,
              metric_name: target.metric_name,
              frequency: target.frequency,
              period_key: period,
            },
          },
        });

        const actualVal = actual ? Number(actual.actual_value) : 0;
        const targetVal = Number(target.target_value);
        const progress = targetVal > 0 ? (actualVal / targetVal) * 100 : 0;

        return {
          target,
          employee: target.employee,
          period_key: period,
          actual_value: actualVal,
          progress_percent: Math.round(progress * 100) / 100,
          deficit: Math.max(0, targetVal - actualVal),
          overage: Math.max(0, actualVal - targetVal),
          status:
            progress >= 100
              ? 'EXCEEDED'
              : progress >= 80
                ? 'ON_TRACK'
                : 'AT_RISK',
        };
      }),
    );
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
    const { employee_id, metric_name, metric_key, frequency, period_key, delta_value } = dto;

    const finalMetricName = metric_name || metric_key;

    if (!employee_id || !finalMetricName || !frequency || !period_key) {
      throw new BadRequestException(
        'Missing required fields for logging actual',
      );
    }

    const targetEmployee = await this.prisma.employee.findUnique({
      where: { id: employee_id },
    });
    if (!targetEmployee)
      throw new NotFoundException('Target employee not found');

    // RBAC
    if (creatorUser.role !== UserRole.ADMIN) {
      const managerEmployee = await this.prisma.employee.findUnique({
        where: { user_id: creatorUser.id },
      });
      if (
        !managerEmployee ||
        managerEmployee.department_id !== targetEmployee.department_id
      ) {
        throw new ForbiddenException(
          'Not authorized to log actual for this employee',
        );
      }
    }

    // Accumulative logic: find existing or create
    const existing = await this.prisma.kPIActual.findUnique({
      where: {
        employee_id_metric_name_frequency_period_key: {
          employee_id,
          metric_name: finalMetricName,
          frequency,
          period_key,
        },
      },
    });

    if (existing) {
      return this.prisma.kPIActual.update({
        where: { id: existing.id },
        data: {
          actual_value: Number(existing.actual_value) + Number(delta_value),
        },
      });
    } else {
      return this.prisma.kPIActual.create({
        data: {
          employee_id,
          metric_name: finalMetricName,
          frequency,
          period_key,
          actual_value: delta_value,
        },
      });
    }
  }

  async updateActual(id: string, dto: any, user: any) {
    const { actual_value } = dto;
    const actual = await this.prisma.kPIActual.findUnique({
      where: { id },
      include: { employee: true },
    });
    if (!actual) throw new NotFoundException('Actual record not found');

    // RBAC
    if (user.role !== UserRole.ADMIN) {
      const managerEmployee = await this.prisma.employee.findUnique({
        where: { user_id: user.id },
      });
      if (
        !managerEmployee ||
        managerEmployee.department_id !== actual.employee.department_id
      ) {
        throw new ForbiddenException(
          'Not authorized to edit this actual record',
        );
      }
    }

    return this.prisma.kPIActual.update({
      where: { id },
      data: { actual_value },
    });
  }

  async getEmployeeByUserId(userId: string) {
    return this.prisma.employee.findUnique({ where: { user_id: userId } });
  }
}
