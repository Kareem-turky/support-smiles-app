
import { describe, it, expect, beforeEach } from 'vitest';
import { mockApiAdapter } from '../lib/mockApiAdapter';
import { mockDb } from '../services/mockDb';

describe('Mock API - Ticket Details', () => {
    let ticketId: string;

    beforeEach(() => {
        mockDb.initialize(true);
        const ticket = mockDb.getTickets()[0];
        ticketId = ticket.id;
    });

    it('should return ticket object directly (unwrapped)', async () => {
        const response = await mockApiAdapter.request({
            method: 'GET',
            url: `/tickets/${ticketId}`,
        });

        expect(response.status).toBe(200);
        // Should have top-level properties of ticket
        expect(response.data).toHaveProperty('id');
        expect(response.data).toHaveProperty('order_number');
        expect(response.data.id).toBe(ticketId);
        // Should NOT be wrapped in data
        expect(response.data.data).toBeUndefined();
    });

    it('should return messages array directly', async () => {
        const response = await mockApiAdapter.request({
            method: 'GET',
            url: `/tickets/${ticketId}/messages`,
        });

        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
        // Should NOT be wrapped in data
        expect(response.data.data).toBeUndefined();
    });

    it('should return events array directly', async () => {
        const response = await mockApiAdapter.request({
            method: 'GET',
            url: `/tickets/${ticketId}/events`,
        });

        expect(response.status).toBe(200);
        expect(Array.isArray(response.data)).toBe(true);
        // Should NOT be wrapped in data
        expect(response.data.data).toBeUndefined();
    });
});
