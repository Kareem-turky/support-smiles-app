import { Module } from '@nestjs/common';
import { KpiService } from './kpi.service';
import { KpiController } from './kpi.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { GamificationModule } from '../gamification/gamification.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, GamificationModule, NotificationsModule],
  controllers: [KpiController],
  providers: [KpiService],
  exports: [KpiService]
})
export class KpiModule { }
