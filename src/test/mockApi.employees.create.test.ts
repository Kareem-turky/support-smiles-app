
import { describe, it, expect, beforeEach } from 'vitest';
import { mockApiAdapter } from '../lib/mockApiAdapter';
import { mockDb } from '../services/mockDb';

describe('Mock API - Employees Create', () => {
    beforeEach(() => {
        mockDb.initialize(true); // Reset DB
    });

    it('should create a new employee and return it', async () => {
        const newEmployeeData = {
            full_name: 'New Hire',
            code: 'EMP999',
            department: 'Engineering',
            base_salary: 8000,
            salary_type: 'MONTHLY',
            start_date: '2025-01-01',
        };

        const response = await mockApiAdapter.request({
            method: 'POST',
            url: '/employees',
            data: newEmployeeData,
        });

        expect(response.status).toBe(201);
        expect(response.data).toBeDefined();
        expect(response.data.id).toBeDefined();
        expect(response.data.full_name).toBe(newEmployeeData.full_name);
        expect(response.data.is_active).toBe(true); // Default
    });

    it('should persist the created employee', async () => {
        const newEmployeeData = {
            full_name: 'Persist Test',
            code: 'EMP888',
            department: 'Sales',
            base_salary: 5000,
            salary_type: 'MONTHLY',
            start_date: '2025-02-01',
        };

        // Create
        await mockApiAdapter.request({
            method: 'POST',
            url: '/employees',
            data: newEmployeeData,
        });

        // Fetch all
        const response = await mockApiAdapter.request({
            method: 'GET',
            url: '/employees',
        });

        const found = response.data.find((e: any) => e.code === 'EMP888');
        expect(found).toBeDefined();
        expect(found.full_name).toBe('Persist Test');
    });

    it('should respect is_active flag during creation', async () => {
        const inactiveEmployeeData = {
            full_name: 'Inactive Hire',
            code: 'EMP777',
            department: 'HR',
            base_salary: 4000,
            salary_type: 'MONTHLY',
            start_date: '2025-03-01',
            is_active: false,
        };

        const response = await mockApiAdapter.request({
            method: 'POST',
            url: '/employees',
            data: inactiveEmployeeData,
        });

        expect(response.data.is_active).toBe(false);

        // Verify with filter
        const getResponse = await mockApiAdapter.request({
            method: 'GET',
            url: '/employees?active=false',
        });

        const found = getResponse.data.find((e: any) => e.code === 'EMP777');
        expect(found).toBeDefined();
    });
});
