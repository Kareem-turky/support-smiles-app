import { Injectable, BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateIssueDto } from './dto';
import { v4 as uuidv4 } from 'uuid';
import { WebhooksService } from './webhooks.service';

@Injectable()
export class IntegrationsService {
    constructor(
        private prisma: PrismaService,
        private webhooksService: WebhooksService
    ) { }

    async processInboundIssue(clientId: string | undefined, dto: CreateIssueDto) {
        // Resolve Client ID (or use Internal)
        const finalClientId = clientId || await this.getInternalClientId();

        // 1. Idempotency Check
        const existingInbox = await this.prisma.integrationInbox.findUnique({
            where: {
                client_id_source_external_id: {
                    client_id: finalClientId,
                    source: dto.source,
                    external_id: dto.external_id,
                },
            },
        });

        if (existingInbox) {
            if (existingInbox.ticket_id) {
                return {
                    request_id: uuidv4(),
                    data: { ticket_id: existingInbox.ticket_id, duplicate: true },
                };
            }
        }

        // 2. Routing Logic
        let assignedTo: string | undefined = undefined;
        let priority = dto.priority; // Default to provided
        let reasonId = dto.reason_id;

        if (dto.reason_id) {
            const reason = await this.prisma.ticketReason.findUnique({ where: { id: dto.reason_id } });
            if (reason) {
                // Auto-assign role logic
                if (reason.default_assign_role) {
                    // Simple strategy: Find first active user with role. 
                    // Real-world: Round robin or load balanced.
                    const assignee = await this.prisma.user.findFirst({
                        where: { role: reason.default_assign_role, is_active: true }
                    });
                    if (assignee) assignedTo = assignee.id;
                }
                // Reason default priority can override provided? 
                // Usually explicit DTO priority takes precedence, but if DTO sends 'MEDIUM' (default) 
                // and Reason says 'URGENT', maybe we stick to DTO. 
                // Let's assume DTO is capable of knowing what it wants.
            }
        }

        const creatorId = await this.getSystemUser();
        const defaultStatus = 'NEW';

        // 3. Create Ticket & Inbox Record Transaction
        try {
            const result = await this.prisma.$transaction(async (tx) => {
                // Create Ticket
                const ticket = await tx.ticket.create({
                    data: {
                        order_number: dto.order_number,
                        courier_company: dto.courier_company || 'Unknown',
                        issue_type: dto.issue_type,
                        priority: priority,
                        status: defaultStatus,
                        description: dto.description,
                        created_by: creatorId,
                        assigned_to: assignedTo,
                        reason_id: reasonId,
                    },
                });

                // Create Inbox Record
                await tx.integrationInbox.create({
                    data: {
                        client_id: finalClientId,
                        source: dto.source,
                        external_id: dto.external_id,
                        ticket_id: ticket.id,
                        payload_json: dto as any,
                    },
                });

                // Create Event
                await tx.ticketEvent.create({
                    data: {
                        ticket_id: ticket.id,
                        actor_id: creatorId,
                        event_type: 'TICKET_CREATED',
                        meta: { source: dto.source, external_id: dto.external_id },
                    },
                });

                // Auto-assign event
                if (assignedTo) {
                    await tx.ticketEvent.create({
                        data: {
                            ticket_id: ticket.id,
                            actor_id: creatorId,
                            event_type: 'TICKET_ASSIGNED',
                            meta: { assigned_to: assignedTo, reason: 'Auto-routing by Reason' },
                        },
                    });
                }

                return ticket;
            });

            // 4. Dispatch Webhook (Async)
            this.webhooksService.dispatch(finalClientId, 'TICKET_CREATED', {
                ticket_id: result.id,
                order_number: result.order_number,
                status: result.status,
                external_id: dto.external_id
            });

            return {
                request_id: uuidv4(),
                data: { ticket_id: result.id, duplicate: false },
            };

        } catch (error) {
            if (error.code === 'P2002') {
                const raceInbox = await this.prisma.integrationInbox.findUnique({
                    where: { client_id_source_external_id: { client_id: finalClientId, source: dto.source, external_id: dto.external_id } }
                });
                if (raceInbox && raceInbox.ticket_id) {
                    return { request_id: uuidv4(), data: { ticket_id: raceInbox.ticket_id, duplicate: true } };
                }
                throw error;
            }
            throw error;
        }
    }

    private async getSystemUser(): Promise<string> {
        const sysEmail = 'system@integration.platform';
        let user = await this.prisma.user.findUnique({ where: { email: sysEmail } });
        if (!user) {
            user = await this.prisma.user.create({
                data: {
                    name: 'System Integration',
                    email: sysEmail,
                    password_hash: 'system_managed',
                    role: 'ADMIN',
                },
            });
        }
        return user.id;
    }

    private async getInternalClientId(): Promise<string> {
        const internalName = 'INTERNAL_FULFLY';
        let client = await this.prisma.integrationClient.findFirst({ where: { name: internalName } });
        if (!client) {
            client = await this.prisma.integrationClient.create({
                data: {
                    name: internalName,
                    is_active: true
                }
            });
        }
        return client.id;
    }
}
