import { Controller, Get, Post, Patch, Body, UseGuards, Request, Param, Query } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';
import { CreateMissionDto, AssignMissionDto, RedeemRewardDto } from './dto/interactive-gamification.dto';

@Controller('gamification')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GamificationController {
  constructor(private readonly gamificationService: GamificationService) { }

  @Get('my-progress')
  getMyProgress(@Request() req) {
    return this.gamificationService.getMyProgress(req.user.id);
  }

  @Get('leaderboard')
  getLeaderboard(@Query('range') range: string, @Query('departmentId') departmentId: string) {
    return this.gamificationService.getLeaderboard(range, departmentId);
  }

  @Get('missions/my')
  getMyMissions(@Request() req) {
    return this.gamificationService.getMyMissions(req.user.id);
  }

  // Alias for backward compatibility
  @Get('missions')
  getMissionsAlias(@Request() req) {
    return this.gamificationService.getMyMissions(req.user.id);
  }

  @Get('rewards')
  getRewards(@Request() req) {
    return this.gamificationService.getRewards(req.user.role);
  }

  @Post('rewards/redeem')
  redeemReward(@Body() dto: RedeemRewardDto, @Request() req) {
    return this.gamificationService.redeemReward(req.user.id, dto.reward_id);
  }

  // --- Manager Endpoints ---

  @Post('missions')
  @Roles(UserRole.ADMIN, UserRole.CS_MANAGER, UserRole.WH_MANAGER, UserRole.ACC_MANAGER, UserRole.HR_MANAGER)
  createMission(@Body() dto: CreateMissionDto, @Request() req) {
    return this.gamificationService.createMission(dto, req.user.id);
  }

  @Post('missions/:id/assign')
  @Roles(UserRole.ADMIN, UserRole.CS_MANAGER, UserRole.WH_MANAGER, UserRole.ACC_MANAGER, UserRole.HR_MANAGER)
  assignMission(@Param('id') id: string, @Body() dto: AssignMissionDto) {
    return this.gamificationService.assignMission(id, dto.user_ids);
  }

  @Get('rewards/redemptions')
  @Roles(UserRole.ADMIN, UserRole.CS_MANAGER, UserRole.WH_MANAGER, UserRole.ACC_MANAGER, UserRole.HR_MANAGER)
  getRedemptions() {
    return this.gamificationService.getRedemptions();
  }

  @Patch('rewards/redemptions/:id')
  @Roles(UserRole.ADMIN, UserRole.CS_MANAGER, UserRole.WH_MANAGER, UserRole.ACC_MANAGER, UserRole.HR_MANAGER)
  approveRedemption(@Param('id') id: string, @Body('status') status: any) {
    return this.gamificationService.approveRedemption(id, status);
  }

  // Dev endpoint to trigger points
  @Post('debug/award')
  awardPoints(@Body() body: { amount: number, reason: string }, @Request() req) {
    return this.gamificationService.awardPoints(req.user.id, body.amount, body.reason);
  }
}
