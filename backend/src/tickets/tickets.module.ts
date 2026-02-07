import { Module } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { TicketsController } from './tickets.controller';
import { EventsService } from '../events/events.service';
import { TicketReasonsModule } from '../ticket-reasons/ticket-reasons.module';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
    imports: [PrismaModule, TicketReasonsModule],
    controllers: [TicketsController],
    providers: [TicketsService, EventsService],
})
export class TicketsModule { }
