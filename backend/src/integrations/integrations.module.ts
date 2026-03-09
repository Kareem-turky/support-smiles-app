import { Module } from '@nestjs/common';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsService } from './integrations.service';
import { WebhooksService } from './webhooks.service';
import { IntegrationAuthService } from './integration-auth.service';

import { IntegrationsAdminController } from './integrations-admin.controller';

@Module({
  controllers: [IntegrationsController, IntegrationsAdminController],
  providers: [IntegrationsService, WebhooksService, IntegrationAuthService]
})
export class IntegrationsModule { }
