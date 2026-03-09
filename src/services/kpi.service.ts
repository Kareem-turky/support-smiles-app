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
    scoreTrend?: { date: string, score: number }[];
    gamificationBadges?: { name: string, icon: string, earned_at: string }[];

    // Compat helpers (optional, or we update UI)
    efficiency?: number;
    quality?: number;
    attendance?: number;
    tickets_resolved?: number;
    avg_resolution_time?: number;
}

export interface KpiMetric {
    id: string;
    name: string;
    is_active: boolean;
    created_at: string;
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
    getTeamTargets: async () => (await api.get<any[]>('/kpi/targets/team')).data,
    createTarget: async (data: { employeeId: string, metric: string, targetValue: number, date?: string, weight?: number }) =>
        (await api.post('/kpi/targets', data)).data,
    logActual: async (data: { employeeId: string, metric: string, periodKey?: string, actualValue: number, date?: string }) =>
        (await api.post('/kpi/actuals', data)).data,
    createIssue: async (data: { employeeId: string; type: string; severity?: string; description?: string }) =>
        (await api.post('/kpi/issues', data)).data,
    logIssue: async (data: { employeeId: string, type: string, description: string, severity: string, deductionPoints: number, date: string }) =>
        (await api.post('/kpi/issues', data)).data,
    calculateDaily: async (data: { employeeId: string, date: string }) =>
        (await api.post('/kpi/calculate-daily', data)).data,

    // --- Admin Metrics ---
    getMetrics: async (activeOnly = false) =>
        (await api.get<KpiMetric[]>(`/kpi/metrics${activeOnly ? '?activeOnly=true' : ''}`)).data,
    createMetric: async (name: string) =>
        (await api.post<KpiMetric>('/kpi/metrics', { name })).data,
    toggleMetric: async (id: string, is_active: boolean) =>
        (await api.patch<KpiMetric>(`/kpi/metrics/${id}`, { is_active })).data,
    deleteMetric: async (id: string) =>
        (await api.delete(`/kpi/metrics/${id}`)).data,
};
