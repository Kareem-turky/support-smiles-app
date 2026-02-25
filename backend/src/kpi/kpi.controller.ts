import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
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

  @Post('targets')
  // @ts-ignore
  @Roles(UserRole.ADMIN, UserRole.CS_MANAGER, UserRole.ACC_MANAGER, UserRole.HR_MANAGER, UserRole.WH_MANAGER)
  createTarget(@Body() createTargetDto: CreateTargetDto) {
    return this.kpiService.createTarget(createTargetDto);
  }

  @Post('actuals')
  logActual(@Body() logActualDto: LogActualDto, @Request() req) {
    // If Admin/Manager, can log for anyone. If Agent, maybe only for themselves? (Handled in service or assumed trusted for now)
    return this.kpiService.logActual(logActualDto, req.user.id);
  }

  @Post('calculate-daily')
  // @ts-ignore
  @Roles(UserRole.ADMIN, UserRole.CS_MANAGER, UserRole.ACC_MANAGER, UserRole.HR_MANAGER, UserRole.WH_MANAGER)
  calculateDaily(@Body() body: { employeeId: string, date: string }) {
    return this.kpiService.calculateDailyScore(body.employeeId, new Date(body.date));
  }
}

