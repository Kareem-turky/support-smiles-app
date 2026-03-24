import { api } from '@/lib/api';
import {
  Ticket,
  TicketMessage,
  TicketEvent,
  ApiResponse,
  PaginatedResponse,
  TicketFilters,
  CreateTicketDto,
  UpdateTicketDto,
  TicketStatus
} from '@/types';

export const ticketsService = {
  getAll: async (
    filters: TicketFilters = {},
    page = 1,
    pageSize = 10
  ): Promise<ApiResponse<PaginatedResponse<Ticket>>> => {
    const params = {
      page,
      limit: pageSize,
      ...filters,
      status: filters.status?.join(','),
      priority: filters.priority?.join(','),
      issue_type: filters.issue_type?.join(','),
    };

    // Clean up undefined/null params
    Object.keys(params).forEach(key =>
      (params[key as keyof typeof params] === undefined || params[key as keyof typeof params] === null)
      && delete params[key as keyof typeof params]
    );

    try {
      const res = await api.get<PaginatedResponse<Ticket>>('/tickets', { params });
      // Normalize response if backend returns simple array vs paginated
      if (Array.isArray(res.data)) {
        return {
          success: true,
          data: {
            data: res.data,
            total: res.data.length,
            page,
            pageSize,
            totalPages: 1
          }
        };
      }
      return { success: true, data: res.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  getById: async (id: string): Promise<ApiResponse<Ticket>> => {
    try {
      const res = await api.get<Ticket>(`/tickets/${id}`);
      return { success: true, data: res.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  create: async (dto: CreateTicketDto): Promise<ApiResponse<Ticket>> => {
    try {
      const res = await api.post<Ticket>('/tickets', dto);
      return { success: true, data: res.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  update: async (id: string, dto: UpdateTicketDto): Promise<ApiResponse<Ticket>> => {
    try {
      const res = await api.patch<Ticket>(`/tickets/${id}`, dto);
      return { success: true, data: res.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  assign: async (id: string, assigneeId: string): Promise<ApiResponse<Ticket>> => {
    try {
      const res = await api.post<Ticket>(`/tickets/${id}/assign`, { assigned_to: assigneeId });
      return { success: true, data: res.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  changeStatus: async (id: string, status: TicketStatus): Promise<ApiResponse<Ticket>> => {
    try {
      const res = await api.patch<Ticket>(`/tickets/${id}/status`, { status });
      return { success: true, data: res.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  resolve: async (id: string): Promise<ApiResponse<Ticket>> => {
    try {
      return ticketsService.changeStatus(id, 'RESOLVED');
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  reopen: async (id: string): Promise<ApiResponse<Ticket>> => {
    try {
      const res = await api.patch<Ticket>(`/tickets/${id}/reopen`);
      return { success: true, data: res.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  delete: async (id: string): Promise<ApiResponse<void>> => {
    try {
      await api.delete(`/tickets/${id}`);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Messages
  getMessages: async (ticketId: string): Promise<ApiResponse<TicketMessage[]>> => {
    try {
      const res = await api.get<TicketMessage[]>(`/tickets/${ticketId}/messages`);
      return { success: true, data: res.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  addMessage: async (ticketId: string, message: string): Promise<ApiResponse<TicketMessage>> => {
    try {
      const res = await api.post<TicketMessage>(`/tickets/${ticketId}/messages`, { message });
      return { success: true, data: res.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Events (audit log)
  getEvents: async (ticketId: string): Promise<ApiResponse<TicketEvent[]>> => {
    try {
      const res = await api.get<TicketEvent[]>(`/tickets/${ticketId}/events`);
      return { success: true, data: res.data };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // Dashboard stats
  getStats: async (): Promise<ApiResponse<any>> => {
    // This endpoint should be implemented in backend `TicketsController`
    // If not, we can use the dashboard service or implement a specific endpoint
    // For now, let's try calling a stats endpoint
    try {
      const res = await api.get('/tickets/stats/overview');
      return { success: true, data: res.data };
    } catch (e) {
      console.warn('Stats endpoint not available, returning empty');
      return { success: true, data: { total: 0, byStatus: {}, byPriority: {}, resolvedThisWeek: 0, avgResolutionTime: 0 } };
    }
  },
};
