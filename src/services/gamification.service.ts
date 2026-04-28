import { api } from '@/lib/api';
import {
    Badge, Streak, Mission, Reward,
    GamificationProgress, LeaderboardEntry
} from '@/types';

export const GamificationService = {
    getMyProgress: async () => (await api.get<GamificationProgress>('/gamification/my-progress')).data,
    getLeaderboard: async (range?: string, departmentId?: string) =>
        (await api.get<LeaderboardEntry[]>('/gamification/leaderboard', { params: { range, departmentId } })).data,

    getMyMissions: async () => (await api.get<Mission[]>('/gamification/missions/my')).data,
    getRewards: async () => (await api.get<Reward[]>('/gamification/rewards')).data,
    redeemReward: async (rewardId: string) => (await api.post('/gamification/rewards/redeem', { reward_id: rewardId })).data,

    // Manager endpoints
    getAllMissions: async () => {
        try {
            const token = localStorage.getItem('tms_access_token');
            const res = await api.get<Mission[]>('/gamification/missions/my', {
                headers: { Authorization: `Bearer ${token}` }
            });
            return res.data;
        } catch (err: any) {
            if (err.response?.status === 404 || err.status === 404 || err.message.includes('404')) {
                console.error('404 Not Found:', err.config?.url || '/gamification/missions/my');
                alert('Failed to fetch gamification data: 404 Not Found on missions endpoint');
            }
            throw err;
        }
    },
    createMission: async (data: any) => (await api.post('/gamification/missions', data)).data,
    assignMission: async (data: { missionId: string, userIds: string[] }) => (await api.post('/gamification/missions/assign', data)).data,
    getRedemptions: async () => (await api.get<any[]>('/gamification/rewards/redemptions')).data,
    approveRedemption: async (id: string, status: 'APPROVED' | 'REJECTED') => (await api.patch(`/gamification/rewards/redemptions/${id}`, { status })).data,

    startShift: async () => (await api.post('/gamification/actions/start-shift')).data,
    endShift: async () => (await api.post('/gamification/actions/end-shift')).data,
    submitDailyDone: async (data: { actual_units_by_hour: number[], notes?: string }) =>
        (await api.post('/gamification/actions/submit-daily-done', data)).data,
    reportIssue: async (data: { type: 'fatal' | 'non_fatal', reason: string, ref_type?: string, ref_id?: string }) =>
        (await api.post('/gamification/actions/report-issue', data)).data,
};
