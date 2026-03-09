import { Controller, Post, Get, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { IntegrationsService } from './integrations.service';
import { ApiKeyGuard } from './guards/api-key.guard';
import { CreateIssueDto, CreateMessageDto, UpdateStatusDto } from './dto';

@Controller('api/v1/integrations')
export class IntegrationsController {
    constructor(private integrationService: IntegrationsService) { }

    @Post('issues')
    async createIssue(@Req() req: any, @Body() dto: CreateIssueDto) {
        return this.integrationService.processInboundIssue(req.clientId, dto);
    }

    // Placeholder endpoints for later implementation
    @Post('tickets/:id/messages')
    async addMessage(@Param('id') id: string, @Body() dto: CreateMessageDto) {
        return { message: 'Not implemented yet' };
    }

    @Patch('tickets/:id/status')
    async updateStatus(@Param('id') id: string, @Body() dto: UpdateStatusDto) {
        return { message: 'Not implemented yet' };
    }
}
