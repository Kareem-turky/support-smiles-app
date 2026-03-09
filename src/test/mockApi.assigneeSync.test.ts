
import { describe, it, expect, beforeEach } from 'vitest';
import { mockApiAdapter } from '../lib/mockApiAdapter';
import { mockDb } from '../services/mockDb';

describe('Mock API - Assignee Sync', () => {
    beforeEach(() => {
        mockDb.initialize(true);
        // Login as Admin to create employee
        const admin = mockDb.getUsers().find(u => u.role === 'ADMIN');
        if (admin) mockDb.setCurrentUser(admin);
    });

    it('should create a User record when an Employee is created', async () => {
        const newEmployeeData = {
            full_name: 'Test New Agent',
            email: 'agent.new@company.com',
            role: 'CS',
            department: 'Customer Service',
            start_date: '2025-01-01',
            base_salary: 5000,
            salary_type: 'MONTHLY',
            is_active: true
        };

        // 1. Create Employee
        const createRes = await mockApiAdapter.request({
            method: 'POST',
            url: '/employees',
            data: newEmployeeData
        });

        expect(createRes.status).toBe(201);
        const createdEmployee = createRes.data;
        expect(createdEmployee.id).toBeDefined();

        // 2. Fetch Users (Assignees)
        const usersRes = await mockApiAdapter.request({
            method: 'GET',
            url: '/users'
        });

        const createdUser = usersRes.data.find((u: any) => u.id === createdEmployee.id);

        // 3. Verify Sync
        expect(createdUser).toBeDefined();
        expect(createdUser.name).toBe(newEmployeeData.full_name);
        // Should have CS role by default (as per our fix) or logic
        expect(createdUser.role).toBe('CS');
    });
});
