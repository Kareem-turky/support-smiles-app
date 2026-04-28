import { api } from '@/lib/api';

export interface KPIMetrics {
    period: string;
    metrics: {
        name: string;
        target: number;
        actual: number;
        score: number;
        weight: number;
        frequency: string;
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
        id: string;
        name: string;
        role: string;
        score: number;
        issuesCount: number;
        status: 'AT_RISK' | 'ON_TRACK';
    }[];
}

export interface TeamTargetResponse {
    target: {
        id: string;
        employee_id: string;
        metric_key: string;
        metric_label: string;
        frequency: string;
        target_value: number;
        weight: number;
        is_active: boolean;
    };
    employee: {
        id: string;
        full_name: string;
        code: string;
        role: string;
        department: { id: string; name: string };
    };
    period_key: string;
    actual_value: number;
    progress_percent: number;
    deficit: number;
    overage: number;
    status: 'ON_TRACK' | 'AT_RISK' | 'EXCEEDED';
}

export const KPIService = {
    getMyStats: async (query?: { period?: string; frequency?: string }) => {
        const params = new URLSearchParams();
        if (query?.period) params.append('period', query.period);
        if (query?.frequency) params.append('frequency', query.frequency);
        return (await api.get<KPIMetrics>(`/kpi/my-stats?${params.toString()}`)).data;
    },
    getTeamStats: async (period?: string, frequency?: string) => (await api.get<TeamStats>(`/kpi/team-stats?period=${period || ''}&frequency=${frequency || 'DAILY'}`)).data,
    getTeamTargets: async (query?: { period?: string; frequency?: string }) => {
        const params = new URLSearchParams();
        if (query?.period) params.append('period', query.period);
        if (query?.frequency) params.append('frequency', query.frequency);
        return (await api.get<TeamTargetResponse[]>(`/kpi/team-active-targets?${params.toString()}`)).data;
    },
    createTarget: async (data: { employeeId: string, metric_key: string, metric_label?: string, target_value: number, frequency: string, weight?: number, date?: string }) =>
        (await api.post('/kpi/targets', data)).data,
    updateTarget: async (id: string, data: any) =>
        (await api.patch(`/kpi/targets/${id}`, data)).data,
    logActual: async (data: { employee_id: string, metric_key: string, frequency: string, period_key: string, delta_value: number }) =>
        (await api.post('/kpi/actuals/log', data)).data,
    updateActual: async (id: string, data: { actual_value: number }) =>
        (await api.patch(`/kpi/actuals/${id}`, data)).data,
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
