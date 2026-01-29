import { describe, it, expect, beforeEach } from 'vitest';
import { notificationsService } from '@/services/notifications.service';
import { ticketsService } from '@/services/tickets.service';
import { authService } from '@/services/auth.service';
import { mockDb, USER_IDS, TICKET_IDS } from '@/services/mockDb';

describe('NotificationsService', () => {
  beforeEach(() => {
    mockDb.reset();
  });

  describe('getAll', () => {
    it('should return notifications for current user', async () => {
      await authService.login({ email: 'sarah@company.com', password: 'accounting123' });

      const result = await notificationsService.getAll();

      expect(result.success).toBe(true);
      expect(Array.isArray(result.data)).toBe(true);
    });

    it('should fail when not authenticated', async () => {
      const result = await notificationsService.getAll();

      expect(result.success).toBe(false);
      expect(result.error).toBe('Unauthorized');
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread count', async () => {
      await authService.login({ email: 'sarah@company.com', password: 'accounting123' });

      const result = await notificationsService.getUnreadCount();

      expect(result.success).toBe(true);
      expect(typeof result.data).toBe('number');
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      await authService.login({ email: 'sarah@company.com', password: 'accounting123' });

      const allNotifs = await notificationsService.getAll();
      const unreadNotif = allNotifs.data?.find(n => !n.is_read);
      
      if (unreadNotif) {
        const result = await notificationsService.markAsRead(unreadNotif.id);
        expect(result.success).toBe(true);
        expect(result.data?.is_read).toBe(true);
      }
    });

    it('should fail for notification not belonging to user', async () => {
      await authService.login({ email: 'sarah@company.com', password: 'accounting123' });

      // Get a notification belonging to Mike
      const mikeNotifs = mockDb.getNotificationsByUserId(USER_IDS.CS_MIKE);
      const mikeNotif = mikeNotifs[0];

      if (mikeNotif) {
        const result = await notificationsService.markAsRead(mikeNotif.id);
        expect(result.success).toBe(false);
        expect(result.error).toBe('Notification not found');
      }
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      await authService.login({ email: 'sarah@company.com', password: 'accounting123' });

      const result = await notificationsService.markAllAsRead();
      expect(result.success).toBe(true);

      const afterMark = await notificationsService.getUnreadCount();
      expect(afterMark.data).toBe(0);
    });
  });

  describe('notification creation on ticket actions', () => {
    it('should create notification when ticket is assigned', async () => {
      await authService.login({ email: 'sarah@company.com', password: 'accounting123' });

      // Create a ticket assigned to CS user
      await ticketsService.create({
        order_number: 'ORD-NOTIF-TEST',
        courier_company: 'TestCourier',
        issue_type: 'DELIVERY',
        priority: 'HIGH',
        description: 'Testing notification creation',
        assigned_to: USER_IDS.CS_MIKE,
      });

      // Login as CS user and check notifications
      await authService.login({ email: 'mike@company.com', password: 'cs123' });
      const notifications = await notificationsService.getAll();
      
      const assignmentNotif = notifications.data?.find(
        n => n.type === 'TICKET_ASSIGNED' && n.body.includes('ORD-NOTIF-TEST')
      );
      
      expect(assignmentNotif).toBeDefined();
    });

    it('should create notification when message is sent', async () => {
      await authService.login({ email: 'mike@company.com', password: 'cs123' });

      // Get assigned ticket
      const ticketsResult = await ticketsService.getAll();
      const ticket = ticketsResult.data!.data[0];

      // Send a message
      await ticketsService.addMessage(ticket.id, 'Test notification message');

      // Login as accounting and check notifications
      await authService.login({ email: 'sarah@company.com', password: 'accounting123' });
      const notifications = await notificationsService.getAll();

      const messageNotif = notifications.data?.find(
        n => n.type === 'MESSAGE_RECEIVED' && n.link.includes(ticket.id)
      );

      expect(messageNotif).toBeDefined();
    });
  });
});
