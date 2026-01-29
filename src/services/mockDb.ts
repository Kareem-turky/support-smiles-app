/**
 * In-Memory Mock Database
 * 
 * This module provides an in-memory store that simulates a real database.
 * All data is stored in memory with stable UUIDs and relations.
 * LocalStorage is ONLY used for session persistence (optional).
 * 
 * When migrating to NestJS, replace calls to mockDb with actual API fetch calls.
 */

import { User, Ticket, TicketMessage, Notification, TicketEvent } from '@/types';

// Simple UUID v4 generator
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// Simple hash function for demo (not secure - just for mock)
function simpleHash(password: string): string {
  return btoa(password);
}

// ============= Initial Seed Data with Stable UUIDs =============

const INITIAL_USERS: User[] = [
  {
    id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    name: 'Admin User',
    email: 'admin@company.com',
    password_hash: simpleHash('admin123'),
    role: 'ADMIN',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
    name: 'Sarah Johnson',
    email: 'sarah@company.com',
    password_hash: simpleHash('accounting123'),
    role: 'ACCOUNTING',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
    name: 'Mike Chen',
    email: 'mike@company.com',
    password_hash: simpleHash('cs123'),
    role: 'CS',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
    name: 'Emily Davis',
    email: 'emily@company.com',
    password_hash: simpleHash('cs123'),
    role: 'CS',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
];

const INITIAL_TICKETS: Ticket[] = [
  {
    id: 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
    order_number: 'ORD-2025-0001',
    courier_company: 'FedEx',
    issue_type: 'DELIVERY',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    description: 'Package was delivered to wrong address. Customer claims they never received the order. Need to verify delivery confirmation and initiate reshipment.',
    created_by: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', // Sarah
    assigned_to: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', // Mike
    resolved_at: null,
    closed_at: null,
    created_at: '2025-01-28T10:00:00Z',
    updated_at: '2025-01-28T14:30:00Z',
    deleted_at: null,
  },
  {
    id: 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66',
    order_number: 'ORD-2025-0002',
    courier_company: 'UPS',
    issue_type: 'COD',
    priority: 'URGENT',
    status: 'ASSIGNED',
    description: 'COD amount collected was $50 less than invoice. Customer paid $200 instead of $250. Need to follow up for remaining payment.',
    created_by: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', // Sarah
    assigned_to: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', // Emily
    resolved_at: null,
    closed_at: null,
    created_at: '2025-01-28T11:30:00Z',
    updated_at: '2025-01-28T11:30:00Z',
    deleted_at: null,
  },
  {
    id: 'a6eebc99-9c0b-4ef8-bb6d-6bb9bd380a77',
    order_number: 'ORD-2025-0003',
    courier_company: 'DHL',
    issue_type: 'RETURNS',
    priority: 'MEDIUM',
    status: 'NEW',
    description: 'Customer initiated return but tracking shows package stuck in transit for 5 days. Need to investigate with courier.',
    created_by: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', // Sarah
    assigned_to: null,
    resolved_at: null,
    closed_at: null,
    created_at: '2025-01-29T08:00:00Z',
    updated_at: '2025-01-29T08:00:00Z',
    deleted_at: null,
  },
  {
    id: 'b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a88',
    order_number: 'ORD-2025-0004',
    courier_company: 'USPS',
    issue_type: 'ADDRESS',
    priority: 'LOW',
    status: 'RESOLVED',
    description: 'Shipping address had incorrect zip code. Package was returned to sender. Customer provided corrected address.',
    created_by: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', // Sarah
    assigned_to: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', // Mike
    resolved_at: '2025-01-27T16:00:00Z',
    closed_at: null,
    created_at: '2025-01-25T09:00:00Z',
    updated_at: '2025-01-27T16:00:00Z',
    deleted_at: null,
  },
  {
    id: 'c8eebc99-9c0b-4ef8-bb6d-6bb9bd380a99',
    order_number: 'ORD-2025-0005',
    courier_company: 'FedEx',
    issue_type: 'DUPLICATE',
    priority: 'HIGH',
    status: 'WAITING',
    description: 'Customer was charged twice for the same order. Need to process refund for duplicate charge.',
    created_by: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', // Sarah
    assigned_to: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', // Emily
    resolved_at: null,
    closed_at: null,
    created_at: '2025-01-28T15:00:00Z',
    updated_at: '2025-01-29T09:00:00Z',
    deleted_at: null,
  },
];

const INITIAL_MESSAGES: TicketMessage[] = [
  {
    id: 'd9eebc99-9c0b-4ef8-bb6d-6bb9bd380aaa',
    ticket_id: 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
    sender_id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', // Sarah
    message: 'Please contact FedEx for delivery confirmation ASAP.',
    created_at: '2025-01-28T10:05:00Z',
  },
  {
    id: 'e0eebc99-9c0b-4ef8-bb6d-6bb9bd380abb',
    ticket_id: 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
    sender_id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', // Mike
    message: 'Called FedEx. They confirmed delivery to 123 Main St but customer says their address is 123 Main Ave. Investigating further.',
    created_at: '2025-01-28T11:30:00Z',
  },
  {
    id: 'f1eebc99-9c0b-4ef8-bb6d-6bb9bd380acc',
    ticket_id: 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
    sender_id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', // Mike
    message: 'FedEx opened an investigation. Case #FX-2025-4567. Will update once we have more info.',
    created_at: '2025-01-28T14:30:00Z',
  },
  {
    id: 'a2eebc99-9c0b-4ef8-bb6d-6bb9bd380add',
    ticket_id: 'c8eebc99-9c0b-4ef8-bb6d-6bb9bd380a99',
    sender_id: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', // Emily
    message: 'Verified duplicate charge in payment system. Initiated refund request.',
    created_at: '2025-01-29T09:00:00Z',
  },
];

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'b3eebc99-9c0b-4ef8-bb6d-6bb9bd380aee',
    user_id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', // Mike
    type: 'TICKET_ASSIGNED',
    title: 'New Ticket Assigned',
    body: 'You have been assigned to ticket ORD-2025-0001',
    is_read: true,
    link: '/tickets/e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
    created_at: '2025-01-28T10:00:00Z',
  },
  {
    id: 'c4eebc99-9c0b-4ef8-bb6d-6bb9bd380aff',
    user_id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', // Sarah
    type: 'MESSAGE_RECEIVED',
    title: 'New Message',
    body: 'Mike Chen replied to ticket ORD-2025-0001',
    is_read: false,
    link: '/tickets/e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
    created_at: '2025-01-28T14:30:00Z',
  },
  {
    id: 'd5eebc99-9c0b-4ef8-bb6d-6bb9bd380b00',
    user_id: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44', // Emily
    type: 'TICKET_ASSIGNED',
    title: 'New Ticket Assigned',
    body: 'You have been assigned to ticket ORD-2025-0002',
    is_read: false,
    link: '/tickets/f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66',
    created_at: '2025-01-28T11:30:00Z',
  },
];

const INITIAL_EVENTS: TicketEvent[] = [
  {
    id: 'e6eebc99-9c0b-4ef8-bb6d-6bb9bd380b11',
    ticket_id: 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
    actor_id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', // Sarah
    event_type: 'TICKET_CREATED',
    meta: { order_number: 'ORD-2025-0001' },
    created_at: '2025-01-28T10:00:00Z',
  },
  {
    id: 'f7eebc99-9c0b-4ef8-bb6d-6bb9bd380b22',
    ticket_id: 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
    actor_id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22', // Sarah
    event_type: 'TICKET_ASSIGNED',
    meta: { assigned_to: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', assigned_to_name: 'Mike Chen' },
    created_at: '2025-01-28T10:00:00Z',
  },
  {
    id: 'a8eebc99-9c0b-4ef8-bb6d-6bb9bd380b33',
    ticket_id: 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
    actor_id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', // Mike
    event_type: 'STATUS_CHANGED',
    meta: { from: 'ASSIGNED', to: 'IN_PROGRESS' },
    created_at: '2025-01-28T11:00:00Z',
  },
  {
    id: 'b9eebc99-9c0b-4ef8-bb6d-6bb9bd380b44',
    ticket_id: 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
    actor_id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', // Mike
    event_type: 'MESSAGE_SENT',
    meta: {},
    created_at: '2025-01-28T11:30:00Z',
  },
  {
    id: 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380b55',
    ticket_id: 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
    actor_id: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33', // Mike
    event_type: 'MESSAGE_SENT',
    meta: {},
    created_at: '2025-01-28T14:30:00Z',
  },
];

// ============= In-Memory Database Store =============

interface DatabaseState {
  users: User[];
  tickets: Ticket[];
  messages: TicketMessage[];
  notifications: Notification[];
  events: TicketEvent[];
  currentUser: User | null;
}

class MockDatabase {
  private state: DatabaseState;
  private initialized: boolean = false;

  constructor() {
    this.state = {
      users: [],
      tickets: [],
      messages: [],
      notifications: [],
      events: [],
      currentUser: null,
    };
  }

  /**
   * Initialize the database with seed data.
   * @param force - If true, reinitializes even if already initialized
   */
  initialize(force = false): void {
    if (this.initialized && !force) {
      return;
    }

    this.state = {
      users: JSON.parse(JSON.stringify(INITIAL_USERS)),
      tickets: JSON.parse(JSON.stringify(INITIAL_TICKETS)),
      messages: JSON.parse(JSON.stringify(INITIAL_MESSAGES)),
      notifications: JSON.parse(JSON.stringify(INITIAL_NOTIFICATIONS)),
      events: JSON.parse(JSON.stringify(INITIAL_EVENTS)),
      currentUser: null,
    };

    // Optionally restore session from localStorage
    this.restoreSession();

    this.initialized = true;
    console.log('MockDatabase initialized with seed data');
    console.log('Demo credentials:');
    console.log('  Admin: admin@company.com / admin123');
    console.log('  Accounting: sarah@company.com / accounting123');
    console.log('  CS: mike@company.com / cs123');
    console.log('  CS: emily@company.com / cs123');
  }

  /**
   * Restore session from localStorage (optional remember-me feature)
   */
  private restoreSession(): void {
    try {
      const sessionData = localStorage.getItem('tms_session');
      if (sessionData) {
        const session = JSON.parse(sessionData);
        const user = this.state.users.find(u => u.id === session.userId);
        if (user && user.is_active) {
          this.state.currentUser = user;
        }
      }
    } catch {
      // Ignore session restore errors
    }
  }

  /**
   * Persist session to localStorage (optional remember-me feature)
   */
  private persistSession(): void {
    try {
      if (this.state.currentUser) {
        localStorage.setItem('tms_session', JSON.stringify({
          userId: this.state.currentUser.id,
          timestamp: Date.now(),
        }));
      } else {
        localStorage.removeItem('tms_session');
      }
    } catch {
      // Ignore session persist errors
    }
  }

  /**
   * Reset the database to initial state
   */
  reset(): void {
    this.initialized = false;
    localStorage.removeItem('tms_session');
    this.initialize(true);
  }

  /**
   * Generate a new UUID
   */
  generateId(): string {
    return generateUUID();
  }

  // ============= Users =============

  getUsers(): User[] {
    return [...this.state.users];
  }

  getUserById(id: string): User | undefined {
    return this.state.users.find(u => u.id === id);
  }

  getUserByEmail(email: string): User | undefined {
    return this.state.users.find(u => u.email === email);
  }

  getUsersByRole(role: User['role']): User[] {
    return this.state.users.filter(u => u.role === role && u.is_active);
  }

  createUser(user: Omit<User, 'id' | 'created_at' | 'updated_at'>): User {
    const newUser: User = {
      ...user,
      id: generateUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.state.users.push(newUser);
    return newUser;
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const index = this.state.users.findIndex(u => u.id === id);
    if (index === -1) return undefined;
    
    this.state.users[index] = {
      ...this.state.users[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return this.state.users[index];
  }

  // ============= Authentication =============

  getCurrentUser(): User | null {
    return this.state.currentUser;
  }

  setCurrentUser(user: User | null): void {
    this.state.currentUser = user;
    this.persistSession();
  }

  validatePassword(user: User, password: string): boolean {
    return user.password_hash === simpleHash(password);
  }

  // ============= Tickets =============

  getTickets(): Ticket[] {
    return [...this.state.tickets];
  }

  getTicketById(id: string): Ticket | undefined {
    return this.state.tickets.find(t => t.id === id);
  }

  createTicket(ticket: Omit<Ticket, 'id' | 'created_at' | 'updated_at'>): Ticket {
    const newTicket: Ticket = {
      ...ticket,
      id: generateUUID(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    this.state.tickets.push(newTicket);
    return newTicket;
  }

  updateTicket(id: string, updates: Partial<Ticket>): Ticket | undefined {
    const index = this.state.tickets.findIndex(t => t.id === id);
    if (index === -1) return undefined;
    
    this.state.tickets[index] = {
      ...this.state.tickets[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };
    return this.state.tickets[index];
  }

  // ============= Messages =============

  getMessages(): TicketMessage[] {
    return [...this.state.messages];
  }

  getMessagesByTicketId(ticketId: string): TicketMessage[] {
    return this.state.messages
      .filter(m => m.ticket_id === ticketId)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  }

  createMessage(message: Omit<TicketMessage, 'id' | 'created_at'>): TicketMessage {
    const newMessage: TicketMessage = {
      ...message,
      id: generateUUID(),
      created_at: new Date().toISOString(),
    };
    this.state.messages.push(newMessage);
    return newMessage;
  }

  // ============= Notifications =============

  getNotifications(): Notification[] {
    return [...this.state.notifications];
  }

  getNotificationsByUserId(userId: string): Notification[] {
    return this.state.notifications
      .filter(n => n.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  getNotificationById(id: string): Notification | undefined {
    return this.state.notifications.find(n => n.id === id);
  }

  createNotification(notification: Omit<Notification, 'id' | 'created_at'>): Notification {
    const newNotification: Notification = {
      ...notification,
      id: generateUUID(),
      created_at: new Date().toISOString(),
    };
    this.state.notifications.push(newNotification);
    return newNotification;
  }

  updateNotification(id: string, updates: Partial<Notification>): Notification | undefined {
    const index = this.state.notifications.findIndex(n => n.id === id);
    if (index === -1) return undefined;
    
    this.state.notifications[index] = {
      ...this.state.notifications[index],
      ...updates,
    };
    return this.state.notifications[index];
  }

  markAllNotificationsAsRead(userId: string): void {
    this.state.notifications = this.state.notifications.map(n =>
      n.user_id === userId ? { ...n, is_read: true } : n
    );
  }

  // ============= Events =============

  getEvents(): TicketEvent[] {
    return [...this.state.events];
  }

  getEventsByTicketId(ticketId: string): TicketEvent[] {
    return this.state.events
      .filter(e => e.ticket_id === ticketId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  createEvent(event: Omit<TicketEvent, 'id' | 'created_at'>): TicketEvent {
    const newEvent: TicketEvent = {
      ...event,
      id: generateUUID(),
      created_at: new Date().toISOString(),
    };
    this.state.events.push(newEvent);
    return newEvent;
  }
}

// Export singleton instance
export const mockDb = new MockDatabase();

// Export constants for backward compatibility
export const USER_IDS = {
  ADMIN: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  ACCOUNTING: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
  CS_MIKE: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33',
  CS_EMILY: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44',
} as const;

export const TICKET_IDS = {
  TICKET_1: 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55',
  TICKET_2: 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a66',
  TICKET_3: 'a6eebc99-9c0b-4ef8-bb6d-6bb9bd380a77',
  TICKET_4: 'b7eebc99-9c0b-4ef8-bb6d-6bb9bd380a88',
  TICKET_5: 'c8eebc99-9c0b-4ef8-bb6d-6bb9bd380a99',
} as const;
