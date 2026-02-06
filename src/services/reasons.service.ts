import { api } from '@/lib/api';

export interface TicketReason {
    id: string;
    name: string;
    category: 'ACCOUNTING' | 'CS' | 'SHIPPING' | 'OTHER';
    sort_order: number;
    is_active: boolean;
    default_assign_role?: 'ADMIN' | 'ACCOUNTING' | 'CS';
    default_priority?: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
}

export const reasonsService = {
    // Public
    getAll: async (activeOnly = true) => {
        const res = await api.get<TicketReason[]>(`/ticket-reasons?activeOnly=${activeOnly}`);
        return res.data;
    },

    // Admin
    adminGetAll: async () => {
        const res = await api.get<TicketReason[]>('/admin/ticket-reasons');
        return res.data;
    },

    create: async (data: Omit<TicketReason, 'id' | 'is_active' | 'created_at' | 'updated_at'>) => {
        const res = await api.post<TicketReason>('/admin/ticket-reasons', data);
        return res.data;
    },

    update: async (id: string, data: Partial<TicketReason>) => {
        const res = await api.patch<TicketReason>(`/admin/ticket-reasons/${id}`, data);
        return res.data;
    },

    toggleActive: async (id: string) => {
        const res = await api.patch<TicketReason>(`/admin/ticket-reasons/${id}/toggle-active`);
        return res.data;
    },
};
