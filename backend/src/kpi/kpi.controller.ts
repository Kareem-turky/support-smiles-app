import { Controller, Get, Post, Body, UseGuards, Request, Query, Param, Patch, Delete } from '@nestjs/common';
import { KpiService } from './kpi.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { CreateTargetDto } from './dto/create-target.dto';
import { LogActualDto } from './dto/log-actual.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('kpi')
@UseGuards(JwtAuthGuard, RolesGuard)
export class KpiController {
  constructor(private readonly kpiService: KpiService) { }

  // --- KPI Metrics Admin ---
  @Get('metrics')
  getMetrics(@Query('activeOnly') activeOnly?: string) {
    if (activeOnly === 'true') {
      return this.kpiService.getActiveMetrics();
    }
    return this.kpiService.getAllMetrics();
  }

  @Post('metrics')
  @Roles(UserRole.ADMIN)
  createMetric(@Body('name') name: string) {
    return this.kpiService.createMetric(name);
  }

  @Patch('metrics/:id')
  @Roles(UserRole.ADMIN)
  toggleMetric(@Param('id') id: string, @Body('is_active') is_active: boolean) {
    return this.kpiService.toggleMetric(id, is_active);
  }

  @Delete('metrics/:id')
  @Roles(UserRole.ADMIN)
  deleteMetric(@Param('id') id: string) {
    return this.kpiService.deleteMetric(id);
  }
  // --- END KPI Metrics Admin ---

  @Get('my-stats')
  getMyStats(@Request() req) {
    return this.kpiService.getMetrics(req.user.id);
  }

  @Get('team-stats')
  // @ts-ignore
  @Roles(UserRole.ADMIN, UserRole.CS_MANAGER, UserRole.ACC_MANAGER, UserRole.HR_MANAGER, UserRole.WH_MANAGER)
  getTeamStats(@Request() req) {
    return this.kpiService.getTeamStats(req.user);
  }

  @Post('issues')
  // @ts-ignore
  @Roles(UserRole.ADMIN, UserRole.CS_MANAGER, UserRole.ACC_MANAGER, UserRole.HR_MANAGER, UserRole.WH_MANAGER)
  logIssue(@Body() createIssueDto: CreateIssueDto, @Request() req) {
    return this.kpiService.logIssue(createIssueDto, req.user.id);
  }

  @Get('targets/team')
  @Roles(UserRole.ADMIN, UserRole.CS_MANAGER, UserRole.ACC_MANAGER, UserRole.HR_MANAGER, UserRole.WH_MANAGER)
  getTeamTargets(@Request() req, @Query('date') date: string) {
    return this.kpiService.getTeamTargets(req.user, date);
  }

  @Get('targets/my')
  getMyTargets(@Request() req, @Query('date') date: string) {
    return this.kpiService.getMyTargets(req.user.id, date);
  }

  @Post('targets')
  // @ts-ignore
  @Roles(UserRole.ADMIN, UserRole.CS_MANAGER, UserRole.ACC_MANAGER, UserRole.HR_MANAGER, UserRole.WH_MANAGER)
  createTarget(@Body() createTargetDto: CreateTargetDto, @Request() req) {
    return this.kpiService.createTarget(createTargetDto, req.user.id, req.user);
  }

  @Post('actuals')
  logActual(@Body() logActualDto: LogActualDto, @Request() req) {
    return this.kpiService.logActual(logActualDto, req.user);
  }

  @Post('calculate-daily')
  // @ts-ignore
  @Roles(UserRole.ADMIN, UserRole.CS_MANAGER, UserRole.ACC_MANAGER, UserRole.HR_MANAGER, UserRole.WH_MANAGER)
  async calculateDaily(@Body() body: { employeeId: string, date: string }) {
    try {
      return await this.kpiService.calculateDailyScore(body.employeeId, new Date(body.date));
    } catch (e: any) {
      console.error("CALC DAILY ERROR:", e);
      return { error: e.message, stack: e.stack };
    }
  }
}

