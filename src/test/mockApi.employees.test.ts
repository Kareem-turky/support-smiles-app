
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

    it('should return only inactive employees when active=false', async () => {
        const response = await mockApiAdapter.request({
            method: 'GET',
            url: '/employees?active=false',
        });

        expect(Array.isArray(response.data)).toBe(true);
        response.data.forEach((e: any) => {
            expect(e.is_active).toBe(false);
        });

        // Ensure we have at least one inactive (Bob Johnson emp-3)
        const bob = response.data.find((e: any) => e.full_name === 'Bob Johnson');
        expect(bob).toBeDefined();
    });
});
