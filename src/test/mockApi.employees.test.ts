
import { describe, it, expect, beforeEach } from 'vitest';
import { mockApiAdapter } from '../lib/mockApiAdapter';
import { mockDb } from '../services/mockDb';

describe('Mock API - Employees', () => {
    beforeEach(() => {
        mockDb.initialize(true); // Reset DB
    });

    it('should return all employees when no filter provided', async () => {
        const response = await mockApiAdapter.request({
            method: 'GET',
            url: '/employees',
        });

        expect(response.data).toBeDefined();
        expect(Array.isArray(response.data)).toBe(true);
        // We seeded 5 employees
        expect(response.data.length).toBeGreaterThanOrEqual(5);
    });

    it('should return only active employees when active=true', async () => {
        const response = await mockApiAdapter.request({
            method: 'GET',
            url: '/employees?active=true',
        });

        expect(Array.isArray(response.data)).toBe(true);
        response.data.forEach((e: any) => {
            expect(e.is_active).toBe(true);
        });

        // Ensure we have at least one active
        expect(response.data.length).toBeGreaterThan(0);

        // Ensure inactive ones are missing
        const inactive = response.data.find((e: any) => !e.is_active);
        expect(inactive).toBeUndefined();
    });

    it('should return ALL employees when active=false (no filter)', async () => {
        const response = await mockApiAdapter.request({
            method: 'GET',
            url: '/employees?active=false',
        });

        expect(Array.isArray(response.data)).toBe(true);
        expect(response.data.length).toBeGreaterThanOrEqual(1);

        // Should contain BOTH active and inactive
        const active = response.data.find((e: any) => e.is_active === true);
        const inactive = response.data.find((e: any) => !e.is_active);

        expect(active).toBeDefined();
        expect(inactive).toBeDefined();
    });
});
