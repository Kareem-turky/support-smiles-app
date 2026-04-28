import { Module } from '@nestjs/common';
import { HRController } from './hr.controller';
import { HRService } from './hr.service';
import { PrismaModule } from '../prisma/prisma.module';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
  imports: [PrismaModule, GamificationModule],
  controllers: [HRController],
  providers: [HRService],
  exports: [HRService],
})
export class HRModule {}
