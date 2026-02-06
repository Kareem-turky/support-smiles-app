
import { describe, it, expect, beforeEach } from 'vitest';
import { mockApiAdapter } from '../lib/mockApiAdapter';
import { mockDb } from '../services/mockDb';

describe('Mock API - Users', () => {
    beforeEach(() => {
        mockDb.initialize(true); // Reset DB
        // Set a non-admin user as current (e.g. Mike from CS)
        const csUser = mockDb.getUsers().find(u => u.role === 'CS');
        if (csUser) mockDb.setCurrentUser(csUser);
    });

    it('should allow non-admin to fetch users', async () => {
        const response = await mockApiAdapter.request({
            method: 'GET',
            url: '/users',
        });

        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data.length).toBeGreaterThan(0);

        // Ensure CS users are in the list
        const csUser = response.data.find((u: any) => u.role === 'CS');
        expect(csUser).toBeDefined();
    });

    it('should return users array directly (not wrapped in data)', async () => {
        const response = await mockApiAdapter.request({
            method: 'GET',
            url: '/users',
        });

        // response.data should be the array
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data[0]).toHaveProperty('id');
        expect(response.data[0]).toHaveProperty('email');
    });

    it('should throw 401 if not authenticated', async () => {
        mockDb.setCurrentUser(null);
        await expect(mockApiAdapter.request({
            method: 'GET',
            url: '/users',
        })).rejects.toThrow('Not authenticated');
    });
});
