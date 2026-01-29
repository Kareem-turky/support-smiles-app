/**
 * Comprehensive RBAC and Edge Case Tests
 * 
 * These tests cover:
 * - CS cannot edit accounting fields
 * - CS cannot view unassigned tickets
 * - Accounting cannot manage users
 * - Admin reassignment
 * - Reopen/close flow
 * - Notification deep link + mark read on open
 * - Various forbidden (403) cases
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ticketsService } from '@/services/tickets.service';
import { usersService } from '@/services/users.service';
import { notificationsService } from '@/services/notifications.service';
import { authService } from '@/services/auth.service';
import { mockDb, USER_IDS, TICKET_IDS } from '@/services/mockDb';

describe('RBAC Enforcement Tests', () => {
  beforeEach(() => {
    mockDb.reset();
  });

  describe('CS Role Restrictions', () => {
    it('CS cannot edit ticket core fields (order_number)', async () => {
      await authService.login({ email: 'mike@company.com', password: 'cs123' });
      
      const result = await ticketsService.update(TICKET_IDS.TICKET_1, {
        order_number: 'CS-MODIFIED-001',
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('CS cannot edit ticket fields');
    });

    it('CS cannot edit ticket core fields (priority)', async () => {
      await authService.login({ email: 'mike@company.com', password: 'cs123' });
      
      const result = await ticketsService.update(TICKET_IDS.TICKET_1, {
        priority: 'URGENT',
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('CS cannot edit');
    });

    it('CS cannot edit ticket core fields (issue_type)', async () => {
      await authService.login({ email: 'mike@company.com', password: 'cs123' });
      
      const result = await ticketsService.update(TICKET_IDS.TICKET_1, {
        issue_type: 'COD',
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('CS cannot edit');
    });

    it('CS cannot view unassigned tickets', async () => {
      await authService.login({ email: 'mike@company.com', password: 'cs123' });
      
      // TICKET_3 is unassigned (assigned_to: null)
      const result = await ticketsService.getById(TICKET_IDS.TICKET_3);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Access denied');
    });

    it('CS cannot view tickets assigned to other CS users', async () => {
      await authService.login({ email: 'mike@company.com', password: 'cs123' });
      
      // TICKET_2 is assigned to Emily, not Mike
      const result = await ticketsService.getById(TICKET_IDS.TICKET_2);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Access denied');
    });

    it('CS can only see assigned tickets in list', async () => {
      await authService.login({ email: 'mike@company.com', password: 'cs123' });
      
      const result = await ticketsService.getAll();
      
      expect(result.success).toBe(true);
      // Verify ALL returned tickets are assigned to Mike
      result.data?.data.forEach(ticket => {
        expect(ticket.assigned_to).toBe(USER_IDS.CS_MIKE);
      });
    });

    it('CS cannot change status of ticket assigned to another user', async () => {
      await authService.login({ email: 'mike@company.com', password: 'cs123' });
      
      // TICKET_2 is assigned to Emily
      const result = await ticketsService.changeStatus(TICKET_IDS.TICKET_2, 'IN_PROGRESS');
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Access denied');
    });

    it('CS cannot set status to CLOSED', async () => {
      await authService.login({ email: 'mike@company.com', password: 'cs123' });
      
      const result = await ticketsService.changeStatus(TICKET_IDS.TICKET_1, 'CLOSED');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('CS can only set status to');
    });

    it('CS cannot set status to REOPENED', async () => {
      await authService.login({ email: 'mike@company.com', password: 'cs123' });
      
      // TICKET_4 is resolved, assigned to Mike
      const result = await ticketsService.changeStatus(TICKET_IDS.TICKET_4, 'REOPENED');
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('CS can only set status to');
    });

    it('CS cannot delete tickets', async () => {
      await authService.login({ email: 'mike@company.com', password: 'cs123' });
      
      const result = await ticketsService.delete(TICKET_IDS.TICKET_1);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Admin access required');
    });
  });

  describe('Accounting Role Restrictions', () => {
    it('Accounting cannot manage users (get all users)', async () => {
      await authService.login({ email: 'sarah@company.com', password: 'accounting123' });
      
      const result = await usersService.getAll();
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Admin access required');
    });

    it('Accounting cannot toggle user active status', async () => {
      await authService.login({ email: 'sarah@company.com', password: 'accounting123' });
      
      const result = await usersService.toggleActive(USER_IDS.CS_MIKE);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Admin access required');
    });

    it('Accounting cannot create new users', async () => {
      await authService.login({ email: 'sarah@company.com', password: 'accounting123' });
      
      const result = await usersService.create({
        name: 'New User',
        email: 'new@company.com',
        password: 'password123',
        role: 'CS',
      });
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Admin access required');
    });

    it('Accounting cannot edit tickets created by others', async () => {
      // First, login as admin and create a ticket
      await authService.login({ email: 'admin@company.com', password: 'admin123' });
      const createResult = await ticketsService.create({
        order_number: 'ADMIN-CREATED-001',
        courier_company: 'Test',
        issue_type: 'OTHER',
        priority: 'LOW',
        description: 'Created by admin',
      });
      
      expect(createResult.success).toBe(true);
      const ticketId = createResult.data!.id;
      
      // Now login as accounting and try to edit
      await authService.login({ email: 'sarah@company.com', password: 'accounting123' });
      const updateResult = await ticketsService.update(ticketId, {
        description: 'Modified by accounting',
      });
      
      expect(updateResult.success).toBe(false);
      expect(updateResult.error).toContain('Only ticket creator can edit');
    });

    it('Accounting cannot delete tickets', async () => {
      await authService.login({ email: 'sarah@company.com', password: 'accounting123' });
      
      const result = await ticketsService.delete(TICKET_IDS.TICKET_1);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Admin access required');
    });
  });

  describe('Admin Reassignment', () => {
    it('Admin can reassign ticket from one CS to another', async () => {
      await authService.login({ email: 'admin@company.com', password: 'admin123' });
      
      // TICKET_1 is assigned to Mike, reassign to Emily
      const result = await ticketsService.assign(TICKET_IDS.TICKET_1, USER_IDS.CS_EMILY);
      
      expect(result.success).toBe(true);
      expect(result.data?.assigned_to).toBe(USER_IDS.CS_EMILY);
    });

    it('Admin reassignment creates notification for new assignee', async () => {
      await authService.login({ email: 'admin@company.com', password: 'admin123' });
      
      // Reassign TICKET_1 from Mike to Emily
      await ticketsService.assign(TICKET_IDS.TICKET_1, USER_IDS.CS_EMILY);
      
      // Check Emily's notifications
      await authService.login({ email: 'emily@company.com', password: 'cs123' });
      const notifications = await notificationsService.getAll();
      
      const reassignNotif = notifications.data?.find(
        n => n.type === 'TICKET_REASSIGNED' && n.link.includes(TICKET_IDS.TICKET_1)
      );
      
      expect(reassignNotif).toBeDefined();
    });
  });

  describe('Reopen/Close Flow', () => {
    it('Admin can close a resolved ticket', async () => {
      await authService.login({ email: 'admin@company.com', password: 'admin123' });
      
      // TICKET_4 is already resolved
      const result = await ticketsService.close(TICKET_IDS.TICKET_4);
      
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('CLOSED');
      expect(result.data?.closed_at).toBeDefined();
    });

    it('Admin can reopen a resolved ticket', async () => {
      await authService.login({ email: 'admin@company.com', password: 'admin123' });
      
      // TICKET_4 is resolved
      const result = await ticketsService.reopen(TICKET_IDS.TICKET_4);
      
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('REOPENED');
    });

    it('Accounting can reopen a resolved ticket', async () => {
      await authService.login({ email: 'sarah@company.com', password: 'accounting123' });
      
      // TICKET_4 is resolved
      const result = await ticketsService.reopen(TICKET_IDS.TICKET_4);
      
      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('REOPENED');
    });

    it('Reopen creates audit event', async () => {
      await authService.login({ email: 'admin@company.com', password: 'admin123' });
      
      await ticketsService.reopen(TICKET_IDS.TICKET_4);
      
      const events = await ticketsService.getEvents(TICKET_IDS.TICKET_4);
      const reopenEvent = events.data?.find(e => e.event_type === 'TICKET_REOPENED');
      
      expect(reopenEvent).toBeDefined();
    });

    it('Close creates closed_at timestamp', async () => {
      await authService.login({ email: 'admin@company.com', password: 'admin123' });
      
      const result = await ticketsService.close(TICKET_IDS.TICKET_4);
      
      expect(result.success).toBe(true);
      expect(result.data?.closed_at).toBeDefined();
      expect(new Date(result.data!.closed_at!)).toBeInstanceOf(Date);
    });
  });

  describe('Notification Deep Link', () => {
    it('Notification link includes ticket ID', async () => {
      await authService.login({ email: 'sarah@company.com', password: 'accounting123' });
      
      // Create ticket assigned to Mike
      const createResult = await ticketsService.create({
        order_number: 'DEEPLINK-TEST',
        courier_company: 'Test',
        issue_type: 'DELIVERY',
        priority: 'HIGH',
        description: 'Testing deep links',
        assigned_to: USER_IDS.CS_MIKE,
      });
      
      const ticketId = createResult.data!.id;
      
      // Check Mike's notifications
      await authService.login({ email: 'mike@company.com', password: 'cs123' });
      const notifications = await notificationsService.getAll();
      
      const assignNotif = notifications.data?.find(
        n => n.body.includes('DEEPLINK-TEST')
      );
      
      expect(assignNotif).toBeDefined();
      expect(assignNotif?.link).toBe(`/tickets/${ticketId}`);
    });

    it('Mark notification as read when viewing ticket', async () => {
      await authService.login({ email: 'mike@company.com', password: 'cs123' });
      
      const notifications = await notificationsService.getAll();
      const unreadNotif = notifications.data?.find(n => !n.is_read);
      
      if (unreadNotif) {
        // Simulate opening the ticket (mark notification as read)
        await notificationsService.markAsRead(unreadNotif.id);
        
        // Verify it's now read
        const updated = await notificationsService.getAll();
        const notif = updated.data?.find(n => n.id === unreadNotif.id);
        expect(notif?.is_read).toBe(true);
      }
    });
  });

  describe('Admin Full Access', () => {
    it('Admin can view all tickets including unassigned', async () => {
      await authService.login({ email: 'admin@company.com', password: 'admin123' });
      
      const result = await ticketsService.getAll();
      
      expect(result.success).toBe(true);
      // Should include unassigned tickets
      const unassigned = result.data?.data.filter(t => !t.assigned_to);
      expect(unassigned?.length).toBeGreaterThan(0);
    });

    it('Admin can edit any ticket regardless of creator', async () => {
      await authService.login({ email: 'admin@company.com', password: 'admin123' });
      
      // TICKET_1 was created by accounting
      const result = await ticketsService.update(TICKET_IDS.TICKET_1, {
        description: 'Admin modified this',
      });
      
      expect(result.success).toBe(true);
      expect(result.data?.description).toBe('Admin modified this');
    });

    it('Admin can manage users', async () => {
      await authService.login({ email: 'admin@company.com', password: 'admin123' });
      
      const result = await usersService.getAll();
      
      expect(result.success).toBe(true);
      expect(result.data?.length).toBeGreaterThan(0);
    });

    it('Admin can deactivate other users', async () => {
      await authService.login({ email: 'admin@company.com', password: 'admin123' });
      
      const result = await usersService.toggleActive(USER_IDS.CS_MIKE);
      
      expect(result.success).toBe(true);
      expect(result.data?.is_active).toBe(false);
    });

    it('Admin cannot deactivate themselves', async () => {
      await authService.login({ email: 'admin@company.com', password: 'admin123' });
      
      const result = await usersService.toggleActive(USER_IDS.ADMIN);
      
      expect(result.success).toBe(false);
      expect(result.error).toContain('Cannot deactivate your own account');
    });
  });

  describe('Soft Delete', () => {
    it('Soft deleted tickets are not returned in list', async () => {
      await authService.login({ email: 'admin@company.com', password: 'admin123' });
      
      // Get initial count
      const before = await ticketsService.getAll();
      const countBefore = before.data?.total ?? 0;
      
      // Delete a ticket
      await ticketsService.delete(TICKET_IDS.TICKET_1);
      
      // Get new count
      const after = await ticketsService.getAll();
      const countAfter = after.data?.total ?? 0;
      
      expect(countAfter).toBe(countBefore - 1);
    });

    it('Soft deleted tickets cannot be accessed by ID', async () => {
      await authService.login({ email: 'admin@company.com', password: 'admin123' });
      
      await ticketsService.delete(TICKET_IDS.TICKET_1);
      
      const result = await ticketsService.getById(TICKET_IDS.TICKET_1);
      
      expect(result.success).toBe(false);
      expect(result.error).toBe('Ticket not found');
    });
  });
});
