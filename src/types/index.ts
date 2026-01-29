// User roles
export type UserRole = 'ADMIN' | 'ACCOUNTING' | 'CS';

// Ticket enums
export type IssueType = 'ACCOUNTING' | 'DELIVERY' | 'COD' | 'RETURNS' | 'ADDRESS' | 'DUPLICATE' | 'OTHER';
export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
export type TicketStatus = 'NEW' | 'ASSIGNED' | 'IN_PROGRESS' | 'WAITING' | 'RESOLVED' | 'CLOSED' | 'REOPENED';
export type NotificationType = 'TICKET_ASSIGNED' | 'MESSAGE_RECEIVED' | 'STATUS_CHANGED' | 'TICKET_REASSIGNED';
export type EventType = 'TICKET_CREATED' | 'TICKET_ASSIGNED' | 'STATUS_CHANGED' | 'MESSAGE_SENT' | 'TICKET_RESOLVED' | 'TICKET_REOPENED' | 'TICKET_UPDATED';

// User model
export interface User {
  id: string;
  name: string;
  email: string;
  password_hash: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Ticket model
export interface Ticket {
  id: string;
  order_number: string;
  courier_company: string;
  issue_type: IssueType;
  priority: Priority;
  status: TicketStatus;
  description: string;
  created_by: string;
  assigned_to: string | null;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// Ticket message model
export interface TicketMessage {
  id: string;
  ticket_id: string;
  sender_id: string;
  message: string;
  created_at: string;
}

// Notification model
export interface Notification {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  body: string;
  is_read: boolean;
  link: string;
  created_at: string;
}

// Ticket event model (audit log)
export interface TicketEvent {
  id: string;
  ticket_id: string;
  actor_id: string;
  event_type: EventType;
  meta: Record<string, unknown>;
  created_at: string;
}

// Auth types
export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthState {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// API response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

// Filter types
export interface TicketFilters {
  status?: TicketStatus[];
  priority?: Priority[];
  issue_type?: IssueType[];
  assigned_to?: string;
  created_by?: string;
  search?: string;
  date_from?: string;
  date_to?: string;
}

// Create/Update DTOs
export interface CreateTicketDto {
  order_number: string;
  courier_company: string;
  issue_type: IssueType;
  priority: Priority;
  description: string;
  assigned_to?: string;
}

export interface UpdateTicketDto {
  order_number?: string;
  courier_company?: string;
  issue_type?: IssueType;
  priority?: Priority;
  description?: string;
}

export interface CreateMessageDto {
  message: string;
}

// Display helpers
export const ISSUE_TYPE_LABELS: Record<IssueType, string> = {
  ACCOUNTING: 'Accounting',
  DELIVERY: 'Delivery',
  COD: 'Cash on Delivery',
  RETURNS: 'Returns',
  ADDRESS: 'Address Issue',
  DUPLICATE: 'Duplicate Order',
  OTHER: 'Other',
};

export const PRIORITY_LABELS: Record<Priority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
  URGENT: 'Urgent',
};

export const STATUS_LABELS: Record<TicketStatus, string> = {
  NEW: 'New',
  ASSIGNED: 'Assigned',
  IN_PROGRESS: 'In Progress',
  WAITING: 'Waiting',
  RESOLVED: 'Resolved',
  CLOSED: 'Closed',
  REOPENED: 'Reopened',
};

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrator',
  ACCOUNTING: 'Accounting',
  CS: 'Customer Service',
};

export const PRIORITY_COLORS: Record<Priority, string> = {
  LOW: 'bg-muted text-muted-foreground',
  MEDIUM: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  HIGH: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  URGENT: 'bg-destructive text-destructive-foreground',
};

export const STATUS_COLORS: Record<TicketStatus, string> = {
  NEW: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  ASSIGNED: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  IN_PROGRESS: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  WAITING: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  RESOLVED: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
  CLOSED: 'bg-muted text-muted-foreground',
  REOPENED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
};
