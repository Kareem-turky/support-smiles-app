import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { EventsService } from '../events/events.service';
import { TicketReasonsModule } from '../ticket-reasons/ticket-reasons.module';
import { PrismaModule } from '../prisma/prisma.module';
import { GamificationModule } from '../gamification/gamification.module';

@Module({
    imports: [PrismaModule, TicketReasonsModule, GamificationModule],
    controllers: [TicketsController],
    providers: [TicketsService, EventsService],
})
export class TicketsModule { }
