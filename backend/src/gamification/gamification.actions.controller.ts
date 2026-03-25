import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import {
  SubmitDailyDoneDto,
  ReportIssueDto,
} from './dto/interactive-gamification.dto';

@Controller('gamification/actions')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GamificationActionsController {
  constructor(private readonly gamificationService: GamificationService) {}

  @Post('start-shift')
  startShift(@Request() req) {
    return this.gamificationService.handleShiftAction(req.user.id, 'START');
  }

  @Post('end-shift')
  endShift(@Request() req) {
    return this.gamificationService.handleShiftAction(req.user.id, 'END');
  }

  @Post('submit-daily-done')
  submitDailyDone(@Body() dto: SubmitDailyDoneDto, @Request() req) {
    // Standard daily submission logic
    // We can also calculate points or update missions here
    const totalUnits = dto.actual_units_by_hour.reduce((a, b) => a + b, 0);
    return this.gamificationService.logEvent(
      req.user.id,
      'DAILY_SUBMISSION',
      0,
      { ...dto, total_units: totalUnits },
    );
  }

  @Post('report-issue')
  reportIssue(@Body() dto: ReportIssueDto, @Request() req) {
    return this.gamificationService.logEvent(
      req.user.id,
      'ISSUE_REPORTED',
      0,
      dto,
    );
  }
}
