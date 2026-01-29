import { describe, it, expect, beforeEach } from 'vitest';
import { ticketsService } from '@/services/tickets.service';
import { authService } from '@/services/auth.service';
import { mockDb, USER_IDS } from '@/services/mockDb';

describe('TicketsService', () => {
  beforeEach(() => {
    mockDb.reset();
  });

  describe('getAll', () => {
    it('should return tickets for authenticated user', async () => {
      await authService.login({ email: 'admin@company.com', password: 'admin123' });

      const result = await ticketsService.getAll();

      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data!.data.length).toBeGreaterThan(0);
    });

    it('should filter tickets by status', async () => {
      await authService.login({ email: 'admin@company.com', password: 'admin123' });

      const result = await ticketsService.getAll({ status: ['NEW'] });

      expect(result.success).toBe(true);
      result.data!.data.forEach(ticket => {
        expect(ticket.status).toBe('NEW');
      });
    });

    it('should only show assigned tickets to CS users', async () => {
      await authService.login({ email: 'mike@company.com', password: 'cs123' });

      const result = await ticketsService.getAll();

      expect(result.success).toBe(true);
      result.data!.data.forEach(ticket => {
        expect(ticket.assigned_to).toBe(USER_IDS.CS_MIKE);
      });
    });
  });

  describe('create', () => {
    it('should create ticket for accounting user', async () => {
      await authService.login({ email: 'sarah@company.com', password: 'accounting123' });

      const result = await ticketsService.create({
        order_number: 'ORD-TEST-001',
        courier_company: 'TestCourier',
        issue_type: 'DELIVERY',
        priority: 'HIGH',
        description: 'Test description for the ticket',
      });

      expect(result.success).toBe(true);
      expect(result.data?.order_number).toBe('ORD-TEST-001');
      expect(result.data?.status).toBe('NEW');
    });

    it('should not allow CS to create tickets', async () => {
      await authService.login({ email: 'mike@company.com', password: 'cs123' });

      const result = await ticketsService.create({
        order_number: 'ORD-TEST-002',
        courier_company: 'TestCourier',
        issue_type: 'DELIVERY',
        priority: 'HIGH',
        description: 'Test description',
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('Access denied');
    });

    it('should set status to ASSIGNED when assignee is provided', async () => {
      await authService.login({ email: 'sarah@company.com', password: 'accounting123' });

      const result = await ticketsService.create({
        order_number: 'ORD-TEST-003',
        courier_company: 'TestCourier',
        issue_type: 'DELIVERY',
        priority: 'MEDIUM',
        description: 'Test with assignee',
        assigned_to: USER_IDS.CS_MIKE,
      });

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('ASSIGNED');
      expect(result.data?.assigned_to).toBe(USER_IDS.CS_MIKE);
    });
  });

  describe('changeStatus', () => {
    it('should allow CS to change status to allowed values', async () => {
      await authService.login({ email: 'mike@company.com', password: 'cs123' });

      const ticketsResult = await ticketsService.getAll();
      const ticket = ticketsResult.data!.data[0];

      const result = await ticketsService.changeStatus(ticket.id, 'IN_PROGRESS');

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('IN_PROGRESS');
    });

    it('should not allow CS to change status to CLOSED', async () => {
      await authService.login({ email: 'mike@company.com', password: 'cs123' });

      const ticketsResult = await ticketsService.getAll();
      const ticket = ticketsResult.data!.data[0];

      const result = await ticketsService.changeStatus(ticket.id, 'CLOSED');

      expect(result.success).toBe(false);
      expect(result.error).toContain('CS can only set status to');
    });
  });

  describe('addMessage', () => {
    it('should add message to ticket', async () => {
      await authService.login({ email: 'mike@company.com', password: 'cs123' });

      const ticketsResult = await ticketsService.getAll();
      const ticket = ticketsResult.data!.data[0];

      const result = await ticketsService.addMessage(ticket.id, 'Test message content');

      expect(result.success).toBe(true);
      expect(result.data?.message).toBe('Test message content');
    });
  });

  describe('resolve', () => {
    it('should resolve ticket', async () => {
      await authService.login({ email: 'mike@company.com', password: 'cs123' });

      const ticketsResult = await ticketsService.getAll();
      const ticket = ticketsResult.data!.data[0];

      const result = await ticketsService.resolve(ticket.id);

      expect(result.success).toBe(true);
      expect(result.data?.status).toBe('RESOLVED');
      expect(result.data?.resolved_at).toBeDefined();
    });
  });

  describe('delete', () => {
    it('should only allow admin to delete', async () => {
      await authService.login({ email: 'sarah@company.com', password: 'accounting123' });

      const ticketsResult = await ticketsService.getAll();
      const ticket = ticketsResult.data!.data[0];

      const result = await ticketsService.delete(ticket.id);

      expect(result.success).toBe(false);
      expect(result.error).toContain('Admin access required');
    });

    it('should soft delete ticket for admin', async () => {
      await authService.login({ email: 'admin@company.com', password: 'admin123' });

      const ticketsResult = await ticketsService.getAll();
      const ticket = ticketsResult.data!.data[0];
      const ticketId = ticket.id;

      const deleteResult = await ticketsService.delete(ticketId);
      expect(deleteResult.success).toBe(true);

      const afterDelete = await ticketsService.getAll();
      const deletedTicket = afterDelete.data!.data.find(t => t.id === ticketId);
      expect(deletedTicket).toBeUndefined();
    });
  });
});
