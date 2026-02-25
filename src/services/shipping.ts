import { api } from '@/lib/api';

export interface ShippingCompany {
    id: string;
    name: string;
    is_active: boolean;
}

export const ShippingService = {
    getCompanies: async () => (await api.get<ShippingCompany[]>('/shipping/companies')).data,
    createCompany: async (name: string) => (await api.post<ShippingCompany>('/shipping/companies', { name })).data,
    deleteCompany: async (id: string) => (await api.delete(`/shipping/companies/${id}`)).data,
};
