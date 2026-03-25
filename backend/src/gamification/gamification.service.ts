import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import {
  MissionStatus,
  RedemptionStatus,
  MissionFrequency,
  UserRole,
} from '@prisma/client';

@Injectable()
export class GamificationService {
  constructor(private prisma: PrismaService) {}

  async awardPoints(userId: string, amount: number, reason: string) {
    // 1. Create Point Record
    await this.prisma.gamificationPoint.create({
      data: { user_id: userId, amount, reason },
    });

    // 2. Check for Badges (Mock Logic for now)
    const totalPoints = await this.getTotalPoints(userId);

    // Simple rule: 100 points = Customer Champion (mock)
    if (totalPoints >= 100) {
      await this.awardBadge(userId, 'Customer Champion');
    }

    // Log Event
    await this.logEvent(userId, 'POINTS_AWARDED', amount, { reason });

    return { totalPoints, awarded: true };
  }

  async getTotalPoints(userId: string) {
    const points = await this.prisma.gamificationPoint.aggregate({
      where: { user_id: userId },
      _sum: { amount: true },
    });
    return Number(points._sum.amount || 0);
  }

  async awardBadge(userId: string, badgeName: string) {
    const badge = await this.prisma.gamificationBadge.findUnique({
      where: { name: badgeName },
    });
    if (!badge) return;

    // Check if already awarded
    const existing = await this.prisma.userBadge.findUnique({
      where: { user_id_badge_id: { user_id: userId, badge_id: badge.id } },
    });
    if (existing) return;

    await this.prisma.userBadge.create({
      data: { user_id: userId, badge_id: badge.id },
    });

    await this.logEvent(userId, 'BADGE_AWARDED', 0, { badge_name: badgeName });
  }

  async getMyProgress(userId: string) {
    const totalPoints = await this.getTotalPoints(userId);
    const badges = await this.prisma.userBadge.findMany({
      where: { user_id: userId },
      include: { badge: true },
    });
    const level = Math.floor(totalPoints / 1000) + 1; // 1000 points per level

    // Recent history
    const history = await this.prisma.gamificationPoint.findMany({
      where: { user_id: userId },
      orderBy: { created_at: 'desc' },
      take: 5,
    });

    const next_level_points = level * 1000;

    const streaks = await this.prisma.streak.findMany({
      where: { user_id: userId },
    });

    return {
      level,
      points: totalPoints,
      next_level_points,
      streaks,
      badges,
      history,
    };
  }

  async getLeaderboard(range?: string, departmentId?: string) {
    // Filter by department if provided
    let userFilter = {};
    if (departmentId) {
      userFilter = { employee: { department_id: departmentId } };
    }

    const grouped = await this.prisma.gamificationPoint.groupBy({
      by: ['user_id'],
      where: { user: userFilter },
      _sum: { amount: true },
      orderBy: { _sum: { amount: 'desc' } },
      take: 20,
    });

    const leaderboard = [];
    for (const entry of grouped) {
      const user = await this.prisma.user.findUnique({
        where: { id: entry.user_id },
        include: { employee: { include: { department: true } } },
      });
      if (user) {
        leaderboard.push({
          user_id: user.id,
          user: user.name,
          role: user.role,
          department: user.employee?.department?.name,
          points: Number(entry._sum.amount),
          avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + user.id,
        });
      }
    }
    return leaderboard;
  }

  // --- Missions ---

  async getMyMissions(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { employee: true },
    });
    if (!user) throw new NotFoundException('User not found');

    // 1. Fetch relevant missions (Role/Dept scope)
    const missions = await this.prisma.mission.findMany({
      where: {
        OR: [
          { role_scope: user.role },
          { department_id: user.employee?.department_id },
          { role_scope: null, department_id: null },
        ],
      },
      include: {
        assignments: {
          where: { user_id: userId },
        },
      },
    });

    return missions;
  }

  async createMission(dto: any, creatorId: string) {
    return this.prisma.mission.create({
      data: {
        ...dto,
        created_by: creatorId,
      },
    });
  }

  async assignMission(missionId: string, userIds: string[]) {
    const assignments = userIds.map((userId) => ({
      mission_id: missionId,
      user_id: userId,
      status: MissionStatus.ACTIVE,
    }));

    return this.prisma.missionAssignment.createMany({
      data: assignments,
    });
  }

  async updateMissionProgress(
    userId: string,
    metricKey: string,
    increment: number,
  ) {
    const assignments = await this.prisma.missionAssignment.findMany({
      where: {
        user_id: userId,
        status: MissionStatus.ACTIVE,
        mission: {
          metric_key: metricKey,
        },
      },
      include: { mission: true },
    });

    for (const assignment of assignments) {
      const newProgress = Number(assignment.progress_value) + increment;
      const target = Number(assignment.mission.target_value);

      if (newProgress >= target) {
        await this.prisma.missionAssignment.update({
          where: { id: assignment.id },
          data: {
            progress_value: target,
            status: MissionStatus.DONE,
            completed_at: new Date(),
          },
        });
        // Award points
        await this.awardPoints(
          userId,
          assignment.mission.points,
          `Completed Mission: ${assignment.mission.title}`,
        );
      } else {
        await this.prisma.missionAssignment.update({
          where: { id: assignment.id },
          data: { progress_value: newProgress },
        });
      }
    }
  }

  // --- Rewards ---

  async getRewards(role?: UserRole) {
    return this.prisma.reward.findMany({
      where: {
        active: true,
        OR: [{ role_scope: role }, { role_scope: null }],
      },
    });
  }

  async redeemReward(userId: string, rewardId: string) {
    const reward = await this.prisma.reward.findUnique({
      where: { id: rewardId },
    });
    if (!reward || !reward.active)
      throw new NotFoundException('Reward not found');

    const totalPoints = await this.getTotalPoints(userId);
    if (totalPoints < reward.cost_points) {
      throw new BadRequestException('Insufficient points');
    }

    // Deduct points (by adding a negative record)
    await this.awardPoints(
      userId,
      -reward.cost_points,
      `Redeemed Reward: ${reward.name}`,
    );

    return this.prisma.rewardRedemption.create({
      data: {
        user_id: userId,
        reward_id: rewardId,
        status: RedemptionStatus.REQUESTED,
      },
    });
  }

  async getRedemptions() {
    return this.prisma.rewardRedemption.findMany({
      include: {
        user: { select: { name: true, role: true } },
        reward: true,
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async approveRedemption(id: string, status: RedemptionStatus) {
    const redemption = await this.prisma.rewardRedemption.update({
      where: { id },
      data: { status },
    });
    // If rejected, refund points?
    if (status === RedemptionStatus.REJECTED) {
      const reward = await this.prisma.reward.findUnique({
        where: { id: redemption.reward_id },
      });
      if (reward) {
        await this.awardPoints(
          redemption.user_id,
          reward.cost_points,
          `Refund for rejected reward: ${reward.name}`,
        );
      }
    }
    return redemption;
  }

  // --- Actions & Events ---

  async logEvent(
    userId: string,
    type: string,
    points: number = 0,
    meta: any = {},
  ) {
    return this.prisma.gamificationEvent.create({
      data: {
        user_id: userId,
        type,
        points,
        meta_json: JSON.stringify(meta),
      },
    });
  }

  async handleShiftAction(userId: string, action: 'START' | 'END') {
    await this.logEvent(userId, `SHIFT_${action}`);
    if (action === 'START') {
      await this.updateStreak(userId, 'DAILY_SHIFT');
    }
  }

  async updateStreak(userId: string, key: string) {
    const streak = await this.prisma.streak.findUnique({
      where: { user_id_key: { user_id: userId, key } },
    });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (!streak) {
      await this.prisma.streak.create({
        data: {
          user_id: userId,
          key,
          current_count: 1,
          best_count: 1,
          last_hit_date: today,
        },
      });
      return;
    }

    const lastHit = streak.last_hit_date
      ? new Date(streak.last_hit_date)
      : null;
    if (lastHit && lastHit.getTime() === today.getTime()) {
      return; // Already hit today
    }

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (lastHit && lastHit.getTime() === yesterday.getTime()) {
      // Continue streak
      const newCount = streak.current_count + 1;
      await this.prisma.streak.update({
        where: { id: streak.id },
        data: {
          current_count: newCount,
          best_count: Math.max(streak.best_count, newCount),
          last_hit_date: today,
        },
      });

      // Bonus points for milestones
      if (newCount % 7 === 0) {
        await this.awardPoints(userId, 100, `7-Day ${key} Streak!`);
      }
    } else {
      // Reset streak
      await this.prisma.streak.update({
        where: { id: streak.id },
        data: {
          current_count: 1,
          last_hit_date: today,
        },
      });
    }
  }
}
