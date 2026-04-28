import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Query,
  Request,
  Delete,
} from '@nestjs/common';
import { TicketsService } from './tickets.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { TicketStatus, UserRole } from '@prisma/client';

import { PermissionsGuard } from '../common/guards/permissions.guard';
import { RequirePermissions } from '../common/decorators/permissions.decorator';

@Controller('tickets')
@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
export class TicketsController {

  constructor(private ticketsService: TicketsService) {}

  @Post()
  @RequirePermissions('tickets:tickets:create')
  create(@Request() req, @Body() createTicketDto: CreateTicketDto) {
    return this.ticketsService.create(createTicketDto, req.user);
  }


  @Get()
  @RequirePermissions('tickets:tickets:read')
  findAll(@Request() req, @Query() filters: any) {
    return this.ticketsService.findAll(req.user, filters);
  }


  @Get(':id')
  @RequirePermissions('tickets:tickets:read')
  findOne(@Request() req, @Param('id') id: string) {
    return this.ticketsService.findOne(id, req.user);
  }


  @Get(':id/events')
  getEvents(@Param('id') id: string) {
    return this.ticketsService.getEvents(id);
  }

  @Patch(':id/reopen')
  @Roles(UserRole.ADMIN, UserRole.CS_MANAGER)
  @RequirePermissions('tickets:tickets:manage')
  reopen(@Param('id') id: string, @Request() req) {
    return this.ticketsService.reopen(id, req.user);
  }


  @Patch(':id')
  @RequirePermissions('tickets:tickets:update')
  update(
    @Request() req,
    @Param('id') id: string,
    @Body() updateTicketDto: UpdateTicketDto,
  ) {
    return this.ticketsService.update(id, updateTicketDto, req.user);
  }


  @Post(':id/assign')
  @RequirePermissions('tickets:tickets:manage')
  assign(
    @Request() req,
    @Param('id') id: string,
    @Body('assigned_to') assigneeId: string,
  ) {
    return this.ticketsService.assign(id, assigneeId, req.user);
  }


  @Patch(':id/status')
  @RequirePermissions('tickets:tickets:manage')
  changeStatus(
    @Request() req,
    @Param('id') id: string,
    @Body('status') status: TicketStatus,
  ) {
    return this.ticketsService.changeStatus(id, status, req.user);
  }


  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.CS_MANAGER)
  @RequirePermissions('tickets:tickets:manage')
  remove(@Param('id') id: string, @Request() req) {
    console.log(
      '[DEBUG] TicketsController.remove called for id:',
      id,
      'by user:',
      req.user.id,
    );
    return this.ticketsService.remove(id, req.user);
  }

}
