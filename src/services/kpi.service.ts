import { api } from '@/lib/api';

export interface KPIMetrics {
    period: string;
    metrics: {
        name: string;
        target: number;
        actual: number;
        score: number;
        weight: number;
    }[];
    issues: {
        type: string;
        deduction: number;
        date: string;
    }[];
    final_score: number;
    total_deductions: number;

    // Compat helpers (optional, or we update UI)
    efficiency?: number;
    quality?: number;
    attendance?: number;
    tickets_resolved?: number;
    avg_resolution_time?: number;
}

export interface KPIIssue {
    id: string;
    type: string;
    description: string;
    severity: string;
    created_at: string;
}

export interface TeamStats {
    total_tickets: number;
    avg_response_time: number;
    open_issues: number;
    member_performance: {
        user_id: string;
        name: string;
        score: number;
    }[];
}

export const KPIService = {
    getMyStats: async () => (await api.get<KPIMetrics>('/kpi/my-stats')).data,
    getTeamStats: async () => (await api.get<TeamStats>('/kpi/team-stats')).data,
    createTarget: async (data: { role?: string, userId?: string, metricName: string, targetValue: number, period: string, weight: number }) =>
        (await api.post('/kpi/targets', data)).data,
    logActual: async (data: { userId: string, metricName: string, periodKey: string, actualValue: number }) =>
        (await api.post('/kpi/actuals', data)).data,
    logIssue: async (data: { employeeId: string, type: string, description: string, severity: string, deductionPoints: number, date: string }) =>
        (await api.post('/kpi/issues', data)).data,
    calculateDaily: async (data: { employeeId: string, date: string }) =>
        (await api.post('/kpi/calculate-daily', data)).data,
};
