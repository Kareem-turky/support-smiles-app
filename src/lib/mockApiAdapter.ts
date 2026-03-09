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

// Global Coverage Store
declare global {
    var __MOCK_API_COVERAGE__: string[];
}

function recordHit(method: string, url: string) {
    if (!globalThis.__MOCK_API_COVERAGE__) {
        globalThis.__MOCK_API_COVERAGE__ = [];
    }
    // Normalize URL for reporting (remove IDs)
    const normalizedUrl = url.split('?')[0].replace(/\/[0-9a-f-]{36}/g, '/:id');
    globalThis.__MOCK_API_COVERAGE__.push(`${method} ${normalizedUrl}`);
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

        recordHit(method, url);
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
                user: { ...user, password_hash: undefined },
                access_token: token,
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
            return mockResponse({ ...user, password_hash: undefined });
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
            if (currentUser?.role === 'CS_AGENT') {
                tickets = tickets.filter(t => t.assigned_to === currentUser.id);
            }

            return mockResponse(tickets);
        }

        if (url.match(/^\/tickets\/[^/]+$/) && method === 'GET') {
            const id = url.split('/')[2];
            const ticket = mockDb.getTicketById(id);
            const currentUser = getCurrentUserFromMock();

            if (!ticket || ticket.deleted_at) {
                throw mockError('Ticket not found', 404);
            }

            if (currentUser?.role === 'CS_AGENT' && ticket.assigned_to !== currentUser.id) {
                throw mockError('Access denied', 403);
            }

            return mockResponse(ticket);
        }

        if (url === '/tickets' && method === 'POST') {
            const currentUser = getCurrentUserFromMock();

            if (!currentUser || currentUser.role === 'CS_AGENT') {
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

            if (data.assigned_to) {
                mockDb.createNotification({
                    user_id: data.assigned_to,
                    type: 'TICKET_ASSIGNED',
                    title: 'New Ticket Assigned',
                    body: `You have been assigned to ticket ${newTicket.order_number}`,
                    link: `/tickets/${newTicket.id}`,
                    is_read: false
                });
            }

            return mockResponse(newTicket, 201);
        }

        if (url.match(/^\/tickets\/[^/]+\/reopen$/) && method === 'PATCH') {
            const id = url.split('/')[2];
            const updated = mockDb.updateTicket(id, { status: 'REOPENED', resolved_at: null, closed_at: null });

            // Reopening also creates an event in a real system
            mockDb.createEvent({
                ticket_id: id,
                actor_id: getCurrentUserFromMock()?.id || 'system',
                event_type: 'TICKET_REOPENED',
                meta: {}
            });

            return mockResponse(updated);
        }

        if (url.match(/^\/tickets\/[^/]+\/status$/) && method === 'PATCH') {
            const id = url.split('/')[2];
            const currentUser = getCurrentUserFromMock();
            const ticket = mockDb.getTicketById(id);

            if (!ticket) {
                throw mockError('Ticket not found', 404);
            }

            if (currentUser?.role === 'CS_AGENT') {
                if (ticket.assigned_to !== currentUser.id) {
                    throw mockError('Access denied', 403);
                }
                const allowedForCS = ['IN_PROGRESS', 'WAITING', 'RESOLVED'];
                if (!allowedForCS.includes(data.status)) {
                    throw mockError('CS cannot set this status', 403);
                }
            }

            const updates: any = { status: data.status };
            if (data.status === 'RESOLVED') updates.resolved_at = new Date().toISOString();
            if (data.status === 'CLOSED') updates.closed_at = new Date().toISOString();

            const updated = mockDb.updateTicket(id, updates);
            return mockResponse(updated);
        }

        if (url.match(/^\/tickets\/[^/]+\/assign$/) && method === 'POST') {
            const id = url.split('/')[2];
            const ticket = mockDb.updateTicket(id, {
                assigned_to: data.assigned_to,
                status: 'ASSIGNED'
            });
            mockDb.createNotification({
                user_id: data.assigned_to,
                type: 'TICKET_REASSIGNED',
                title: 'Ticket Assigned',
                body: `Ticket ${ticket?.order_number} assigned to you`,
                link: `/tickets/${id}`,
                is_read: false
            });
            return mockResponse(ticket);
        }

        if (url.match(/^\/tickets\/[^/]+\/messages$/) && method === 'GET') {
            const ticketId = url.split('/')[2];
            const messages = mockDb.getMessagesByTicketId(ticketId);
            return mockResponse(messages);
        }

        if (url.match(/^\/tickets\/[^/]+\/messages$/) && method === 'POST') {
            const ticketId = url.split('/')[2];
            const currentUser = getCurrentUserFromMock();

            const newMessage = mockDb.createMessage({
                ticket_id: ticketId,
                sender_id: currentUser?.id || 'unknown',
                message: data.message,
            });

            return mockResponse(newMessage, 201);
        }

        if (url.match(/^\/tickets\/[^/]+\/events$/) && method === 'GET') {
            const ticketId = url.split('/')[2];
            const events = mockDb.getEventsByTicketId(ticketId);
            return mockResponse(events);
        }

        if (url.match(/^\/tickets\/[^/]+$/) && method === 'PATCH') {
            const id = url.split('/')[2];
            const currentUser = getCurrentUserFromMock();
            const ticket = mockDb.getTicketById(id);

            if (!ticket) {
                throw mockError('Ticket not found', 404);
            }

            if (currentUser?.role === 'CS_AGENT') {
                throw mockError('CS cannot edit ticket fields', 403);
            }

            if (currentUser?.role === 'ACC_MANAGER' && ticket.created_by !== currentUser.id) {
                throw mockError('Only ticket creator can edit', 403);
            }

            const updated = mockDb.updateTicket(id, data);
            return mockResponse(updated);
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

            if (!currentUser) {
                throw mockError('Not authenticated', 401);
            }
            if (currentUser.role !== 'ADMIN') {
                throw mockError('Admin access required', 403);
            }

            const users = mockDb.getUsers().map(u => ({ ...u, password_hash: undefined }));
            return mockResponse(users);
        }

        if (url === '/users' && method === 'POST') {
            const currentUser = getCurrentUserFromMock();
            if (currentUser?.role !== 'ADMIN') {
                throw mockError('Admin access required', 403);
            }
            const newUser = mockDb.createUser(data);
            return mockResponse(newUser, 201);
        }

        if (url.match(/^\/users\/[^/]+$/) && method === 'GET') {
            const id = url.split('/')[2];
            const user = mockDb.getUserById(id);

            if (!user) {
                throw mockError('User not found', 404);
            }

            return mockResponse({ ...user, password_hash: undefined });
        }

        if (url.match(/^\/users\/[^/]+$/) && method === 'PATCH') {
            const id = url.split('/')[2];
            const currentUser = getCurrentUserFromMock();

            if (currentUser?.role !== 'ADMIN') {
                throw mockError('Admin access required', 403);
            }

            if (data.is_active === false && id === currentUser.id) {
                throw mockError('Cannot deactivate your own account', 400);
            }

            const updated = mockDb.updateUser(id, data);
            return mockResponse({ ...updated, password_hash: undefined });
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
            return mockResponse(updated);
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
            return mockResponse(stats);
        }

        // ==================== EMPLOYEES ====================
        if ((url === '/employees' || url.startsWith('/employees?')) && method === 'GET') {
            let employees = mockDb.getEmployees();

            let activeParam = params.active;
            if (activeParam === undefined && url.includes('?')) {
                const searchParams = new URLSearchParams(url.split('?')[1]);
                if (searchParams.has('active')) {
                    activeParam = searchParams.get('active');
                }
            }

            if (String(activeParam) === 'true') {
                employees = employees.filter(e => e.is_active);
            }

            return mockResponse(employees);
        }

        if (url === '/employees' && method === 'POST') {
            const newEmployee = mockDb.createEmployee({
                ...data,
                is_active: data.is_active !== undefined ? data.is_active : true,
                start_date: data.start_date || new Date().toISOString(),
            });
            return mockResponse(newEmployee, 201);
        }

        // ==================== REASONS ====================
        if ((url === '/reasons' || url.startsWith('/ticket-reasons')) && method === 'GET') {
            const reasons = mockDb.getReasons();
            let activeOnly = true;

            if (params.activeOnly !== undefined) {
                activeOnly = String(params.activeOnly) === 'true';
            } else if (url.includes('?')) {
                const searchParams = new URLSearchParams(url.split('?')[1]);
                if (searchParams.has('activeOnly')) {
                    activeOnly = searchParams.get('activeOnly') === 'true';
                }
            }

            const filtered = activeOnly ? reasons.filter(r => r.is_active) : reasons;
            return mockResponse(filtered);
        }

        // ==================== GAMIFICATION ====================
        if (url === '/gamification/my-progress' && method === 'GET') {
            return mockResponse({
                points: 1250,
                level: 5,
                next_level_points: 2000,
                badges: [],
                streaks: [{ key: 'daily', current_count: 3, best_count: 7 }],
                history: [
                    { id: '1', reason: 'Ticket Resolved', amount: 50, created_at: new Date().toISOString() }
                ]
            });
        }

        if (url === '/gamification/leaderboard' && method === 'GET') {
            const users = mockDb.getUsers();
            const leaderboard = users.map(u => ({
                user_id: u.id,
                user: u.name,
                role: u.role,
                department: (u as any).department?.name || 'Operations',
                points: Math.floor(Math.random() * 5000)
            })).sort((a, b) => b.points - a.points);
            return mockResponse(leaderboard);
        }

        if (url === '/gamification/missions/my' && method === 'GET') {
            const missions = mockDb.getMissions().map(m => ({
                ...m,
                assignments: [{ status: 'ACTIVE', progress_value: 2 }]
            }));
            return mockResponse(missions);
        }

        if (url === '/gamification/rewards' && method === 'GET') {
            const rewards = mockDb.getRewards();
            return mockResponse(rewards);
        }

        if (url === '/gamification/rewards/redeem' && method === 'POST') {
            const currentUser = getCurrentUserFromMock();
            if (!currentUser) throw mockError('Not authenticated', 401);
            const redemption = mockDb.createRedemption(currentUser.id, data.reward_id);
            return mockResponse(redemption, 201);
        }

        if (url === '/gamification/missions' && method === 'GET') {
            const missions = mockDb.getMissions();
            return mockResponse(missions);
        }

        if (url === '/gamification/missions' && method === 'POST') {
            const mission = mockDb.createMission(data);
            return mockResponse(mission, 201);
        }

        if (url === '/gamification/rewards/redemptions' && method === 'GET') {
            const redemptions = mockDb.getRedemptions();
            return mockResponse(redemptions);
        }

        if (url.match(/^\/gamification\/rewards\/redemptions\/[^/]+$/) && method === 'PATCH') {
            const id = url.split('/')[4];
            const updated = mockDb.updateRedemption(id, data.status);
            return mockResponse(updated);
        }

        if (url === '/gamification/actions/start-shift' && method === 'POST') {
            return mockResponse({ success: true, message: 'Shift started' });
        }

        if (url === '/gamification/actions/end-shift' && method === 'POST') {
            return mockResponse({ success: true, message: 'Shift ended' });
        }

        // ==================== HR DISCOVERY ====================
        if (url === '/hr/departments' && method === 'GET') {
            const depts = (mockDb as any).state.departments || [];
            return mockResponse(depts);
        }

        // Unhandled route
        unhandledRoute(method, url);
    }
};
