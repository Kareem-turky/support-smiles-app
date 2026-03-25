import {
  Injectable,
  ForbiddenException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventsService } from '../events/events.service';
import { TicketReasonsService } from '../ticket-reasons/ticket-reasons.service';
import { GamificationService } from '../gamification/gamification.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import {
  User,
  UserRole,
  TicketStatus,
  EventType,
  NotificationType,
  Priority,
} from '@prisma/client';

@Injectable()
export class TicketsService {
  constructor(
    private prisma: PrismaService,
    private eventsService: EventsService,
    private reasonsService: TicketReasonsService,
    private gamificationService: GamificationService,
  ) {}

  async create(createTicketDto: CreateTicketDto, user: User) {
    // CS Agents cannot create tickets (they process them)
    if (user.role === UserRole.CS_AGENT) {
      throw new ForbiddenException('CS Agents cannot create tickets');
    }

    // Validate Reason if provided
    let reason = null;
    if (createTicketDto.reason_id) {
      reason = await this.reasonsService.findOne(createTicketDto.reason_id);
      if (reason && !reason.is_active) {
        throw new ForbiddenException('Selected reason is not active');
      }
    }

    // --- Routing Logic ---
    let assignedTo = createTicketDto.assigned_to;
    let priority = createTicketDto.priority;

    // Auto-set Priority if not provided or default
    if (reason?.default_priority && !priority) {
      priority = reason.default_priority;
    }

    // Auto-assign Logic
    if (!assignedTo) {
      let targetRole: UserRole | null = reason?.default_assign_role;

      // Fallback mapping if no explicit role set on reason
      if (!targetRole && reason) {
        switch (reason.category) {
          case 'ACCOUNTING':
            targetRole = UserRole.ACC_MANAGER; // Assign to Manager initially? Or Clerk? Let's say Manager to triage.
            break;
          case 'CS':
          case 'SHIPPING': // Map Shipping to CS per requirement
            targetRole = UserRole.CS_AGENT; // Assign to Agents
            break;
          default:
            targetRole = null;
        }
      }

      if (targetRole) {
        // Find first available active user in role
        const assignee = await this.prisma.user.findFirst({
          where: { role: targetRole, is_active: true },
          orderBy: { created_at: 'asc' }, // Simple deterministic: oldest user (or round robin in future)
        });
        if (assignee) {
          assignedTo = assignee.id;
        } else if (targetRole === UserRole.CS_AGENT) {
          // Fallback to CS Manager if no agents
          const manager = await this.prisma.user.findFirst({
            where: { role: UserRole.CS_MANAGER, is_active: true },
            orderBy: { created_at: 'asc' },
          });
          if (manager) assignedTo = manager.id;
        }
      }
    }

    const ticket = await this.prisma.ticket.create({
      data: {
        ...createTicketDto,
        priority: priority || Priority.LOW, // Ensure priority is set
        assigned_to: assignedTo || null,
        status: assignedTo ? TicketStatus.ASSIGNED : TicketStatus.NEW,
        created_by: user.id,
      },
    });

    await this.eventsService.createTicketEvent(
      ticket.id,
      user.id,
      EventType.TICKET_CREATED,
      {
        order_number: ticket.order_number,
        auto_assigned: !!assignedTo && !createTicketDto.assigned_to,
      },
    );

    if (ticket.assigned_to) {
      await this.eventsService.createTicketEvent(
        ticket.id,
        user.id,
        EventType.TICKET_ASSIGNED,
        {
          assigned_to: ticket.assigned_to,
        },
      );

      await this.prisma.notification.create({
        data: {
          user_id: ticket.assigned_to,
          type: NotificationType.TICKET_ASSIGNED,
          title: 'New Ticket Assigned',
          body: `You have been assigned to ticket ${ticket.order_number} (${assignedTo !== createTicketDto.assigned_to ? 'Auto-assigned' : 'Manual'})`,
          link: `/tickets/${ticket.id}`,
        },
      });
    }

    return ticket;
  }

  async findAll(user: User, filters: any) {
    const where: any = { deleted_at: null };

    // Scope visibility based on role
    if (user.role === UserRole.ADMIN || user.role === UserRole.CS_MANAGER) {
      // Can see all tickets
    } else {
      // CS Agents, Accounting, HR, WH only see tickets they created or are assigned to
      where.OR = [{ assigned_to: user.id }, { created_by: user.id }];
    }

    if (filters.status) where.status = { in: filters.status.split(',') };
    if (filters.priority) where.priority = { in: filters.priority.split(',') };
    if (filters.issue_type)
      where.issue_type = { in: filters.issue_type.split(',') };
    if (filters.reasonId) where.reason_id = filters.reasonId;
    if (filters.assigneeId) {
      where.assigned_to =
        filters.assigneeId === 'unassigned' ? null : filters.assigneeId;
    }

    return this.prisma.ticket.findMany({
      where,
      include: { creator: true, assignee: true, reason: true },
      orderBy: { created_at: 'desc' },
      skip: (filters.page - 1) * filters.pageSize || 0,
      take: Number(filters.pageSize) || 10,
    });
  }

  async findOne(id: string, user: User) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id },
      include: {
        integration_inbox: true,
        reason: true,
        creator: true,
        assignee: true,
      },
    });

    if (!ticket) throw new NotFoundException('Ticket not found');

    // Scope visibility based on role
    if (user.role !== UserRole.ADMIN && user.role !== UserRole.CS_MANAGER) {
      // Everyone else only sees tickets they created or are assigned to
      if (ticket.assigned_to !== user.id && ticket.created_by !== user.id) {
        throw new ForbiddenException('Access denied');
      }
    }

    return ticket;
  }

  async getEvents(id: string) {
    return this.eventsService.findAllByTicket(id);
  }

  async update(id: string, updateTicketDto: UpdateTicketDto, user: User) {
    const ticket = await this.findOne(id, user);

    // CS Agents cannot update details (only status/comments)
    if (user.role === UserRole.CS_AGENT) {
      throw new ForbiddenException('CS Agents cannot update ticket details');
    }

    // Accounting Clerk can only update own; Manager can update all?
    // Let's stick to strict accounting logic for now: Accounting (any) only own.
    const isAccounting = (
      [UserRole.ACC_MANAGER, UserRole.ACC_AGENT] as UserRole[]
    ).includes(user.role);
    if (isAccounting && ticket.created_by !== user.id) {
      // Contract says: "ACCOUNTING: Can ONLY update tickets they created"
      throw new ForbiddenException(
        'Accounting can only update tickets they created',
      );
    }

    return this.prisma.ticket.update({
      where: { id },
      data: updateTicketDto,
    });
  }

  async assign(id: string, assigneeId: string, user: User) {
    const ticket = await this.findOne(id, user); // Checks view permission first

    // CS Agents cannot assign
    if (user.role === UserRole.CS_AGENT) {
      throw new ForbiddenException('CS Agents cannot assign tickets');
    }

    const updatedTicket = await this.prisma.ticket.update({
      where: { id },
      data: { assigned_to: assigneeId, status: TicketStatus.ASSIGNED },
    });

    await this.eventsService.createTicketEvent(
      id,
      user.id,
      EventType.TICKET_ASSIGNED,
      {
        assigned_to: assigneeId,
      },
    );

    // Notify new assignee
    await this.prisma.notification.create({
      data: {
        user_id: assigneeId,
        type: NotificationType.TICKET_ASSIGNED,
        title: 'Ticket Assigned',
        body: `You have been assigned to ticket ${updatedTicket.order_number}`,
        link: `/tickets/${ticket.id}`,
      },
    });

    // Notify creator
    if (ticket.created_by !== user.id) {
      // Don't notify self
      await this.prisma.notification.create({
        data: {
          user_id: ticket.created_by,
          type: NotificationType.STATUS_CHANGED, // or similar
          title: 'Ticket Assigned',
          body: `Ticket ${updatedTicket.order_number} was assigned to a user`, // simplified
          link: `/tickets/${ticket.id}`,
        },
      });
    }

    return updatedTicket;
  }

  async changeStatus(id: string, status: TicketStatus, user: User) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException();

    if (user.role === UserRole.CS_AGENT) {
      if (ticket.assigned_to !== user.id) throw new ForbiddenException();
      const allowed = [
        TicketStatus.IN_PROGRESS,
        TicketStatus.WAITING,
        TicketStatus.RESOLVED,
      ];
      // CS can only set to allowed statuses.
      if (!(allowed as TicketStatus[]).includes(status)) {
        throw new ForbiddenException('Invalid status transition for CS Agent');
      }
    }

    const updated = await this.prisma.ticket.update({
      where: { id },
      data: {
        status,
        resolved_at:
          status === TicketStatus.RESOLVED ? new Date() : ticket.resolved_at,
        closed_at:
          status === TicketStatus.CLOSED ? new Date() : ticket.closed_at,
      },
    });

    await this.eventsService.createTicketEvent(
      id,
      user.id,
      EventType.STATUS_CHANGED,
      {
        from: ticket.status,
        to: status,
      },
    );

    // Notifications logic (simplified)
    if (ticket.created_by !== user.id) {
      await this.prisma.notification.create({
        data: {
          user_id: ticket.created_by,
          type: NotificationType.STATUS_CHANGED,
          title: 'Ticket Status Update',
          body: `Ticket ${ticket.order_number} is now ${status}`,
          link: `/tickets/${id}`,
        },
      });
    }

    if (
      status === TicketStatus.RESOLVED &&
      ticket.status !== TicketStatus.RESOLVED
    ) {
      await this.gamificationService.awardPoints(
        user.id,
        50,
        `Resolved Ticket: ${ticket.order_number}`,
      );
      await this.gamificationService.updateMissionProgress(
        user.id,
        'RESOLVED_TICKETS',
        1,
      );
    }

    return updated;
  }

  async reopen(id: string, user: User) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id } });
    if (!ticket) throw new NotFoundException('Ticket not found');

    // Only allow reopening RESOLVED or CLOSED tickets
    if (
      ticket.status !== TicketStatus.RESOLVED &&
      ticket.status !== TicketStatus.CLOSED
    ) {
      throw new BadRequestException(
        'Only resolved or closed tickets can be reopened',
      );
    }

    const updated = await this.prisma.ticket.update({
      where: { id },
      data: {
        status: TicketStatus.REOPENED,
        resolved_at: null,
        closed_at: null,
      },
    });

    await this.eventsService.createTicketEvent(
      id,
      user.id,
      EventType.TICKET_REOPENED,
      {
        previous_status: ticket.status,
      },
    );

    // Notify assignee if exists
    if (ticket.assigned_to) {
      await this.prisma.notification.create({
        data: {
          user_id: ticket.assigned_to,
          type: NotificationType.STATUS_CHANGED,
          title: 'Ticket Reopened',
          body: `Ticket ${ticket.order_number} has been reopened`,
          link: `/tickets/${id}`,
        },
      });
    }

    return updated;
  }
}
