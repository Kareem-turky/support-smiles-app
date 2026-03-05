// User roles
export type UserRole =
  | 'ADMIN'
  | 'CS_MANAGER'
  | 'CS_AGENT'
  | 'ACC_MANAGER'
  | 'ACC_CLERK'
  | 'HR_MANAGER'
  | 'HR_ASSISTANT'
  | 'WH_MANAGER';

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMIN: 'Administrator',
  CS_MANAGER: 'CS Manager',
  CS_AGENT: 'CS Agent',
  ACC_MANAGER: 'Accounting Manager',
  ACC_CLERK: 'Accounting Clerk',
  HR_MANAGER: 'HR Manager',
  HR_ASSISTANT: 'HR Assistant',
  WH_MANAGER: 'Warehouse Manager',
};

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
  department_id?: string;
  created_at: string;
  updated_at: string;
}

// HR/Employee models
export interface Department {
  id: string;
  name: string;
  _count?: { employees: number };
}

export interface Employee {
  id: string;
  code: string;
  full_name: string;
  department_id: string;
  department?: Department;
  start_date: string;
  base_salary: number;
  salary_type: 'MONTHLY' | 'DAILY';
  is_active: boolean;
  role?: string;
  department_name?: string;
}

export interface Adjustment {
  id: string;
  employee_id: string;
  employee?: Employee;
  type: 'BONUS' | 'DEDUCTION' | 'ADVANCE';
  amount: number;
  date: string;
  reason: string;
}

export interface HRAttendance {
  id: string;
  employee_id: string;
  employee?: Employee;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LEAVE';
  minutes_late: number;
  notes?: string;
}

export interface HRLeave {
  id: string;
  employee_id: string;
  employee?: Employee;
  from_date: string;
  to_date: string;
  leave_type: 'ANNUAL' | 'SICK' | 'UNPAID' | 'OTHER';
  notes?: string;
}

// Ticket Reason model
export interface TicketReason {
  id: string;
  name: string;
  category: 'ACCOUNTING' | 'CS' | 'SHIPPING' | 'OTHER';
  sort_order: number;
  is_active: boolean;
  default_assign_role?: UserRole;
  default_priority?: Priority;
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
  reason_id?: string;
  reason?: TicketReason;
  resolved_at: string | null;
  closed_at: string | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
  integration_inbox?: { source: string; external_id: string };
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

export interface ShippingCompany {
  id: string;
  name: string;
}

export interface Order {
  id: string;
  order_number: string;
  customer_name?: string;
  status: string;
  amount?: number;
  notes?: string;
  department_id: string;
  department?: Department;
  assigned_employee_id?: string;
  assigned_employee?: Employee;
  shipping_company_id?: string;
  shipping_company?: ShippingCompany;
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
  reason_id?: string;
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
  previous_status?: TicketStatus;
  new_status?: TicketStatus;
  // Deprecated but keeping for compatibility if utilized elsewhere
  status?: TicketStatus;
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

// Gamification Types
export interface Mission {
  id: string;
  title: string;
  description?: string;
  points: number;
  target_value: number;
  metric_key: string;
  frequency: 'DAILY' | 'WEEKLY';
  role_scope?: string;
  department_id?: string;
  assignments: {
    status: 'ACTIVE' | 'DONE' | 'EXPIRED';
    progress_value: number;
    completed_at?: string;
  }[];
}

export interface Reward {
  id: string;
  name: string;
  description?: string;
  cost_points: number;
}

export interface RewardRedemption {
  id: string;
  reward_id: string;
  user_id: string;
  status: 'REQUESTED' | 'APPROVED' | 'REJECTED';
  created_at: string;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon?: string;
  unlocked_at: string;
}

export interface Streak {
  key: string;
  current_count: number;
  best_count: number;
  last_hit_date?: string;
}

export interface Activity {
  id: string;
  reason: string;
  amount: number;
  created_at: string;
}

export interface GamificationProgress {
  points: number;
  level: number;
  next_level_points: number;
  streak_days?: number;
  badges: Badge[];
  streaks: Streak[];
  history: Activity[];
}

export interface LeaderboardEntry {
  user_id: string;
  user: string;
  name: string;
  rank?: number;
  role: string;
  department?: string;
  points: number;
}
