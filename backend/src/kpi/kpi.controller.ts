import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Request,
  Query,
  Param,
  Patch,
  Delete,
} from '@nestjs/common';
import { KpiService } from './kpi.service';
import { CreateIssueDto } from './dto/create-issue.dto';
import { CreateTargetDto } from './dto/create-target.dto';
import { LogActualDto } from './dto/log-actual.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';

@Controller('kpi')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class KpiController {

  constructor(private readonly kpiService: KpiService) {}

  // --- KPI Metrics Admin ---
  @Get('metrics')
  @RequirePermissions('kpi:metrics:read')
  getMetrics(@Query('activeOnly') activeOnly?: string) {
    if (activeOnly === 'true') {
      return this.kpiService.getActiveMetrics();
    }
    return this.kpiService.getAllMetrics();
  }


  @Post('metrics')
  @Roles(UserRole.ADMIN)
  @RequirePermissions('kpi:metrics:manage')
  createMetric(@Body('name') name: string) {
    return this.kpiService.createMetric(name);
  }


  @Patch('metrics/:id')
  @Roles(UserRole.ADMIN)
  @RequirePermissions('kpi:metrics:manage')
  toggleMetric(@Param('id') id: string, @Body('is_active') is_active: boolean) {
    return this.kpiService.toggleMetric(id, is_active);
  }


  @Delete('metrics/:id')
  @Roles(UserRole.ADMIN)
  @RequirePermissions('kpi:metrics:manage')
  deleteMetric(@Param('id') id: string) {
    return this.kpiService.deleteMetric(id);
  }

  // --- END KPI Metrics Admin ---

  @Get('my-stats')
  async getMyStats(
    @Request() req,
    @Query() query: { period?: string; frequency?: string },
  ) {
    const employee = await this.kpiService.getEmployeeByUserId(req.user.id);
    if (!employee) {
      return {
        period: query.period || new Date().toISOString().slice(0, 7),
        user_role: req.user.role,
        metrics: [],
        issues: [],
        total_base_score: 0,
        total_deductions: 0,
        final_score: 0,
      };
    }
    return this.kpiService.getMetrics(
      employee.id,
      query.period,
      query.frequency,
    );
  }

  @Get('team-stats')
  @Roles(
    UserRole.ADMIN,
    UserRole.CS_MANAGER,
    UserRole.ACC_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.WH_MANAGER,
  )
  @RequirePermissions('kpi:metrics:read')
  getTeamStats(@Request() req, @Query() query: { period?: string; frequency?: string }) {
    return this.kpiService.getTeamStats(req.user, query.period, query.frequency);
  }


  @Post('issues')
  @Roles(
    UserRole.ADMIN,
    UserRole.CS_MANAGER,
    UserRole.ACC_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.WH_MANAGER,
  )
  @RequirePermissions('kpi:issues:create')
  logIssue(@Body() createIssueDto: CreateIssueDto, @Request() req) {
    return this.kpiService.logIssue(createIssueDto, req.user);
  }


  @Get('team-active-targets')
  @Roles(
    UserRole.ADMIN,
    UserRole.CS_MANAGER,
    UserRole.ACC_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.WH_MANAGER,
  )
  @RequirePermissions('kpi:targets:read')
  getTeamTargets(
    @Request() req,
    @Query() query: { period?: string; frequency?: string },
  ) {
    return this.kpiService.getTeamTargets(req.user, query);
  }


  @Get('targets/my')
  getMyTargets(@Request() req, @Query('date') date: string) {
    return this.kpiService.getMyTargets(req.user.id, date);
  }

  @Post('targets')
  @Roles(
    UserRole.ADMIN,
    UserRole.CS_MANAGER,
    UserRole.ACC_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.WH_MANAGER,
  )
  @RequirePermissions('kpi:targets:create')
  createTarget(@Body() createTargetDto: any, @Request() req) {
    return this.kpiService.createTarget(createTargetDto, req.user.id, req.user);
  }


  @Patch('targets/:id')
  @Roles(
    UserRole.ADMIN,
    UserRole.CS_MANAGER,
    UserRole.ACC_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.WH_MANAGER,
  )
  @RequirePermissions('kpi:targets:update')
  updateTarget(
    @Param('id') id: string,
    @Body() updateDto: any,
    @Request() req,
  ) {
    return this.kpiService.updateTarget(id, updateDto, req.user);
  }


  @Post('actuals/log')
  @Roles(
    UserRole.ADMIN,
    UserRole.CS_MANAGER,
    UserRole.ACC_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.WH_MANAGER,
  )
  @RequirePermissions('kpi:actuals:log')
  logActual(@Body() logActualDto: any, @Request() req) {
    return this.kpiService.logActual(logActualDto, req.user);
  }


  @Patch('actuals/:id')
  @Roles(
    UserRole.ADMIN,
    UserRole.CS_MANAGER,
    UserRole.ACC_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.WH_MANAGER,
  )
  updateActual(
    @Param('id') id: string,
    @Body() updateDto: any,
    @Request() req,
  ) {
    return this.kpiService.updateActual(id, updateDto, req.user);
  }

  @Post('calculate-daily')
  @Roles(
    UserRole.ADMIN,
    UserRole.CS_MANAGER,
    UserRole.ACC_MANAGER,
    UserRole.HR_MANAGER,
    UserRole.WH_MANAGER,
  )
  @RequirePermissions('kpi:calculation:run')
  async calculateDaily(@Body() body: { employeeId: string; date: string }) {
    try {
      return await this.kpiService.calculateDailyScore(
        body.employeeId,
        new Date(body.date),
      );
    } catch (e: any) {
      console.error('CALC DAILY ERROR:', e);
      return { error: e.message, stack: e.stack };
    }
  }

}
