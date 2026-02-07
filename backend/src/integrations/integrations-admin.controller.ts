import { Controller, Post, Body, UseGuards, Param } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IntegrationAuthService } from './integration-auth.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '@prisma/client';

@Controller('admin/integrations')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class IntegrationsAdminController {
    constructor(
        private prisma: PrismaService,
        private authService: IntegrationAuthService
    ) { }

    @Post('clients')
    async createClient(@Body('name') name: string) {
        return this.prisma.integrationClient.create({
            data: { name },
        });
    }

    @Post('clients/:id/keys')
    async generateKey(
        @Param('id') id: string,
        @Body('scopes') scopes: string[]
    ) {
        return this.authService.createApiKey(id, scopes);
    }

    @Post('webhooks')
    async createWebhook(@Body() dto: { clientId: string, name: string, url: string, secret: string, events: any[] }) {
        return this.prisma.webhookSubscription.create({
            data: {
                client_id: dto.clientId,
                name: dto.name,
                target_url: dto.url,
                secret: dto.secret,
                events: dto.events
            }
        });
    }
}
