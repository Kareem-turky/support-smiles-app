import { api } from '@/lib/api';
import { Vendor } from './accounting';

export interface ShippingCompany {
    id: string;
    name: string;
    is_active: boolean;
}

export interface Order {
    id: string;
    order_number: string;
    customer_name: string;
    shipping_company_id?: string;
    shipping_company?: ShippingCompany;
    status: string;
    created_at: string;
}

export const ShippingService = {
    getCompanies: async () => (await api.get<ShippingCompany[]>('/shipping/companies')).data,
    createCompany: async (name: string) => (await api.post<ShippingCompany>('/shipping/companies', { name })).data,
};

export const OrdersService = {
    getOrders: async () => (await api.get<Order[]>('/orders')).data,
    createOrder: async (data: any) => (await api.post<Order>('/orders', data)).data,
};
