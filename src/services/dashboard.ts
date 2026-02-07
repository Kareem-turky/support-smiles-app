import { api } from '@/lib/api';

export const DashboardService = {
    getSummary: async (from?: string, to?: string) => {
        return (await api.get<DashboardSummary>('/dashboard/summary', { params: { from, to } })).data;
    }
};

export interface DashboardSummary {
    period: { from: string; to: string };
    financials: {
        deposits_total: number;
        purchases_total: number;
        expenses_total: number;
        payroll_total: number;
        transfers_total: number;
        hr_bonus_total: number;
        hr_deduction_total: number;
        net_profit_loss: number;
    };
    counts: {
        tickets_open: number;
        orders_pending: number;
        employees_active: number;
    };
    recent: {
        purchases: any[];
        expenses: any[];
        deposits: any[];
    };
}
