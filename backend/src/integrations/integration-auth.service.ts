import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as argon2 from 'argon2';

@Injectable()
export class IntegrationAuthService {
    constructor(private prisma: PrismaService) { }

    /**
     * Validates an API key in format `key_id.secret`
     */
    async validateApiKey(rawKey: string): Promise<any> {
        const [keyId, secret] = rawKey.split('.');

        if (!keyId || !secret) {
            return null;
        }

        const apiKeyRecord = await this.prisma.integrationApiKey.findUnique({
            where: { id: keyId },
            include: { client: true },
        });

        if (!apiKeyRecord || !apiKeyRecord.is_active || !apiKeyRecord.client.is_active) {
            return null;
        }

        const isValid = await argon2.verify(apiKeyRecord.key_hash, secret);
        if (!isValid) {
            return null;
        }

        // Update last used asynchronously
        this.prisma.integrationApiKey.update({
            where: { id: keyId },
            data: { last_used_at: new Date() },
        }).catch(err => console.error('Failed to update last_used_at', err));

        return apiKeyRecord;
    }

    /**
     * Generates a new API Key for a client.
     * Format: `key_id.secret`
     * Only the secret is returned once.
     */
    async createApiKey(clientId: string, scopes: string[] = []) {
        const secret = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
        const hash = await argon2.hash(secret);

        const keyRecord = await this.prisma.integrationApiKey.create({
            data: {
                client_id: clientId,
                key_hash: hash,
                scopes,
            },
        });

        return {
            key: `${keyRecord.id}.${secret}`,
            ...keyRecord,
        };
    }
}
