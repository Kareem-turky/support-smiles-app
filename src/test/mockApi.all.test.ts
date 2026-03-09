import { describe, it, expect, vi } from 'vitest';
import { mockApiAdapter as adapter } from '@/lib/mockApiAdapter';
import { mockDb } from '@/services/mockDb';

describe('Mock API Standardization & Coverage', () => {
    describe('Auth Routes', () => {
        it('POST /auth/login returns direct payload', async () => {
            const result = await adapter.request({
                method: 'POST',
                url: '/auth/login',
                data: { email: 'admin@company.com', password: 'admin123' }
            });

            expect(result.data).toBeDefined();
            expect(result.data.data).toBeDefined();
            expect(result.data.data.user).toBeDefined();
            expect(result.data.data.access_token).toBeDefined();
        });

        it('GET /auth/me returns direct user object', async () => {
            // Seed current user
            const admin = mockDb.getUserById('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
            mockDb.setCurrentUser(admin!);

            const result = await adapter.request({
                method: 'GET',
                url: '/auth/me'
            });

            expect(result.data).toBeDefined();
            expect(result.data.data).toBeDefined();
            expect(result.data.data.id).toBe('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
        });
    });

    describe('Tickets Routes', () => {
        it('GET /tickets returns array', async () => {
            const result = await adapter.request({
                method: 'GET',
                url: '/tickets'
            });

            expect(Array.isArray(result.data.data)).toBe(true);
        });

        it('GET /tickets/:id returns single object', async () => {
            const ticketId = 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';
            const result = await adapter.request({
                method: 'GET',
                url: `/tickets/${ticketId}`
            });

            expect(result.data.id).toBe(ticketId);
        });
    });

    describe('Coverage Report', () => {
        it('should show all tested routes in global store', () => {
            const report = (globalThis as any).__MOCK_API_COVERAGE__;
            expect(report).toBeDefined();
            expect(report.length).toBeGreaterThan(0);

            // Check for some expected routes
            expect(report).toContain('POST /auth/login');
            expect(report).toContain('GET /auth/me');
            expect(report).toContain('GET /tickets');
            expect(report).toContain('GET /tickets/:id');
        });
    });
});
