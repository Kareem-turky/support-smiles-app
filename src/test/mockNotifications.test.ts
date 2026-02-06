import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mockApiAdapter } from '@/lib/mockApiAdapter';
import { mockDb } from '@/services/mockDb';

describe('Mock API Notifications', () => {
    // Reset mockDb state before test to ensure clean state
    const originalState = JSON.parse(JSON.stringify(mockDb.state));

    beforeEach(() => {
        // Log in as Admin
        const adminUser = mockDb.getUserById('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
        if (adminUser) {
            mockDb.setCurrentUser(adminUser);
        }
    });

    afterEach(() => {
        // Restore DB state
        mockDb.state = JSON.parse(JSON.stringify(originalState));
    });

    it('should return an array of notifications directly', async () => {
        const response = await mockApiAdapter.request({
            method: 'GET',
            url: '/notifications'
        }) as any;

        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data).not.toHaveProperty('data'); // Ensure no double wrapping

        // Check structure of notification items
        if (response.data.length > 0) {
            const notification = response.data[0];
            expect(notification).toHaveProperty('id');
            expect(notification).toHaveProperty('user_id');
            expect(notification).toHaveProperty('message');
        }
    });

    it('should return mock notifications from mockDb', async () => {
        // Create a test notification
        const currentUser = mockDb.getCurrentUser();
        if (currentUser) {
            mockDb.createNotification({
                user_id: currentUser.id,
                type: 'TICKET_ASSIGNED',
                message: 'Test notification',
                read: false
            } as any);
        }

        const response = await mockApiAdapter.request({
            method: 'GET',
            url: '/notifications'
        }) as any;

        const testNotif = response.data.find((n: any) => n.message === 'Test notification');
        expect(testNotif).toBeDefined();
    });
});
