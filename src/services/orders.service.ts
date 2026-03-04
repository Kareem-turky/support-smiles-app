import { api } from '@/lib/api';
import { Order } from '@/types';

export class OrdersService {
    static async getOrders(filters: any = {}): Promise<Order[]> {
        const params = new URLSearchParams(filters).toString();
        const response = await api.get(`/orders?${params}`);
        return response.data;
    }

    static async getOrder(id: string): Promise<Order> {
        const response = await api.get(`/orders/${id}`);
        return response.data;
    }

    static async createOrder(data: any): Promise<Order> {
        const response = await api.post('/orders', data);
        return response.data;
    }

    static async updateOrder(id: string, data: any): Promise<Order> {
        const response = await api.patch(`/orders/${id}`, data);
        return response.data;
    }
}
