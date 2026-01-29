import { 
  Ticket, 
  TicketMessage, 
  TicketEvent, 
  Notification,
  ApiResponse, 
  PaginatedResponse, 
  TicketFilters, 
  CreateTicketDto, 
  UpdateTicketDto,
  TicketStatus,
  User
} from '@/types';
import { mockDb } from './mockDb';

function createNotification(
  userId: string, 
  type: Notification['type'], 
  title: string, 
  body: string, 
  ticketId: string
): void {
  mockDb.createNotification({
    user_id: userId,
    type,
    title,
    body,
    is_read: false,
    link: `/tickets/${ticketId}`,
  });
}

function createEvent(ticketId: string, actorId: string, eventType: TicketEvent['event_type'], meta: Record<string, unknown> = {}): void {
  mockDb.createEvent({
    ticket_id: ticketId,
    actor_id: actorId,
    event_type: eventType,
    meta,
  });
}

function getUserName(userId: string): string {
  const user = mockDb.getUserById(userId);
  return user?.name || 'Unknown';
}

function notifyRelevantUsers(
  ticketId: string,
  ticket: Ticket,
  type: Notification['type'],
  title: string,
  body: string,
  excludeUserId?: string
): void {
  const usersToNotify = new Set<string>();
  
  // Add creator
  if (ticket.created_by) usersToNotify.add(ticket.created_by);
  // Add assignee
  if (ticket.assigned_to) usersToNotify.add(ticket.assigned_to);
  // Add all admins
  const admins = mockDb.getUsersByRole('ADMIN');
  admins.forEach(u => usersToNotify.add(u.id));
  
  // Remove the actor who triggered this
  if (excludeUserId) usersToNotify.delete(excludeUserId);
  
  usersToNotify.forEach(userId => {
    createNotification(userId, type, title, body, ticketId);
  });
}

export const ticketsService = {
  getAll: async (
    filters: TicketFilters = {},
    page = 1,
    pageSize = 10
  ): Promise<ApiResponse<PaginatedResponse<Ticket>>> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const currentUser = mockDb.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Unauthorized' };
    }

    let tickets = mockDb.getTickets();
    
    // Filter out deleted tickets
    tickets = tickets.filter(t => !t.deleted_at);

    // CS can only see assigned tickets
    if (currentUser.role === 'CS') {
      tickets = tickets.filter(t => t.assigned_to === currentUser.id);
    }

    // Apply filters
    if (filters.status?.length) {
      tickets = tickets.filter(t => filters.status!.includes(t.status));
    }
    if (filters.priority?.length) {
      tickets = tickets.filter(t => filters.priority!.includes(t.priority));
    }
    if (filters.issue_type?.length) {
      tickets = tickets.filter(t => filters.issue_type!.includes(t.issue_type));
    }
    if (filters.assigned_to) {
      tickets = tickets.filter(t => t.assigned_to === filters.assigned_to);
    }
    if (filters.created_by) {
      tickets = tickets.filter(t => t.created_by === filters.created_by);
    }
    if (filters.search) {
      const search = filters.search.toLowerCase();
      tickets = tickets.filter(t => 
        t.order_number.toLowerCase().includes(search) ||
        t.description.toLowerCase().includes(search) ||
        t.courier_company.toLowerCase().includes(search)
      );
    }

    // Sort by updated_at desc
    tickets.sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime());

    // Paginate
    const total = tickets.length;
    const totalPages = Math.ceil(total / pageSize);
    const start = (page - 1) * pageSize;
    const paginatedTickets = tickets.slice(start, start + pageSize);

    return {
      success: true,
      data: {
        data: paginatedTickets,
        total,
        page,
        pageSize,
        totalPages,
      },
    };
  },

  getById: async (id: string): Promise<ApiResponse<Ticket>> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const currentUser = mockDb.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Unauthorized' };
    }

    const ticket = mockDb.getTicketById(id);

    if (!ticket || ticket.deleted_at) {
      return { success: false, error: 'Ticket not found' };
    }

    // CS can only view assigned tickets
    if (currentUser.role === 'CS' && ticket.assigned_to !== currentUser.id) {
      return { success: false, error: 'Access denied' };
    }

    return { success: true, data: ticket };
  },

  create: async (dto: CreateTicketDto): Promise<ApiResponse<Ticket>> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const currentUser = mockDb.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Unauthorized' };
    }

    // Only Accounting and Admin can create tickets
    if (currentUser.role === 'CS') {
      return { success: false, error: 'Access denied: CS cannot create tickets' };
    }

    const newTicket = mockDb.createTicket({
      order_number: dto.order_number,
      courier_company: dto.courier_company,
      issue_type: dto.issue_type,
      priority: dto.priority,
      status: dto.assigned_to ? 'ASSIGNED' : 'NEW',
      description: dto.description,
      created_by: currentUser.id,
      assigned_to: dto.assigned_to || null,
      resolved_at: null,
      closed_at: null,
      deleted_at: null,
    });

    // Create audit event
    createEvent(newTicket.id, currentUser.id, 'TICKET_CREATED', { order_number: dto.order_number });

    // If assigned, create assignment event and notify
    if (dto.assigned_to) {
      createEvent(newTicket.id, currentUser.id, 'TICKET_ASSIGNED', { 
        assigned_to: dto.assigned_to,
        assigned_to_name: getUserName(dto.assigned_to)
      });
      createNotification(
        dto.assigned_to,
        'TICKET_ASSIGNED',
        'New Ticket Assigned',
        `You have been assigned to ticket ${dto.order_number}`,
        newTicket.id
      );
    }

    return { success: true, data: newTicket };
  },

  update: async (id: string, dto: UpdateTicketDto): Promise<ApiResponse<Ticket>> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const currentUser = mockDb.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Unauthorized' };
    }

    const ticket = mockDb.getTicketById(id);

    if (!ticket || ticket.deleted_at) {
      return { success: false, error: 'Ticket not found' };
    }

    // CS cannot edit ticket core fields
    if (currentUser.role === 'CS') {
      return { success: false, error: 'Access denied: CS cannot edit ticket fields' };
    }

    // Only creator or admin can edit
    if (currentUser.role === 'ACCOUNTING' && ticket.created_by !== currentUser.id) {
      return { success: false, error: 'Access denied: Only ticket creator can edit' };
    }

    const updatedTicket = mockDb.updateTicket(id, dto);

    if (!updatedTicket) {
      return { success: false, error: 'Failed to update ticket' };
    }

    createEvent(id, currentUser.id, 'TICKET_UPDATED', dto as unknown as Record<string, unknown>);

    return { success: true, data: updatedTicket };
  },

  assign: async (id: string, assigneeId: string): Promise<ApiResponse<Ticket>> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const currentUser = mockDb.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Unauthorized' };
    }

    // Only Admin and Accounting can assign
    if (currentUser.role === 'CS') {
      return { success: false, error: 'Access denied' };
    }

    const ticket = mockDb.getTicketById(id);

    if (!ticket || ticket.deleted_at) {
      return { success: false, error: 'Ticket not found' };
    }

    const oldAssignee = ticket.assigned_to;
    const isReassign = oldAssignee !== null && oldAssignee !== assigneeId;

    const updatedTicket = mockDb.updateTicket(id, {
      assigned_to: assigneeId,
      status: ticket.status === 'NEW' ? 'ASSIGNED' : ticket.status,
    });

    if (!updatedTicket) {
      return { success: false, error: 'Failed to assign ticket' };
    }

    // Create event
    createEvent(id, currentUser.id, 'TICKET_ASSIGNED', {
      assigned_to: assigneeId,
      assigned_to_name: getUserName(assigneeId),
      previous_assignee: oldAssignee,
    });

    // Notify new assignee
    createNotification(
      assigneeId,
      isReassign ? 'TICKET_REASSIGNED' : 'TICKET_ASSIGNED',
      isReassign ? 'Ticket Reassigned' : 'New Ticket Assigned',
      `You have been assigned to ticket ${updatedTicket.order_number}`,
      id
    );

    return { success: true, data: updatedTicket };
  },

  changeStatus: async (id: string, status: TicketStatus): Promise<ApiResponse<Ticket>> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const currentUser = mockDb.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Unauthorized' };
    }

    const ticket = mockDb.getTicketById(id);

    if (!ticket || ticket.deleted_at) {
      return { success: false, error: 'Ticket not found' };
    }

    const oldStatus = ticket.status;

    // CS can only change to certain statuses
    if (currentUser.role === 'CS') {
      const allowedStatuses: TicketStatus[] = ['IN_PROGRESS', 'WAITING', 'RESOLVED'];
      if (!allowedStatuses.includes(status)) {
        return { success: false, error: `CS can only set status to: ${allowedStatuses.join(', ')}` };
      }
      // CS can only change their assigned tickets
      if (ticket.assigned_to !== currentUser.id) {
        return { success: false, error: 'Access denied' };
      }
    }

    const updates: Partial<Ticket> = {
      status,
    };

    if (status === 'RESOLVED') {
      updates.resolved_at = new Date().toISOString();
    }
    if (status === 'CLOSED') {
      updates.closed_at = new Date().toISOString();
    }

    const updatedTicket = mockDb.updateTicket(id, updates);

    if (!updatedTicket) {
      return { success: false, error: 'Failed to change status' };
    }

    // Create event
    const eventType = status === 'RESOLVED' ? 'TICKET_RESOLVED' : 
                     status === 'REOPENED' ? 'TICKET_REOPENED' : 'STATUS_CHANGED';
    createEvent(id, currentUser.id, eventType, { from: oldStatus, to: status });

    // Notify relevant users
    notifyRelevantUsers(
      id,
      updatedTicket,
      'STATUS_CHANGED',
      'Ticket Status Updated',
      `Ticket ${ticket.order_number} status changed from ${oldStatus} to ${status}`,
      currentUser.id
    );

    return { success: true, data: updatedTicket };
  },

  resolve: async (id: string): Promise<ApiResponse<Ticket>> => {
    return ticketsService.changeStatus(id, 'RESOLVED');
  },

  reopen: async (id: string): Promise<ApiResponse<Ticket>> => {
    return ticketsService.changeStatus(id, 'REOPENED');
  },

  close: async (id: string): Promise<ApiResponse<Ticket>> => {
    return ticketsService.changeStatus(id, 'CLOSED');
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const currentUser = mockDb.getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    const ticket = mockDb.getTicketById(id);

    if (!ticket) {
      return { success: false, error: 'Ticket not found' };
    }

    // Soft delete
    mockDb.updateTicket(id, {
      deleted_at: new Date().toISOString(),
    });

    return { success: true };
  },

  // Messages
  getMessages: async (ticketId: string): Promise<ApiResponse<TicketMessage[]>> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const currentUser = mockDb.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify ticket access
    const ticketResult = await ticketsService.getById(ticketId);
    if (!ticketResult.success) {
      return { success: false, error: ticketResult.error };
    }

    const messages = mockDb.getMessagesByTicketId(ticketId);
    return { success: true, data: messages };
  },

  addMessage: async (ticketId: string, message: string): Promise<ApiResponse<TicketMessage>> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const currentUser = mockDb.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify ticket access
    const ticketResult = await ticketsService.getById(ticketId);
    if (!ticketResult.success) {
      return { success: false, error: ticketResult.error };
    }

    const newMessage = mockDb.createMessage({
      ticket_id: ticketId,
      sender_id: currentUser.id,
      message,
    });

    // Update ticket updated_at
    mockDb.updateTicket(ticketId, {});

    // Create event
    createEvent(ticketId, currentUser.id, 'MESSAGE_SENT', {});

    // Notify relevant users
    notifyRelevantUsers(
      ticketId,
      ticketResult.data!,
      'MESSAGE_RECEIVED',
      'New Message',
      `${currentUser.name} replied to ticket ${ticketResult.data!.order_number}`,
      currentUser.id
    );

    return { success: true, data: newMessage };
  },

  // Events (audit log)
  getEvents: async (ticketId: string): Promise<ApiResponse<TicketEvent[]>> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const currentUser = mockDb.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify ticket access
    const ticketResult = await ticketsService.getById(ticketId);
    if (!ticketResult.success) {
      return { success: false, error: ticketResult.error };
    }

    const events = mockDb.getEventsByTicketId(ticketId);
    return { success: true, data: events };
  },

  // Dashboard stats
  getStats: async (): Promise<ApiResponse<{
    total: number;
    byStatus: Record<string, number>;
    byPriority: Record<string, number>;
    resolvedThisWeek: number;
    avgResolutionTime: number;
  }>> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const currentUser = mockDb.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Unauthorized' };
    }

    let tickets = mockDb.getTickets().filter(t => !t.deleted_at);

    // CS only sees their stats
    if (currentUser.role === 'CS') {
      tickets = tickets.filter(t => t.assigned_to === currentUser.id);
    }

    const byStatus: Record<string, number> = {};
    const byPriority: Record<string, number> = {};
    
    tickets.forEach(t => {
      byStatus[t.status] = (byStatus[t.status] || 0) + 1;
      byPriority[t.priority] = (byPriority[t.priority] || 0) + 1;
    });

    // Resolved this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const resolvedThisWeek = tickets.filter(t => 
      t.resolved_at && new Date(t.resolved_at) >= weekAgo
    ).length;

    // Average resolution time (in hours)
    const resolvedTickets = tickets.filter(t => t.resolved_at);
    const totalResolutionTime = resolvedTickets.reduce((acc, t) => {
      const created = new Date(t.created_at).getTime();
      const resolved = new Date(t.resolved_at!).getTime();
      return acc + (resolved - created);
    }, 0);
    const avgResolutionTime = resolvedTickets.length > 0 
      ? Math.round(totalResolutionTime / resolvedTickets.length / (1000 * 60 * 60))
      : 0;

    return {
      success: true,
      data: {
        total: tickets.length,
        byStatus,
        byPriority,
        resolvedThisWeek,
        avgResolutionTime,
      },
    };
  },
};
