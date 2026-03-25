import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventType, NotificationType, Ticket, User } from '@prisma/client';

@Injectable()
export class EventsService {
    constructor(private prisma: PrismaService) { }

    async createTicketEvent(
        ticketId: string,
        actorId: string,
        eventType: EventType,
        meta: Record<string, any> = {},
    ) {
        return this.prisma.ticketEvent.create({
            data: {
                ticket_id: ticketId,
                actor_id: actorId,
                event_type: eventType,
                meta: JSON.stringify(meta),
            },
        });
    }

    async findAllByTicket(ticketId: string) {
        return this.prisma.ticketEvent.findMany({
            where: { ticket_id: ticketId },
            include: { actor: true },
            orderBy: { created_at: 'desc' },
        });
    }
}
