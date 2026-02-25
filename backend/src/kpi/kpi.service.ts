import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { GamificationService } from '../gamification/gamification.service';
import { User, UserRole, AttendanceStatus } from '@prisma/client';

@Injectable()
export class KpiService {
  constructor(
    private prisma: PrismaService,
    private gamificationService: GamificationService,
  ) { }

  async getMetrics(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { employee: true },
    });
    if (!user) throw new NotFoundException('User not found');

    // 1. Get Targets for Role
    // @ts-ignore
    const targets = await this.prisma.kPITarget.findMany({
      where: { role: user.role },
    });

    // 2. Get Actuals for Current Month (e.g., "2025-02")
    const periodKey = new Date().toISOString().slice(0, 7); // YYYY-MM
    // @ts-ignore
    const actuals = await this.prisma.kPIActual.findMany({
      where: { user_id: userId, period_key: periodKey },
    });

    // 3. Get Issues
    let issues = [];
    if (user.employee) {
      // @ts-ignore
      issues = await this.prisma.employeeIssue.findMany({
        where: {
          employee_id: user.employee.id,
          date: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1),
          },
        },
      });
    }

    // 4. Calculate Scores
    const metrics = targets.map((target) => {
      const actual = actuals.find((a) => a.metric_name === target.metric_name);
      const actualVal = actual ? Number(actual.actual_value) : 0;
      const targetVal = Number(target.target_value);
      const weight = Number(target.weight);

      // Score = (Actual / Target) * Weight
      // Cap at weight? Or allow over-performance? Let's cap at 120% of weight for now.
      let rawScore = (actualVal / targetVal) * weight;
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
    const totalDeductions = issues.reduce((sum, i) => sum + Number(i.deduction_points), 0);
    const finalScore = Math.max(0, totalBaseScore - totalDeductions);

    return {
      period: periodKey,
      user_role: user.role,
      metrics,
      issues: issues.map(i => ({ type: i.type, deduction: Number(i.deduction_points), date: i.date })),
      total_base_score: Math.round(totalBaseScore * 100) / 100,
      total_deductions: Math.round(totalDeductions * 100) / 100,
      final_score: Math.round(finalScore * 100) / 100,
    };
  }

  async getTeamStats(user: any) {
    let whereClause: any = {};

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

    const stats = await Promise.all(employees.map(async (emp) => {
      let score = 0;
      let issuesCount = 0;

      if (emp.user) {
        const metrics = await this.getMetrics(emp.user.id);
        score = metrics.final_score;
        issuesCount = metrics.issues.length;
      }

      return {
        id: emp.id,
        name: emp.full_name,
        // @ts-ignore
        role: emp.user?.role || 'Employee',
        score,
        issuesCount,
        status: score < 50 ? 'AT_RISK' : 'ON_TRACK',
      };
    }));

    // Aggregate Team Stats
    const totalTickets = await this.prisma.ticket.count({
      where: user.role !== UserRole.ADMIN ? { assignee: { email: user.email } } : undefined // Simplified: Manager sees their own team's tickets? 
      // Real logic: tickets assigned to employees in the department.
      // For now, let's just return a placeholder or simple count.
    });

    // Calculate summaries from individual stats
    const avgScore = stats.reduce((sum, s) => sum + s.score, 0) / (stats.length || 1);
    const totalIssues = stats.reduce((sum, s) => sum + s.issuesCount, 0);

    return {
      total_tickets: totalTickets,
      avg_response_time: 0, // Placeholder, requires complex query on TicketEvents
      open_issues: totalIssues,
      member_performance: stats.sort((a, b) => a.score - b.score)
    };
  }

  async calculateDailyScore(employeeId: string, date: Date) {
    const employee = await this.prisma.employee.findUnique({
      where: { id: employeeId },
      include: { user: true, department: true },
    });
    if (!employee) throw new NotFoundException('Employee not found');

    const role = employee.user?.role;
    if (!role) return;

    // 1. Get Targets
    // @ts-ignore
    const targets = await this.prisma.kPITarget.findMany({
      where: { role },
    });

    // 2. Get Actuals for the day
    const dayStart = new Date(date);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(date);
    dayEnd.setHours(23, 59, 59, 999);

    // Period Key for daily actuals? Or we just summon them by date range if schema supported it.
    // Current schema uses 'period_key' string. Let's assume daily actuals key is "YYYY-MM-DD".
    const periodKey = dayStart.toISOString().split('T')[0];

    // @ts-ignore
    const actuals = await this.prisma.kPIActual.findMany({
      where: { user_id: employee.user_id, period_key: periodKey }
    });

    // 3. Calculate Component Scores
    let efficiencyScore = 0;
    let behaviorScore = 100; // Default pending manager input
    let qualityScore = 100;

    // -- Warehouse Logic: Productivity Deficit --
    if (role === UserRole.WH_MANAGER || role === 'WH_WORKER' as any) { // 'WH_WORKER' not in enum but handled generically
      const orderTarget = targets.find(t => t.metric_name === 'Daily Orders');
      const orderActual = actuals.find(a => a.metric_name === 'Daily Orders');

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
              date: { gte: dayStart, lte: dayEnd }
            }
          });

          if (!existingIssue && deductionAmount > 0) {
            await this.prisma.employeeIssue.create({
              data: {
                employee_id: employeeId,
                type: 'PRODUCTIVITY_DEDUCTION',
                description: `Productivity Deficit: ${Math.round(deficitRatio * 100)}% (${deficitHours.toFixed(1)}h)`,
                date: new Date(),
                severity: 'MEDIUM',
                deduction_points: deductionAmount, // Storing money as points for now, or need schema adjustment? 
                // Schema says deduction_points Decimal. Let's use it for money deduction value.
                created_by: employee.user_id!, // Self-system logged
              }
            });
          }
        }
      }
    } else {
      // Generic Logic for CS/Others
      const ticketTarget = targets.find(t => t.metric_name === 'Daily Tickets');
      const ticketActual = actuals.find(a => a.metric_name === 'Daily Tickets');
      if (ticketTarget && ticketActual) {
        efficiencyScore = Math.min((Number(ticketActual.actual_value) / Number(ticketTarget.target_value)) * 100, 120);
      }
    }

    // 4. Punctuality (Attendance)
    const attendance = await this.prisma.hRAttendance.findFirst({
      where: { employee_id: employeeId, date: { gte: dayStart, lte: dayEnd } }
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
    const totalScore = (efficiencyScore * 0.4) + (qualityScore * 0.3) + (punctualityScore * 0.3);

    // 6. Upsert Daily Rollup
    // @ts-ignore
    await this.prisma.kPIScore.upsert({
      where: { employee_id_date: { employee_id: employeeId, date: dayStart } },
      update: {
        efficiency_score: efficiencyScore,
        quality_score: qualityScore,
        behavior_score: behaviorScore,
        punctuality_score: punctualityScore,
        total_score: totalScore,
        // Gamification Points: 10 points if score > 90
        points_awarded: totalScore > 90 ? 10 : 0
      },
      create: {
        employee_id: employeeId,
        date: dayStart,
        efficiency_score: efficiencyScore,
        quality_score: qualityScore,
        behavior_score: behaviorScore,
        punctuality_score: punctualityScore,
        total_score: totalScore,
        points_awarded: totalScore > 90 ? 10 : 0
      }
    });

    // 7. Gamification Integrations
    if (totalScore > 90) {
      // Award Gamification Points using the service
      await this.gamificationService.awardPoints(
        employee.user_id!,
        10,
        `Daily KPI Bonus: ${totalScore.toFixed(0)}% (${periodKey})`
      );
      await this.gamificationService.updateMissionProgress(employee.user_id!, 'HIGH_KPI_SCORE', 1);
    }

    // Check Streak: No Fatal Issues
    const recentFatalIssues = await this.prisma.employeeIssue.count({
      where: {
        employee_id: employeeId,
        severity: 'FATAL',
        date: { gte: new Date(dayStart.getTime() - 7 * 24 * 60 * 60 * 1000) }
      }
    });

    if (recentFatalIssues === 0) {
      await this.gamificationService.updateMissionProgress(employee.user_id!, 'NO_FATAL_ISSUES_7_DAYS', 1);
    }

    // Check Streak: Warehouse 100% Target
    if ((role === UserRole.WH_MANAGER || role === 'WH_WORKER' as any) && efficiencyScore >= 100) {
      await this.gamificationService.updateMissionProgress(employee.user_id!, 'WH_100_PERCENT_5_DAYS', 1);
    }


    return { efficiencyScore, punctualityScore, totalScore };
  }

  async logIssue(dto: any, creatorId: string) {
    const { employeeId, type, description, date, severity, deductionPoints } = dto;

    // Validate employee exists
    const emp = await this.prisma.employee.findUnique({ where: { id: employeeId } });
    if (!emp) throw new NotFoundException('Employee not found');

    // @ts-ignore
    return this.prisma.employeeIssue.create({
      data: {
        employee_id: employeeId,
        type,
        description,
        date: new Date(date),
        severity,
        deduction_points: deductionPoints,
        created_by: creatorId,
      },
    });
  }

  async createTarget(dto: any) {
    const { role, userId, metricName, targetValue, period, weight } = dto;

    // @ts-ignore
    return this.prisma.kPITarget.create({
      data: {
        role,
        user_id: userId,
        metric_name: metricName,
        target_value: targetValue,
        period,
        weight,
      }
    });
  }

  async logActual(dto: any, creatorId: string) {
    const { userId, metricName, periodKey, actualValue } = dto;

    // @ts-ignore
    return this.prisma.kPIActual.upsert({
      where: {
        user_id_metric_name_period_key: {
          user_id: userId,
          metric_name: metricName,
          period_key: periodKey
        }
      },
      update: {
        actual_value: actualValue,
      },
      create: {
        user_id: userId,
        metric_name: metricName,
        period_key: periodKey,
        actual_value: actualValue,
      }
    });
  }
}

