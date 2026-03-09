import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { TicketReasonsService } from './ticket-reasons.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('ticket-reasons')
@UseGuards(JwtAuthGuard)
export class TicketReasonsController {
    constructor(private service: TicketReasonsService) { }

    @Get()
    async findAll(@Query('activeOnly') activeOnly: string) {
        return this.service.findAll(activeOnly === 'true');
    }
}
