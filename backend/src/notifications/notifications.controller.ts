import { Controller, Get, Post, Patch, Param, UseGuards, Request } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
    constructor(private notificationsService: NotificationsService) { }

    @Get()
    findAll(@Request() req) {
        return this.notificationsService.findAll(req.user);
    }

    @Post(':id/read') // Contract says POST
    markRead(@Request() req, @Param('id') id: string) {
        return this.notificationsService.markRead(id, req.user);
    }

    @Post('read-all') // Contract says POST
    markAllRead(@Request() req) {
        return this.notificationsService.markAllRead(req.user);
    }
}
