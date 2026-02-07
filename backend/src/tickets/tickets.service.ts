import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
import { TicketReasonsService } from '../ticket-reasons/ticket-reasons.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { User, UserRole, TicketStatus, EventType, NotificationType, Priority } from '@prisma/client';

@Injectable()
export class TicketsService {
    constructor(
        private prisma: PrismaService,
        private eventsService: EventsService,
        private reasonsService: TicketReasonsService,
    ) { }

    async create(createTicketDto: CreateTicketDto, user: User) {
        if (user.role === UserRole.CS) {
            throw new ForbiddenException('CS users cannot create tickets');
        }

        // Validate Reason
        const reason = await this.reasonsService.findOne(createTicketDto.reason_id);
        if (!reason.is_active) {
            throw new ForbiddenException('Selected reason is not active');
        }

        // --- Routing Logic ---
        let assignedTo = createTicketDto.assigned_to;
        let priority = createTicketDto.priority;

        // Auto-set Priority if not provided or default
        if (reason.default_priority && !priority) {
            priority = reason.default_priority;
        }

        // Auto-assign Logic
        if (!assignedTo) {
            let targetRole: UserRole | null = reason.default_assign_role;

            // Fallback mapping if no explicit role set on reason
            if (!targetRole) {
                switch (reason.category) {
                    case 'ACCOUNTING':
                        targetRole = UserRole.ACCOUNTING;
                        break;
                    case 'CS':
                    case 'SHIPPING': // Map Shipping to CS per requirement
                        targetRole = UserRole.CS;
                        break;
                    default:
                        targetRole = null;
                }
            }

            if (targetRole) {
                // Find first available active user in role
                const assignee = await this.prisma.user.findFirst({
                    where: { role: targetRole, is_active: true },
                    orderBy: { created_at: 'asc' } // Simple deterministic: oldest user (or round robin in future)
                });
                if (assignee) {
                    assignedTo = assignee.id;
                }
            }
        }

        const ticket = await this.prisma.ticket.create({
            data: {
                ...createTicketDto,
                priority: priority || Priority.LOW, // Ensure priority is set
                assigned_to: assignedTo,
                status: assignedTo ? TicketStatus.ASSIGNED : TicketStatus.NEW,
                created_by: user.id,
            },
        });

        await this.eventsService.createTicketEvent(ticket.id, user.id, EventType.TICKET_CREATED, {
            order_number: ticket.order_number,
            auto_assigned: !!assignedTo && !createTicketDto.assigned_to
        });

        if (ticket.assigned_to) {
            await this.eventsService.createTicketEvent(ticket.id, user.id, EventType.TICKET_ASSIGNED, {
                assigned_to: ticket.assigned_to,
            });

            await this.prisma.notification.create({
                data: {
                    user_id: ticket.assigned_to,
                    type: NotificationType.TICKET_ASSIGNED,
                    title: 'New Ticket Assigned',
                    body: `You have been assigned to ticket ${ticket.order_number} (${assignedTo !== createTicketDto.assigned_to ? 'Auto-assigned' : 'Manual'})`,
                    link: `/tickets/${ticket.id}`,
                }
            });
        }

        return ticket;
    }

    async findAll(user: User, filters: any) {
        const where: any = { deleted_at: null };

        if (user.role === UserRole.CS) {
            where.assigned_to = user.id;
        }

        if (filters.status) where.status = { in: filters.status.split(',') };
        if (filters.priority) where.priority = { in: filters.priority.split(',') };
        if (filters.issue_type) where.issue_type = { in: filters.issue_type.split(',') };
        if (filters.reasonId) where.reason_id = filters.reasonId;
        if (filters.assigneeId) {
            where.assigned_to = filters.assigneeId === 'unassigned' ? null : filters.assigneeId;
        }

        return this.prisma.ticket.findMany({
            where,
            orderBy: { created_at: 'desc' },
            skip: (filters.page - 1) * filters.pageSize || 0,
            take: Number(filters.pageSize) || 10,
        });
    }

    async findOne(id: string, user: User) {
        const ticket = await this.prisma.ticket.findUnique({
            where: { id },
            include: { integration_inbox: true, reason: true },
        });

        if (!ticket) throw new NotFoundException('Ticket not found');

        if (user.role === UserRole.CS && ticket.assigned_to !== user.id) {
            throw new ForbiddenException('Access denied');
        }

        return ticket;
    }

    async update(id: string, updateTicketDto: UpdateTicketDto, user: User) {
        const ticket = await this.findOne(id, user);

        if (user.role === UserRole.CS) {
            throw new ForbiddenException('CS users cannot update ticket details');
        }

        if (user.role === UserRole.ACCOUNTING && ticket.created_by !== user.id) {
            // Contract says: "ACCOUNTING: Can ONLY update tickets they created"
            throw new ForbiddenException('Accounting can only update tickets they created');
        }

        return this.prisma.ticket.update({
            where: { id },
            data: updateTicketDto,
        });
    }

    async assign(id: string, assigneeId: string, user: User) {
        const ticket = await this.findOne(id, user); // Checks view permission first, but assignment limited to Admin/Accounting

        if (user.role === UserRole.CS) {
            throw new ForbiddenException('CS users cannot assign tickets');
        }

        const updatedTicket = await this.prisma.ticket.update({
            where: { id },
            data: { assigned_to: assigneeId, status: TicketStatus.ASSIGNED },
        });

        await this.eventsService.createTicketEvent(id, user.id, EventType.TICKET_ASSIGNED, {
            assigned_to: assigneeId,
        });

        // Notify new assignee
        await this.prisma.notification.create({
            data: {
                user_id: assigneeId,
                type: NotificationType.TICKET_ASSIGNED, // Or REASSIGNED if already assigned? Contract uses ASSIGNED mostly.
                title: 'Ticket Assigned',
                body: `You have been assigned to ticket ${updatedTicket.order_number}`,
                link: `/tickets/${ticket.id}`,
            }
        });

        // Notify creator
        if (ticket.created_by !== user.id) { // Don't notify self
            await this.prisma.notification.create({
                data: {
                    user_id: ticket.created_by,
                    type: NotificationType.STATUS_CHANGED, // or similar
                    title: 'Ticket Assigned',
                    body: `Ticket ${updatedTicket.order_number} was assigned to a user`, // simplified
                    link: `/tickets/${ticket.id}`,
                }
            });
        }

        return updatedTicket;
    }

    async changeStatus(id: string, status: TicketStatus, user: User) {
        const ticket = await this.prisma.ticket.findUnique({ where: { id } });
        if (!ticket) throw new NotFoundException();

        if (user.role === UserRole.CS) {
            if (ticket.assigned_to !== user.id) throw new ForbiddenException();
            const allowed = [TicketStatus.IN_PROGRESS, TicketStatus.WAITING, TicketStatus.RESOLVED];
            // CS can only set to allowed statuses.
            if (!(allowed as TicketStatus[]).includes(status)) {
                throw new ForbiddenException('Invalid status transition for CS');
            }
        }

        const updated = await this.prisma.ticket.update({
            where: { id },
            data: {
                status,
                resolved_at: status === TicketStatus.RESOLVED ? new Date() : ticket.resolved_at,
                closed_at: status === TicketStatus.CLOSED ? new Date() : ticket.closed_at,
            }
        });

        await this.eventsService.createTicketEvent(id, user.id, EventType.STATUS_CHANGED, {
            from: ticket.status,
            to: status
        });

        // Notifications logic (simplified)
        if (ticket.created_by !== user.id) {
            await this.prisma.notification.create({
                data: {
                    user_id: ticket.created_by,
                    type: NotificationType.STATUS_CHANGED,
                    title: 'Ticket Status Update',
                    body: `Ticket ${ticket.order_number} is now ${status}`,
                    link: `/tickets/${id}`
                }
            });
        }

        return updated;
    }
}
