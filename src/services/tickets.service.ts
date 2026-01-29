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
import { STORAGE_KEYS, getStorageItem, setStorageItem } from './storage';
import { authService } from './auth.service';

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

function createEvent(ticketId: string, actorId: string, eventType: TicketEvent['event_type'], meta: Record<string, unknown> = {}): TicketEvent {
  return {
    id: `event-${generateId()}`,
    ticket_id: ticketId,
    actor_id: actorId,
    event_type: eventType,
    meta,
    created_at: new Date().toISOString(),
  };
}

function createNotification(
  userId: string, 
  type: Notification['type'], 
  title: string, 
  body: string, 
  ticketId: string
): Notification {
  return {
    id: `notif-${generateId()}`,
    user_id: userId,
    type,
    title,
    body,
    is_read: false,
    link: `/tickets/${ticketId}`,
    created_at: new Date().toISOString(),
  };
}

function saveEvent(event: TicketEvent): void {
  const events = getStorageItem<TicketEvent[]>(STORAGE_KEYS.EVENTS) || [];
  events.push(event);
  setStorageItem(STORAGE_KEYS.EVENTS, events);
}

function saveNotification(notification: Notification): void {
  const notifications = getStorageItem<Notification[]>(STORAGE_KEYS.NOTIFICATIONS) || [];
  notifications.push(notification);
  setStorageItem(STORAGE_KEYS.NOTIFICATIONS, notifications);
}

function getUserName(userId: string): string {
  const users = getStorageItem<User[]>(STORAGE_KEYS.USERS) || [];
  const user = users.find(u => u.id === userId);
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
  const users = getStorageItem<User[]>(STORAGE_KEYS.USERS) || [];
  users.filter(u => u.role === 'ADMIN').forEach(u => usersToNotify.add(u.id));
  
  // Remove the actor who triggered this
  if (excludeUserId) usersToNotify.delete(excludeUserId);
  
  usersToNotify.forEach(userId => {
    saveNotification(createNotification(userId, type, title, body, ticketId));
  });
}

export const ticketsService = {
  getAll: async (
    filters: TicketFilters = {},
    page = 1,
    pageSize = 10
  ): Promise<ApiResponse<PaginatedResponse<Ticket>>> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Unauthorized' };
    }

    let tickets = getStorageItem<Ticket[]>(STORAGE_KEYS.TICKETS) || [];
    
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
    
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Unauthorized' };
    }

    const tickets = getStorageItem<Ticket[]>(STORAGE_KEYS.TICKETS) || [];
    const ticket = tickets.find(t => t.id === id && !t.deleted_at);

    if (!ticket) {
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
    
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Unauthorized' };
    }

    // Only Accounting and Admin can create tickets
    if (currentUser.role === 'CS') {
      return { success: false, error: 'Access denied: CS cannot create tickets' };
    }

    const tickets = getStorageItem<Ticket[]>(STORAGE_KEYS.TICKETS) || [];

    const newTicket: Ticket = {
      id: `ticket-${generateId()}`,
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
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      deleted_at: null,
    };

    tickets.push(newTicket);
    setStorageItem(STORAGE_KEYS.TICKETS, tickets);

    // Create audit event
    saveEvent(createEvent(newTicket.id, currentUser.id, 'TICKET_CREATED', { order_number: dto.order_number }));

    // If assigned, create assignment event and notify
    if (dto.assigned_to) {
      saveEvent(createEvent(newTicket.id, currentUser.id, 'TICKET_ASSIGNED', { 
        assigned_to: dto.assigned_to,
        assigned_to_name: getUserName(dto.assigned_to)
      }));
      saveNotification(createNotification(
        dto.assigned_to,
        'TICKET_ASSIGNED',
        'New Ticket Assigned',
        `You have been assigned to ticket ${dto.order_number}`,
        newTicket.id
      ));
    }

    return { success: true, data: newTicket };
  },

  update: async (id: string, dto: UpdateTicketDto): Promise<ApiResponse<Ticket>> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Unauthorized' };
    }

    const tickets = getStorageItem<Ticket[]>(STORAGE_KEYS.TICKETS) || [];
    const ticketIndex = tickets.findIndex(t => t.id === id && !t.deleted_at);

    if (ticketIndex === -1) {
      return { success: false, error: 'Ticket not found' };
    }

    const ticket = tickets[ticketIndex];

    // CS cannot edit ticket core fields
    if (currentUser.role === 'CS') {
      return { success: false, error: 'Access denied: CS cannot edit ticket fields' };
    }

    // Only creator or admin can edit
    if (currentUser.role === 'ACCOUNTING' && ticket.created_by !== currentUser.id) {
      return { success: false, error: 'Access denied: Only ticket creator can edit' };
    }

    tickets[ticketIndex] = {
      ...ticket,
      ...dto,
      updated_at: new Date().toISOString(),
    };

    setStorageItem(STORAGE_KEYS.TICKETS, tickets);
    saveEvent(createEvent(id, currentUser.id, 'TICKET_UPDATED', dto as unknown as Record<string, unknown>));

    return { success: true, data: tickets[ticketIndex] };
  },

  assign: async (id: string, assigneeId: string): Promise<ApiResponse<Ticket>> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Unauthorized' };
    }

    // Only Admin and Accounting can assign
    if (currentUser.role === 'CS') {
      return { success: false, error: 'Access denied' };
    }

    const tickets = getStorageItem<Ticket[]>(STORAGE_KEYS.TICKETS) || [];
    const ticketIndex = tickets.findIndex(t => t.id === id && !t.deleted_at);

    if (ticketIndex === -1) {
      return { success: false, error: 'Ticket not found' };
    }

    const oldAssignee = tickets[ticketIndex].assigned_to;
    const isReassign = oldAssignee !== null && oldAssignee !== assigneeId;

    tickets[ticketIndex] = {
      ...tickets[ticketIndex],
      assigned_to: assigneeId,
      status: tickets[ticketIndex].status === 'NEW' ? 'ASSIGNED' : tickets[ticketIndex].status,
      updated_at: new Date().toISOString(),
    };

    setStorageItem(STORAGE_KEYS.TICKETS, tickets);

    // Create event
    saveEvent(createEvent(id, currentUser.id, 'TICKET_ASSIGNED', {
      assigned_to: assigneeId,
      assigned_to_name: getUserName(assigneeId),
      previous_assignee: oldAssignee,
    }));

    // Notify new assignee
    saveNotification(createNotification(
      assigneeId,
      isReassign ? 'TICKET_REASSIGNED' : 'TICKET_ASSIGNED',
      isReassign ? 'Ticket Reassigned' : 'New Ticket Assigned',
      `You have been assigned to ticket ${tickets[ticketIndex].order_number}`,
      id
    ));

    return { success: true, data: tickets[ticketIndex] };
  },

  changeStatus: async (id: string, status: TicketStatus): Promise<ApiResponse<Ticket>> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Unauthorized' };
    }

    const tickets = getStorageItem<Ticket[]>(STORAGE_KEYS.TICKETS) || [];
    const ticketIndex = tickets.findIndex(t => t.id === id && !t.deleted_at);

    if (ticketIndex === -1) {
      return { success: false, error: 'Ticket not found' };
    }

    const ticket = tickets[ticketIndex];
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

    tickets[ticketIndex] = {
      ...ticket,
      status,
      resolved_at: status === 'RESOLVED' ? new Date().toISOString() : ticket.resolved_at,
      closed_at: status === 'CLOSED' ? new Date().toISOString() : ticket.closed_at,
      updated_at: new Date().toISOString(),
    };

    setStorageItem(STORAGE_KEYS.TICKETS, tickets);

    // Create event
    const eventType = status === 'RESOLVED' ? 'TICKET_RESOLVED' : 
                     status === 'REOPENED' ? 'TICKET_REOPENED' : 'STATUS_CHANGED';
    saveEvent(createEvent(id, currentUser.id, eventType, { from: oldStatus, to: status }));

    // Notify relevant users
    notifyRelevantUsers(
      id,
      tickets[ticketIndex],
      'STATUS_CHANGED',
      'Ticket Status Updated',
      `Ticket ${ticket.order_number} status changed from ${oldStatus} to ${status}`,
      currentUser.id
    );

    return { success: true, data: tickets[ticketIndex] };
  },

  resolve: async (id: string): Promise<ApiResponse<Ticket>> => {
    return ticketsService.changeStatus(id, 'RESOLVED');
  },

  reopen: async (id: string): Promise<ApiResponse<Ticket>> => {
    return ticketsService.changeStatus(id, 'REOPENED');
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const currentUser = authService.getCurrentUser();
    if (!currentUser || currentUser.role !== 'ADMIN') {
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    const tickets = getStorageItem<Ticket[]>(STORAGE_KEYS.TICKETS) || [];
    const ticketIndex = tickets.findIndex(t => t.id === id);

    if (ticketIndex === -1) {
      return { success: false, error: 'Ticket not found' };
    }

    // Soft delete
    tickets[ticketIndex] = {
      ...tickets[ticketIndex],
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    setStorageItem(STORAGE_KEYS.TICKETS, tickets);

    return { success: true };
  },

  // Messages
  getMessages: async (ticketId: string): Promise<ApiResponse<TicketMessage[]>> => {
    await new Promise(resolve => setTimeout(resolve, 100));
    
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify ticket access
    const ticketResult = await ticketsService.getById(ticketId);
    if (!ticketResult.success) {
      return { success: false, error: ticketResult.error };
    }

    const messages = getStorageItem<TicketMessage[]>(STORAGE_KEYS.MESSAGES) || [];
    const ticketMessages = messages
      .filter(m => m.ticket_id === ticketId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());

    return { success: true, data: ticketMessages };
  },

  addMessage: async (ticketId: string, message: string): Promise<ApiResponse<TicketMessage>> => {
    await new Promise(resolve => setTimeout(resolve, 200));
    
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify ticket access
    const ticketResult = await ticketsService.getById(ticketId);
    if (!ticketResult.success) {
      return { success: false, error: ticketResult.error };
    }

    const messages = getStorageItem<TicketMessage[]>(STORAGE_KEYS.MESSAGES) || [];

    const newMessage: TicketMessage = {
      id: `msg-${generateId()}`,
      ticket_id: ticketId,
      sender_id: currentUser.id,
      message,
      created_at: new Date().toISOString(),
    };

    messages.push(newMessage);
    setStorageItem(STORAGE_KEYS.MESSAGES, messages);

    // Update ticket updated_at
    const tickets = getStorageItem<Ticket[]>(STORAGE_KEYS.TICKETS) || [];
    const ticketIndex = tickets.findIndex(t => t.id === ticketId);
    if (ticketIndex !== -1) {
      tickets[ticketIndex].updated_at = new Date().toISOString();
      setStorageItem(STORAGE_KEYS.TICKETS, tickets);
    }

    // Create event
    saveEvent(createEvent(ticketId, currentUser.id, 'MESSAGE_SENT', {}));

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
    
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Unauthorized' };
    }

    // Verify ticket access
    const ticketResult = await ticketsService.getById(ticketId);
    if (!ticketResult.success) {
      return { success: false, error: ticketResult.error };
    }

    const events = getStorageItem<TicketEvent[]>(STORAGE_KEYS.EVENTS) || [];
    const ticketEvents = events
      .filter(e => e.ticket_id === ticketId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return { success: true, data: ticketEvents };
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
    
    const currentUser = authService.getCurrentUser();
    if (!currentUser) {
      return { success: false, error: 'Unauthorized' };
    }

    let tickets = getStorageItem<Ticket[]>(STORAGE_KEYS.TICKETS) || [];
    tickets = tickets.filter(t => !t.deleted_at);

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
