
import { describe, it, expect, beforeEach } from 'vitest';
import { mockApiAdapter } from '../lib/mockApiAdapter';
import { mockDb } from '../services/mockDb';

describe('Mock API - Users', () => {
    beforeEach(() => {
        mockDb.initialize(true); // Reset DB
        // Set a non-admin user as current (e.g. Mike from CS)
        const csUser = mockDb.getUsers().find(u => u.role === 'CS_AGENT');
        if (csUser) mockDb.setCurrentUser(csUser);
    });

    it('should NOT allow non-admin to fetch users', async () => {
        try {
            await mockApiAdapter.request({
                method: 'GET',
                url: '/users',
            });
            // Should have thrown
            expect(true).toBe(false);
        } catch (error: any) {
            expect(error.response.status).toBe(403);
            expect(error.message).toContain('Admin access required');
        }
    });

    it('should return users array directly for admin', async () => {
        // Login as admin
        const admin = mockDb.getUsers().find(u => u.role === 'ADMIN');
        if (admin) mockDb.setCurrentUser(admin);

        const response = await mockApiAdapter.request({
            method: 'GET',
            url: '/users',
        });

        // response.data should be the array
        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data[0]).toHaveProperty('id');
        expect(response.data[0]).toHaveProperty('email');
    });

    it('should throw 401 if not authenticated', async () => {
        mockDb.setCurrentUser(null);
        await expect(mockApiAdapter.request({
            method: 'GET',
            url: '/users',
        })).rejects.toThrow('Unauthorized');
    });
});
