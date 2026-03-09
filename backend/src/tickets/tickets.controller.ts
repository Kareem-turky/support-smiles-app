import { Controller, Get, Post, Patch, Param, Body, UseGuards, Query, Request } from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { TicketStatus } from '@prisma/client';

@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TicketsController {
    constructor(private ticketsService: TicketsService) { }

    @Post()
    create(@Request() req, @Body() createTicketDto: CreateTicketDto) {
        return this.ticketsService.create(createTicketDto, req.user);
    }

    @Get()
    findAll(@Request() req, @Query() filters: any) {
        return this.ticketsService.findAll(req.user, filters);
    }

    @Get(':id')
    findOne(@Request() req, @Param('id') id: string) {
        return this.ticketsService.findOne(id, req.user);
    }

    @Patch(':id')
    update(@Request() req, @Param('id') id: string, @Body() updateTicketDto: UpdateTicketDto) {
        return this.ticketsService.update(id, updateTicketDto, req.user);
    }

    @Post(':id/assign')
    assign(@Request() req, @Param('id') id: string, @Body('assigned_to') assigneeId: string) {
        return this.ticketsService.assign(id, assigneeId, req.user);
    }

    @Patch(':id/status')
    changeStatus(@Request() req, @Param('id') id: string, @Body('status') status: TicketStatus) {
        return this.ticketsService.changeStatus(id, status, req.user);
    }
}
