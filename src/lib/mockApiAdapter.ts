/**
 * Mock API Adapter for Local Development
 * 
 * This module intercepts axios calls and routes them to the in-memory mockDb
 * when VITE_USE_MOCK_API=true. This allows the app to run without a backend.
 * 
 * All endpoints used by the app should be implemented here.
 * Unknown routes throw MOCK_API_UNHANDLED_ROUTE for debugging.
 */

import { mockDb } from '@/services/mockDb';
import { STORAGE_KEYS } from '@/services/storage';

// Demo credentials matching mockDb users
const VALID_CREDENTIALS: Record<string, { password: string; userId: string }> = {
    'admin@company.com': { password: 'admin123', userId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11' },
    'sarah@company.com': { password: 'accounting123', userId: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22' },
    'mike@company.com': { password: 'cs123', userId: 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33' },
    'emily@company.com': { password: 'cs123', userId: 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44' },
};

// Generate a fake JWT token for demo purposes
function generateMockToken(userId: string): string {
    const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
    const payload = btoa(JSON.stringify({
        sub: userId,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600, // 1 hour
    }));
    const signature = btoa('mock-signature');
    return `${header}.${payload}.${signature}`;
}

// Get current user from mockDb based on stored token
function getCurrentUserFromMock(): ReturnType<typeof mockDb.getCurrentUser> {
    return mockDb.getCurrentUser();
}

// Mock response wrapper to match axios response structure
function mockResponse<T>(data: T, status = 200) {
    return { data, status, statusText: 'OK', headers: {}, config: {} };
}

// Mock error wrapper to match axios error structure
function mockError(message: string, status = 400) {
    const error = new Error(message) as any;
    error.response = { status, data: { message } };
    error.isAxiosError = true;
    return error;
}

// Unhandled route error
function unhandledRoute(method: string, url: string): never {
    console.error(`[MOCK_API] UNHANDLED: ${method} ${url}`);
    throw new Error(`MOCK_API_UNHANDLED_ROUTE: ${method} ${url}`);
}

/**
 * Mock API Handler
 * Intercepts requests and returns mock responses
 */
export const mockApiAdapter = {
    async request(config: { method?: string; url?: string; data?: any; params?: any }) {
        const method = (config.method || 'GET').toUpperCase();
        const url = config.url || '';
        const data = config.data;
        const params = config.params || {};

        console.log(`[MOCK_API] ${method} ${url}`, data || params || '');

        // ==================== AUTH ====================
        if (url === '/auth/login' && method === 'POST') {
            const { email, password } = data;
            const creds = VALID_CREDENTIALS[email];

            if (!creds || creds.password !== password) {
                throw mockError('Invalid email or password', 401);
            }

            const user = mockDb.getUserById(creds.userId);
            if (!user || !user.is_active) {
                throw mockError('Account is inactive', 401);
            }

            mockDb.setCurrentUser(user);
            const token = generateMockToken(user.id);

            return mockResponse({
                data: {
                    user: { ...user, password_hash: undefined },
                    access_token: token,
                }
            });
        }

        if (url === '/auth/logout' && method === 'POST') {
            mockDb.setCurrentUser(null);
            return mockResponse({ success: true });
        }

        if (url === '/auth/me' && method === 'GET') {
            const user = getCurrentUserFromMock();
            if (!user) {
                throw mockError('Not authenticated', 401);
            }
            return mockResponse({ data: { ...user, password_hash: undefined } });
        }

        // ==================== TICKETS ====================
        if (url === '/tickets' && method === 'GET') {
            const currentUser = getCurrentUserFromMock();
            let tickets = mockDb.getTickets().filter(t => !t.deleted_at);

            // Apply status filter
            if (params.status) {
                const statuses = params.status.split(',');
                tickets = tickets.filter(t => statuses.includes(t.status));
            }

            // CS agents can only see their assigned tickets
            if (currentUser?.role === 'CS') {
                tickets = tickets.filter(t => t.assigned_to === currentUser.id);
            }

            return mockResponse({ data: tickets });
        }

        if (url.match(/^\/tickets\/[^/]+$/) && method === 'GET') {
            const id = url.split('/')[2];
            const ticket = mockDb.getTicketById(id);
            const currentUser = getCurrentUserFromMock();

            if (!ticket || ticket.deleted_at) {
                throw mockError('Ticket not found', 404);
            }

            if (currentUser?.role === 'CS' && ticket.assigned_to !== currentUser.id) {
                throw mockError('Access denied', 403);
            }

            return mockResponse({ data: ticket });
        }

        if (url === '/tickets' && method === 'POST') {
            const currentUser = getCurrentUserFromMock();

            if (!currentUser || currentUser.role === 'CS') {
                throw mockError('Access denied', 403);
            }

            const newTicket = mockDb.createTicket({
                ...data,
                status: data.assigned_to ? 'ASSIGNED' : 'NEW',
                created_by: currentUser.id,
                assigned_to: data.assigned_to || null,
                resolved_at: null,
                closed_at: null,
                deleted_at: null,
            });

            return mockResponse({ data: newTicket }, 201);
        }

        if (url.match(/^\/tickets\/[^/]+\/status$/) && method === 'PATCH') {
            const id = url.split('/')[2];
            const currentUser = getCurrentUserFromMock();
            const ticket = mockDb.getTicketById(id);

            if (!ticket) {
                throw mockError('Ticket not found', 404);
            }

            if (currentUser?.role === 'CS') {
                if (ticket.assigned_to !== currentUser.id) {
                    throw mockError('Access denied', 403);
                }
                if (['CLOSED', 'REOPENED'].includes(data.status)) {
                    throw mockError('CS cannot set this status', 403);
                }
            }

            const updates: any = { status: data.status };
            if (data.status === 'RESOLVED') updates.resolved_at = new Date().toISOString();
            if (data.status === 'CLOSED') updates.closed_at = new Date().toISOString();

            const updated = mockDb.updateTicket(id, updates);
            return mockResponse({ data: updated });
        }

        if (url.match(/^\/tickets\/[^/]+\/assign$/) && method === 'POST') {
            const id = url.split('/')[2];
            const ticket = mockDb.updateTicket(id, {
                assigned_to: data.assigned_to,
                status: 'ASSIGNED'
            });
            return mockResponse({ data: ticket });
        }

        if (url.match(/^\/tickets\/[^/]+\/messages$/) && method === 'GET') {
            const ticketId = url.split('/')[2];
            const messages = mockDb.getMessagesByTicketId(ticketId);
            return mockResponse({ data: messages });
        }

        if (url.match(/^\/tickets\/[^/]+\/messages$/) && method === 'POST') {
            const ticketId = url.split('/')[2];
            const currentUser = getCurrentUserFromMock();

            const newMessage = mockDb.createMessage({
                ticket_id: ticketId,
                sender_id: currentUser?.id || 'unknown',
                message: data.message,
            });

            return mockResponse({ data: newMessage }, 201);
        }

        if (url.match(/^\/tickets\/[^/]+\/events$/) && method === 'GET') {
            const ticketId = url.split('/')[2];
            const events = mockDb.getEventsByTicketId(ticketId);
            return mockResponse({ data: events });
        }

        if (url.match(/^\/tickets\/[^/]+$/) && method === 'PATCH') {
            const id = url.split('/')[2];
            const currentUser = getCurrentUserFromMock();
            const ticket = mockDb.getTicketById(id);

            if (!ticket) {
                throw mockError('Ticket not found', 404);
            }

            if (currentUser?.role === 'CS') {
                throw mockError('CS cannot edit ticket fields', 403);
            }

            const updated = mockDb.updateTicket(id, data);
            return mockResponse({ data: updated });
        }

        if (url.match(/^\/tickets\/[^/]+$/) && method === 'DELETE') {
            const id = url.split('/')[2];
            const currentUser = getCurrentUserFromMock();

            if (currentUser?.role !== 'ADMIN') {
                throw mockError('Admin access required', 403);
            }

            mockDb.updateTicket(id, { deleted_at: new Date().toISOString() });
            return mockResponse({ success: true });
        }

        // ==================== USERS ====================
        if (url === '/users' && method === 'GET') {
            const currentUser = getCurrentUserFromMock();

            if (currentUser?.role !== 'ADMIN') {
                throw mockError('Admin access required', 403);
            }

            const users = mockDb.getUsers().map(u => ({ ...u, password_hash: undefined }));
            return mockResponse({ data: users });
        }

        if (url.match(/^\/users\/[^/]+$/) && method === 'GET') {
            const id = url.split('/')[2];
            const user = mockDb.getUserById(id);

            if (!user) {
                throw mockError('User not found', 404);
            }

            return mockResponse({ data: { ...user, password_hash: undefined } });
        }

        if (url.match(/^\/users\/[^/]+$/) && method === 'PATCH') {
            const id = url.split('/')[2];
            const currentUser = getCurrentUserFromMock();

            if (currentUser?.role !== 'ADMIN') {
                throw mockError('Admin access required', 403);
            }

            const updated = mockDb.updateUser(id, data);
            return mockResponse({ data: { ...updated, password_hash: undefined } });
        }

        // ==================== NOTIFICATIONS ====================
        if (url === '/notifications' && method === 'GET') {
            const currentUser = getCurrentUserFromMock();

            if (!currentUser) {
                throw mockError('Not authenticated', 401);
            }

            const notifications = mockDb.getNotificationsByUserId(currentUser.id);
            return mockResponse(notifications);
        }

        if (url.match(/^\/notifications\/[^/]+\/read$/) && method === 'POST') {
            const id = url.split('/')[2];
            const updated = mockDb.updateNotification(id, { is_read: true });
            return mockResponse({ data: updated });
        }

        if (url === '/notifications/read-all' && method === 'POST') {
            const currentUser = getCurrentUserFromMock();
            if (currentUser) {
                mockDb.markAllNotificationsAsRead(currentUser.id);
            }
            return mockResponse({ success: true });
        }

        // ==================== STATS / DASHBOARD ====================
        if (url === '/stats/dashboard' && method === 'GET') {
            const tickets = mockDb.getTickets().filter(t => !t.deleted_at);
            const stats = {
                total_tickets: tickets.length,
                open_tickets: tickets.filter(t => !['CLOSED', 'RESOLVED'].includes(t.status)).length,
                resolved_tickets: tickets.filter(t => t.status === 'RESOLVED').length,
                closed_tickets: tickets.filter(t => t.status === 'CLOSED').length,
                by_priority: {
                    URGENT: tickets.filter(t => t.priority === 'URGENT').length,
                    HIGH: tickets.filter(t => t.priority === 'HIGH').length,
                    MEDIUM: tickets.filter(t => t.priority === 'MEDIUM').length,
                    LOW: tickets.filter(t => t.priority === 'LOW').length,
                },
                by_status: {
                    NEW: tickets.filter(t => t.status === 'NEW').length,
                    ASSIGNED: tickets.filter(t => t.status === 'ASSIGNED').length,
                    IN_PROGRESS: tickets.filter(t => t.status === 'IN_PROGRESS').length,
                    WAITING: tickets.filter(t => t.status === 'WAITING').length,
                    RESOLVED: tickets.filter(t => t.status === 'RESOLVED').length,
                    CLOSED: tickets.filter(t => t.status === 'CLOSED').length,
                },
            };
            return mockResponse({ data: stats });
        }

        // ==================== REASONS ====================
        // ==================== REASONS ====================
        if ((url === '/reasons' || url.startsWith('/ticket-reasons')) && method === 'GET') {
            const reasons = mockDb.getReasons();

            // Handle activeOnly filter from URL query string or params object
            let activeOnly = true; // Default as per service

            // Check params object
            if (params.activeOnly !== undefined) {
                activeOnly = String(params.activeOnly) === 'true';
            }
            // Check URL query string
            else if (url.includes('?')) {
                const searchParams = new URLSearchParams(url.split('?')[1]);
                if (searchParams.has('activeOnly')) {
                    activeOnly = searchParams.get('activeOnly') === 'true';
                }
            }

            const filtered = activeOnly
                ? reasons.filter(r => r.is_active)
                : reasons;

            return mockResponse(filtered);
        }

        // Unhandled route
        unhandledRoute(method, url);
    }
};
