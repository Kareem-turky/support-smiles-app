
import { describe, it, expect, beforeEach } from 'vitest';
import { mockApiAdapter } from '../lib/mockApiAdapter';
import { mockDb } from '../services/mockDb';

describe('Mock API - Ticket Reasons', () => {
    beforeEach(() => {
        mockDb.initialize(true); // Reset DB
    });

    it('should return active reasons by default (activeOnly=true)', async () => {
        // Simulate request from reasons.service.ts
        const response = await mockApiAdapter.request({
            method: 'GET',
            url: '/ticket-reasons?activeOnly=true',
        });

        // Expect array data directly (since we unwrapped it in adapter)
        // Wait, mockApiAdapter.request returns { data: T, ... } or T?
        // In mockApiAdapter.ts: return mockResponse(filtered).
        // mockResponse returns { data: filtered, ... }.
        // So response.data should be the array.

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data.length).toBeGreaterThan(0);

        // Check all are active
        response.data.forEach((r: any) => {
            expect(r.is_active).toBe(true);
        });

        // "Legacy Reason" is inactive in seed data
        const inactive = response.data.find((r: any) => r.name === 'Legacy Reason');
        expect(inactive).toBeUndefined();
    });

    it('should return all reasons when activeOnly=false', async () => {
        const response = await mockApiAdapter.request({
            method: 'GET',
            url: '/ticket-reasons?activeOnly=false',
        });

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);

        // Should include inactive
        const inactive = response.data.find((r: any) => r.name === 'Legacy Reason');
        expect(inactive).toBeDefined();
        expect(inactive.is_active).toBe(false);
    });
});
