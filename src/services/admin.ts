import { api } from '@/lib/api';

export interface TicketReason {
    id: string;
    name: string;
    category: string;
}

export const AdminService = {
    getTicketReasons: async () => (await api.get<TicketReason[]>('/admin/ticket-reasons')).data,
    createTicketReason: async (data: Omit<TicketReason, 'id'>) => (await api.post<TicketReason>('/admin/ticket-reasons', data)).data,
    deleteTicketReason: async (id: string) => (await api.delete(`/admin/ticket-reasons/${id}`)).data,
};
