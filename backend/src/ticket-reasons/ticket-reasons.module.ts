import { Module } from '@nestjs/common';
import { TicketReasonsController } from './ticket-reasons.controller';
import { AdminTicketReasonsController } from './admin-ticket-reasons.controller';
import { TicketReasonsService } from './ticket-reasons.service';

@Module({
    controllers: [TicketReasonsController, AdminTicketReasonsController],
    providers: [TicketReasonsService],
    exports: [TicketReasonsService],
})
export class TicketReasonsModule { }
