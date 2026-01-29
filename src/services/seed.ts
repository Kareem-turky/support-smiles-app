import { User, Ticket, TicketMessage, Notification, TicketEvent } from '@/types';
import { STORAGE_KEYS, setStorageItem, getStorageItem } from './storage';

// Simple hash function for demo (not secure - just for mock)
function simpleHash(password: string): string {
  return btoa(password);
}

// Demo users
const SEED_USERS: User[] = [
  {
    id: 'user-admin-001',
    name: 'Admin User',
    email: 'admin@company.com',
    password_hash: simpleHash('admin123'),
    role: 'ADMIN',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'user-accounting-001',
    name: 'Sarah Johnson',
    email: 'sarah@company.com',
    password_hash: simpleHash('accounting123'),
    role: 'ACCOUNTING',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'user-cs-001',
    name: 'Mike Chen',
    email: 'mike@company.com',
    password_hash: simpleHash('cs123'),
    role: 'CS',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
  {
    id: 'user-cs-002',
    name: 'Emily Davis',
    email: 'emily@company.com',
    password_hash: simpleHash('cs123'),
    role: 'CS',
    is_active: true,
    created_at: '2025-01-01T00:00:00Z',
    updated_at: '2025-01-01T00:00:00Z',
  },
];

// Demo tickets
const SEED_TICKETS: Ticket[] = [
  {
    id: 'ticket-001',
    order_number: 'ORD-2025-0001',
    courier_company: 'FedEx',
    issue_type: 'DELIVERY',
    priority: 'HIGH',
    status: 'IN_PROGRESS',
    description: 'Package was delivered to wrong address. Customer claims they never received the order. Need to verify delivery confirmation and initiate reshipment.',
    created_by: 'user-accounting-001',
    assigned_to: 'user-cs-001',
    resolved_at: null,
    closed_at: null,
    created_at: '2025-01-28T10:00:00Z',
    updated_at: '2025-01-28T14:30:00Z',
    deleted_at: null,
  },
  {
    id: 'ticket-002',
    order_number: 'ORD-2025-0002',
    courier_company: 'UPS',
    issue_type: 'COD',
    priority: 'URGENT',
    status: 'ASSIGNED',
    description: 'COD amount collected was $50 less than invoice. Customer paid $200 instead of $250. Need to follow up for remaining payment.',
    created_by: 'user-accounting-001',
    assigned_to: 'user-cs-002',
    resolved_at: null,
    closed_at: null,
    created_at: '2025-01-28T11:30:00Z',
    updated_at: '2025-01-28T11:30:00Z',
    deleted_at: null,
  },
  {
    id: 'ticket-003',
    order_number: 'ORD-2025-0003',
    courier_company: 'DHL',
    issue_type: 'RETURNS',
    priority: 'MEDIUM',
    status: 'NEW',
    description: 'Customer initiated return but tracking shows package stuck in transit for 5 days. Need to investigate with courier.',
    created_by: 'user-accounting-001',
    assigned_to: null,
    resolved_at: null,
    closed_at: null,
    created_at: '2025-01-29T08:00:00Z',
    updated_at: '2025-01-29T08:00:00Z',
    deleted_at: null,
  },
  {
    id: 'ticket-004',
    order_number: 'ORD-2025-0004',
    courier_company: 'USPS',
    issue_type: 'ADDRESS',
    priority: 'LOW',
    status: 'RESOLVED',
    description: 'Shipping address had incorrect zip code. Package was returned to sender. Customer provided corrected address.',
    created_by: 'user-accounting-001',
    assigned_to: 'user-cs-001',
    resolved_at: '2025-01-27T16:00:00Z',
    closed_at: null,
    created_at: '2025-01-25T09:00:00Z',
    updated_at: '2025-01-27T16:00:00Z',
    deleted_at: null,
  },
  {
    id: 'ticket-005',
    order_number: 'ORD-2025-0005',
    courier_company: 'FedEx',
    issue_type: 'DUPLICATE',
    priority: 'HIGH',
    status: 'WAITING',
    description: 'Customer was charged twice for the same order. Need to process refund for duplicate charge.',
    created_by: 'user-accounting-001',
    assigned_to: 'user-cs-002',
    resolved_at: null,
    closed_at: null,
    created_at: '2025-01-28T15:00:00Z',
    updated_at: '2025-01-29T09:00:00Z',
    deleted_at: null,
  },
];

// Demo messages
const SEED_MESSAGES: TicketMessage[] = [
  {
    id: 'msg-001',
    ticket_id: 'ticket-001',
    sender_id: 'user-accounting-001',
    message: 'Please contact FedEx for delivery confirmation ASAP.',
    created_at: '2025-01-28T10:05:00Z',
  },
  {
    id: 'msg-002',
    ticket_id: 'ticket-001',
    sender_id: 'user-cs-001',
    message: 'Called FedEx. They confirmed delivery to 123 Main St but customer says their address is 123 Main Ave. Investigating further.',
    created_at: '2025-01-28T11:30:00Z',
  },
  {
    id: 'msg-003',
    ticket_id: 'ticket-001',
    sender_id: 'user-cs-001',
    message: 'FedEx opened an investigation. Case #FX-2025-4567. Will update once we have more info.',
    created_at: '2025-01-28T14:30:00Z',
  },
  {
    id: 'msg-004',
    ticket_id: 'ticket-005',
    sender_id: 'user-cs-002',
    message: 'Verified duplicate charge in payment system. Initiated refund request.',
    created_at: '2025-01-29T09:00:00Z',
  },
];

// Demo notifications
const SEED_NOTIFICATIONS: Notification[] = [
  {
    id: 'notif-001',
    user_id: 'user-cs-001',
    type: 'TICKET_ASSIGNED',
    title: 'New Ticket Assigned',
    body: 'You have been assigned to ticket ORD-2025-0001',
    is_read: true,
    link: '/tickets/ticket-001',
    created_at: '2025-01-28T10:00:00Z',
  },
  {
    id: 'notif-002',
    user_id: 'user-accounting-001',
    type: 'MESSAGE_RECEIVED',
    title: 'New Message',
    body: 'Mike Chen replied to ticket ORD-2025-0001',
    is_read: false,
    link: '/tickets/ticket-001',
    created_at: '2025-01-28T14:30:00Z',
  },
  {
    id: 'notif-003',
    user_id: 'user-cs-002',
    type: 'TICKET_ASSIGNED',
    title: 'New Ticket Assigned',
    body: 'You have been assigned to ticket ORD-2025-0002',
    is_read: false,
    link: '/tickets/ticket-002',
    created_at: '2025-01-28T11:30:00Z',
  },
];

// Demo events (audit log)
const SEED_EVENTS: TicketEvent[] = [
  {
    id: 'event-001',
    ticket_id: 'ticket-001',
    actor_id: 'user-accounting-001',
    event_type: 'TICKET_CREATED',
    meta: { order_number: 'ORD-2025-0001' },
    created_at: '2025-01-28T10:00:00Z',
  },
  {
    id: 'event-002',
    ticket_id: 'ticket-001',
    actor_id: 'user-accounting-001',
    event_type: 'TICKET_ASSIGNED',
    meta: { assigned_to: 'user-cs-001', assigned_to_name: 'Mike Chen' },
    created_at: '2025-01-28T10:00:00Z',
  },
  {
    id: 'event-003',
    ticket_id: 'ticket-001',
    actor_id: 'user-cs-001',
    event_type: 'STATUS_CHANGED',
    meta: { from: 'ASSIGNED', to: 'IN_PROGRESS' },
    created_at: '2025-01-28T11:00:00Z',
  },
  {
    id: 'event-004',
    ticket_id: 'ticket-001',
    actor_id: 'user-cs-001',
    event_type: 'MESSAGE_SENT',
    meta: {},
    created_at: '2025-01-28T11:30:00Z',
  },
  {
    id: 'event-005',
    ticket_id: 'ticket-001',
    actor_id: 'user-cs-001',
    event_type: 'MESSAGE_SENT',
    meta: {},
    created_at: '2025-01-28T14:30:00Z',
  },
];

export function seedDatabase(force = false): void {
  // Check if already seeded
  const existingUsers = getStorageItem<User[]>(STORAGE_KEYS.USERS);
  
  if (existingUsers && existingUsers.length > 0 && !force) {
    console.log('Database already seeded. Use force=true to reseed.');
    return;
  }

  // Seed all data
  setStorageItem(STORAGE_KEYS.USERS, SEED_USERS);
  setStorageItem(STORAGE_KEYS.TICKETS, SEED_TICKETS);
  setStorageItem(STORAGE_KEYS.MESSAGES, SEED_MESSAGES);
  setStorageItem(STORAGE_KEYS.NOTIFICATIONS, SEED_NOTIFICATIONS);
  setStorageItem(STORAGE_KEYS.EVENTS, SEED_EVENTS);

  console.log('Database seeded successfully!');
  console.log('Demo credentials:');
  console.log('  Admin: admin@company.com / admin123');
  console.log('  Accounting: sarah@company.com / accounting123');
  console.log('  CS: mike@company.com / cs123');
  console.log('  CS: emily@company.com / cs123');
}

export function clearDatabase(): void {
  Object.values(STORAGE_KEYS).forEach(key => {
    localStorage.removeItem(key);
  });
  console.log('Database cleared.');
}

export { SEED_USERS };
