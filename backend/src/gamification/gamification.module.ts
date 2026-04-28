import { Module } from '@nestjs/common';
import { GamificationService } from './gamification.service';
import { GamificationController } from './gamification.controller';
import { GamificationActionsController } from './gamification.actions.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [GamificationController, GamificationActionsController],
  providers: [GamificationService],
  exports: [GamificationService],
})
export class GamificationModule {}
