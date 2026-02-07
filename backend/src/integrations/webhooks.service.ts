import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { createHmac } from 'crypto';
import { EventType } from '@prisma/client';

@Injectable()
export class WebhooksService {
    constructor(private prisma: PrismaService) { }

    async dispatch(clientId: string, eventType: EventType, payload: any) {
        // 1. Find subscriptions for this client + event type
        const subscriptions = await this.prisma.webhookSubscription.findMany({
            where: {
                client_id: clientId,
                is_active: true,
                events: { has: eventType },
            },
        });

        if (!subscriptions.length) return;

        // 2. Create Delivery Records (Pending)
        const deliveries = await Promise.all(
            subscriptions.map(sub => this.prisma.webhookDelivery.create({
                data: {
                    subscription_id: sub.id,
                    event_type: eventType,
                    payload_json: payload,
                    status: 'PENDING',
                    next_retry_at: new Date(), // Immediate
                }
            }))
        );

        // 3. Process deliveries (Fire and forget or queue)
        // For this implementation, we process immediately in background
        deliveries.forEach(d => this.processDelivery(d.id));
    }

    async processDelivery(deliveryId: string) {
        const delivery = await this.prisma.webhookDelivery.findUnique({
            where: { id: deliveryId },
            include: { subscription: true }
        });
        if (!delivery) return;

        try {
            const signature = this.signPayload(delivery.payload_json, delivery.subscription.secret);

            const response = await fetch(delivery.subscription.target_url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Event-Type': delivery.event_type,
                    'X-Delivery-Id': delivery.id,
                    'X-Signature': signature,
                },
                body: JSON.stringify(delivery.payload_json),
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            await this.prisma.webhookDelivery.update({
                where: { id: deliveryId },
                data: { status: 'SUCCESS', attempts: { increment: 1 }, last_error: null }
            });

        } catch (error) {
            const nextRetry = this.calculateBackoff(delivery.attempts + 1);
            const status = nextRetry ? 'PENDING' : 'FAILED';

            await this.prisma.webhookDelivery.update({
                where: { id: deliveryId },
                data: {
                    status,
                    attempts: { increment: 1 },
                    last_error: error.message,
                    next_retry_at: nextRetry
                }
            });
        }
    }

    private signPayload(payload: any, secret: string): string {
        const hmac = createHmac('sha256', secret);
        hmac.update(JSON.stringify(payload));
        return hmac.digest('hex');
    }

    private calculateBackoff(attempts: number): Date | null {
        if (attempts > 5) return null; // Max retries
        const delay = Math.pow(2, attempts) * 1000; // Exponential backoff in ms
        return new Date(Date.now() + delay);
    }
}
