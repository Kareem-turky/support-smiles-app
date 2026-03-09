import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { IntegrationAuthService } from '../integration-auth.service';

@Injectable()
export class ApiKeyGuard implements CanActivate {
    constructor(private authService: IntegrationAuthService) { }

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const request = context.switchToHttp().getRequest();
        const authHeader = request.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw new UnauthorizedException('Missing or invalid Authorization header');
        }

        const token = authHeader.split(' ')[1];
        const apiKey = await this.authService.validateApiKey(token);

        if (!apiKey) {
            throw new UnauthorizedException('Invalid API Key');
        }

        // Attach to request for logging/usage
        request.apiKey = apiKey;
        request.clientId = apiKey.client_id;

        return true;
    }
}
