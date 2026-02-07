import { Controller, Get, Post, Param, Body, UseGuards, Request } from '@nestjs/common';
import { MessagesService } from './messages.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('tickets/:id/messages')
@UseGuards(JwtAuthGuard)
export class MessagesController {
    constructor(private messagesService: MessagesService) { }

    @Get()
    findAll(@Request() req, @Param('id') ticketId: string) {
        return this.messagesService.findAll(ticketId, req.user);
    }

    @Post()
    create(@Request() req, @Param('id') ticketId: string, @Body('message') message: string) {
        return this.messagesService.create(ticketId, message, req.user);
    }
}
