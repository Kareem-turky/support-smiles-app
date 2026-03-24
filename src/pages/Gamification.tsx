import { useEffect, useState, useCallback } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge as UIBadge } from '@/components/ui/badge';
import {
    GamificationService
} from '@/services/gamification.service';
import {
    GamificationProgress, LeaderboardEntry, Mission,
    Reward, Streak, Department, Employee
} from '@/types';
import {
    Trophy, Award, Zap, Flame, Star,
    Play, Square, CheckCircle2,
    ChevronRight, Gift, Target, Clock,
    AlertTriangle, Settings, Plus, Users, Check, X
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { useAuth } from '@/contexts/useAuth';
import { HRService } from '@/services/hr';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogTrigger
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useTranslation } from 'react-i18next';

export default function Gamification() {
    const { toast } = useToast();
    const { user, hasRole } = useAuth();
    const { t } = useTranslation();
    const [progress, setProgress] = useState<GamificationProgress | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [missions, setMissions] = useState<Mission[]>([]);
    const [allMissions, setAllMissions] = useState<Mission[]>([]);
    const [rewards, setRewards] = useState<Reward[]>([]);
    const [redemptions, setRedemptions] = useState<any[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    // Mission form state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [newMission, setNewMission] = useState({
        title: '',
        description: '',
        points: 50,
        target_value: 10,
        metric_key: 'RESOLVED_TICKETS',
        frequency: 'DAILY',
        role_scope: 'ALL',
        department_id: 'none',
    });

    const isManager = user?.role?.includes('MANAGER') || user?.role === 'ADMIN';

    const fetchData = useCallback(async () => {
        try {
            const [prog, ld, miss, rew] = await Promise.all([
                GamificationService.getMyProgress(),
                GamificationService.getLeaderboard(),
                GamificationService.getMyMissions(),
                GamificationService.getRewards(),
            ]);
            setProgress(prog);
            setLeaderboard(ld);
            setMissions(miss);
            setRewards(rew);

            if (isManager) {
                const [allMiss, redemps, depts, emps] = await Promise.all([
                    GamificationService.getAllMissions(),
                    GamificationService.getRedemptions(),
                    HRService.getDepartments(),
                    HRService.getEmployees(),
                ]);
                setAllMissions(allMiss);
                setRedemptions(redemps);
                setDepartments(depts);
                setEmployees(emps);
            }
        } catch (err) {
            console.error(err);
            toast({ title: t('gamification_page.messages.error'), description: t('gamification_page.messages.fetch_failed'), variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    }, [isManager, t, toast]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleShiftAction = async (action: 'start' | 'end') => {
        setActionLoading(true);
        try {
            if (action === 'start') await GamificationService.startShift();
            else await GamificationService.endShift();

            toast({ title: t('gamification_page.messages.success'), description: action === 'start' ? t('gamification_page.messages.shift_started') : t('gamification_page.messages.shift_ended') });
            fetchData();
        } catch (err) {
            toast({ title: t('gamification_page.messages.error'), description: t('gamification_page.messages.action_failed'), variant: 'destructive' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleRedeem = async (rewardId: string) => {
        setActionLoading(true);
        try {
            await GamificationService.redeemReward(rewardId);
            toast({ title: t('gamification_page.messages.success'), description: t('gamification_page.messages.reward_requested') });
            fetchData();
        } catch (err: any) {
            toast({
                title: t('gamification_page.messages.redemption_failed'),
                description: err.response?.data?.message || t('gamification_page.messages.redemption_failed'),
                variant: 'destructive'
            });
        } finally {
            setActionLoading(false);
        }
    };

    const handleCreateMission = async () => {
        setActionLoading(true);
        try {
            const payload = { 
                ...newMission, 
                department_id: newMission.department_id === 'none' ? undefined : newMission.department_id,
                role_scope: newMission.role_scope === 'ALL' ? undefined : newMission.role_scope,
                assignments: [] 
            };
            await GamificationService.createMission(payload);
            toast({ title: t('gamification_page.messages.success'), description: t('gamification_page.messages.mission_created') });
            setIsCreateModalOpen(false);
            fetchData();
        } catch (err: any) {
            toast({ title: t('gamification_page.messages.error'), description: t('gamification_page.messages.mission_failed'), variant: 'destructive' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleApproveRedemption = async (id: string, status: 'APPROVED' | 'REJECTED') => {
        setActionLoading(true);
        try {
            await GamificationService.approveRedemption(id, status);
            toast({ title: t('gamification_page.messages.success'), description: status === 'APPROVED' ? t('gamification_page.messages.redemption_approved') : t('gamification_page.messages.redemption_rejected') });
            fetchData();
        } catch (err: any) {
            toast({ title: t('gamification_page.messages.error'), description: t('gamification_page.messages.action_failed'), variant: 'destructive' });
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) return (
        <AppLayout>
            <div className="flex items-center justify-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
        </AppLayout>
    );

    return (
        <AppLayout>
            <div className="space-y-6 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">{t('gamification_page.title')}</h1>
                        <p className="text-muted-foreground mt-1 text-lg">
                            {t('gamification_page.subtitle')}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={() => handleShiftAction('start')}
                            disabled={actionLoading}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            <Play className="h-4 w-4 mr-2" /> {t('gamification_page.buttons.start_shift')}
                        </Button>
                        <Button
                            onClick={() => handleShiftAction('end')}
                            disabled={actionLoading}
                            variant="destructive"
                        >
                            <Square className="h-4 w-4 mr-2" /> {t('gamification_page.buttons.end_shift')}
                        </Button>
                    </div>
                </div>

                <Tabs defaultValue="progress" className="space-y-6">
                    <TabsList className="bg-muted/50 p-1 rounded-xl h-auto flex flex-wrap gap-1 border">
                        <TabsTrigger value="progress" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm py-2 px-4 font-bold flex gap-2">
                            <Star className="h-4 w-4" /> {t('gamification_page.tabs.my_progress')}
                        </TabsTrigger>
                        <TabsTrigger value="missions" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm py-2 px-4 font-bold flex gap-2">
                            <Target className="h-4 w-4" /> {t('gamification_page.tabs.missions')}
                            {missions.filter(m => m.assignments.some(a => a.status === 'ACTIVE')).length > 0 && (
                                <UIBadge variant="destructive" className="ml-1 h-5 min-w-5 flex items-center justify-center p-0 text-[10px]">
                                    {missions.filter(m => m.assignments.some(a => a.status === 'ACTIVE')).length}
                                </UIBadge>
                            )}
                        </TabsTrigger>
                        <TabsTrigger value="rewards" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm py-2 px-4 font-bold flex gap-2">
                            <Gift className="h-4 w-4" /> {t('gamification_page.tabs.rewards')}
                        </TabsTrigger>
                        <TabsTrigger value="leaderboard" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm py-2 px-4 font-bold flex gap-2">
                            <Trophy className="h-4 w-4" /> {t('gamification_page.tabs.leaderboard')}
                        </TabsTrigger>
                        {isManager && (
                            <TabsTrigger value="manager" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm py-2 px-4 font-bold flex gap-2 border-l border-indigo-200 ml-auto">
                                <Settings className="h-4 w-4" /> {t('gamification_page.tabs.mission_control')}
                            </TabsTrigger>
                        )}
                    </TabsList>

                    <TabsContent value="progress" className="space-y-6">
                        {progress && (
                            <>
                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <Card className="lg:col-span-2 overflow-hidden border-none shadow-xl ring-1 ring-black/5">
                                        <div className="bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 text-white p-8">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-8">
                                                <div className="flex items-center gap-6">
                                                    <div className="h-24 w-24 rounded-2xl bg-white/20 flex items-center justify-center border-4 border-white/30 backdrop-blur-md shadow-2xl rotate-3">
                                                        <Star className="h-12 w-12 text-yellow-300 fill-yellow-300 animate-pulse" />
                                                    </div>
                                                    <div>
                                                        <p className="text-indigo-100 font-bold uppercase tracking-widest text-xs">{t('gamification_page.progress.current_prestige')}</p>
                                                        <h2 className="text-6xl font-black">{t('gamification_page.progress.rank', { level: progress.level })}</h2>
                                                    </div>
                                                </div>
                                                <div className="md:text-right">
                                                    <p className="text-indigo-100 font-bold uppercase tracking-widest text-xs">{t('gamification_page.progress.available_power')}</p>
                                                    <div className="flex items-center md:justify-end gap-3 mt-1">
                                                        <Zap className="h-10 w-10 text-yellow-300 fill-yellow-300" />
                                                        <span className="text-5xl font-black">{progress.points.toLocaleString()}</span>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="space-y-4">
                                                <div className="flex justify-between text-sm font-black uppercase tracking-tight">
                                                    <span className="text-indigo-100">{t('gamification_page.progress.level_prog')}</span>
                                                    <span>{t('gamification_page.progress.xp', { points: progress.points, next: progress.next_level_points })}</span>
                                                </div>
                                                <div className="h-5 bg-white/20 rounded-full p-1 ring-1 ring-white/30">
                                                    <div
                                                        className="h-full bg-gradient-to-r from-yellow-300 to-yellow-500 rounded-full shadow-lg relative transition-all duration-1000"
                                                        style={{ width: `${Math.min((progress.points / (progress.next_level_points || 1)) * 100, 100)}%` }}
                                                    >
                                                        <div className="absolute top-0 right-0 h-full w-2 bg-white/40 blur-[2px] animate-pulse" />
                                                    </div>
                                                </div>
                                                <p className="text-xs text-indigo-100 text-right font-bold italic">
                                                    {t('gamification_page.progress.more_xp', { more: Math.max(0, progress.next_level_points - progress.points), level: progress.level + 1 })}
                                                </p>
                                            </div>
                                        </div>
                                    </Card>

                                    <div className="grid grid-cols-1 gap-4">
                                        {progress.streaks.map((s) => (
                                            <Card key={s.key} className="bg-orange-500 text-white border-none shadow-lg relative overflow-hidden group">
                                                <div className="absolute top-[-20px] right-[-20px] opacity-10 group-hover:scale-110 transition-transform">
                                                    <Flame className="h-32 w-32" />
                                                </div>
                                                <CardContent className="p-6 relative z-10">
                                                    <div className="flex items-center gap-4">
                                                        <div className="bg-white/20 p-3 rounded-xl backdrop-blur-sm">
                                                            <Flame className="h-8 w-8 text-white fill-white animate-bounce" />
                                                        </div>
                                                        <div>
                                                            <p className="text-orange-100 text-xs font-black uppercase tracking-widest leading-none">{t('gamification_page.progress.streak', { key: s.key })}</p>
                                                            <div className="flex items-baseline gap-2">
                                                                <span className="text-5xl font-black">{s.current_count}</span>
                                                                <span className="text-orange-100 text-sm font-bold">{t('gamification_page.progress.days')}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="mt-4 pt-4 border-t border-white/20 flex justify-between items-end">
                                                        <div>
                                                            <p className="text-orange-100 text-[10px] font-bold uppercase">{t('gamification_page.progress.all_time_best')}</p>
                                                            <p className="font-black text-lg">{t('gamification_page.progress.days_count', { count: s.best_count })}</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <Clock className="h-4 w-4 inline-block mr-1 opacity-70" />
                                                            <span className="text-[10px] font-bold uppercase">{t('gamification_page.progress.last', { date: s.last_hit_date ? new Date(s.last_hit_date).toLocaleDateString() : t('gamification_page.progress.never') })}</span>
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                        {progress.streaks.length === 0 && (
                                            <Card className="bg-muted/50 border-dashed border-2 flex flex-col items-center justify-center p-8 text-center">
                                                <Clock className="h-10 w-10 text-muted-foreground mb-2" />
                                                <p className="font-bold text-muted-foreground uppercase text-xs tracking-widest">{t('gamification_page.progress.no_streaks')}</p>
                                                <p className="text-xs text-muted-foreground mt-1">{t('gamification_page.progress.no_streaks_desc')}</p>
                                            </Card>
                                        )}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                    <Card className="lg:col-span-1 shadow-md">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-tight">
                                                <Award className="h-6 w-6 text-indigo-600" />
                                                {t('gamification_page.progress.badge_armory')}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="grid grid-cols-3 gap-3">
                                                {progress.badges.map((badge) => (
                                                    <div key={badge.id} className="group relative bg-muted/40 rounded-2xl p-4 text-center hover:bg-muted/60 transition-all border shadow-sm flex flex-col items-center justify-center aspect-square">
                                                        <div className="text-4xl mb-2 group-hover:drop-shadow-[0_0_10px_rgba(79,70,229,0.4)] transition-all grayscale-[0.5] group-hover:grayscale-0">{badge.icon}</div>
                                                        <h4 className="text-[10px] font-black uppercase truncate w-full text-muted-foreground group-hover:text-indigo-600">{badge.name}</h4>
                                                        <div className="absolute inset-x-1 bottom-1 bg-indigo-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity p-2 text-[9px] font-bold leading-tight z-20 pointer-events-none text-center shadow-xl">
                                                            {badge.description}
                                                        </div>
                                                    </div>
                                                ))}
                                                {progress.badges.length === 0 && (
                                                    <div className="col-span-3 text-center py-10">
                                                        <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">{t('gamification_page.progress.no_badges')}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="lg:col-span-2 shadow-md">
                                        <CardHeader>
                                            <CardTitle className="flex items-center gap-2 text-xl font-black uppercase tracking-tight">
                                                <Clock className="h-6 w-6 text-indigo-600" />
                                                {t('gamification_page.progress.mission_log')}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4">
                                                {progress.history.slice(0, 6).map((item, idx) => (
                                                    <div key={idx} className="flex items-center justify-between p-3 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors border-l-4 border-indigo-600">
                                                        <div>
                                                            <p className="text-sm font-black text-foreground">{item.reason}</p>
                                                            <p className="text-[10px] text-muted-foreground font-bold uppercase mt-0.5">{new Date(item.created_at).toLocaleString()}</p>
                                                        </div>
                                                        <div className={`px-3 py-1 rounded-full font-black text-sm flex items-center gap-1 ${item.amount >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                                            {item.amount >= 0 ? '+' : ''}{item.amount}
                                                            <Zap className="h-3 w-3 fill-current" />
                                                        </div>
                                                    </div>
                                                ))}
                                                {progress.history.length === 0 && (
                                                    <p className="text-center text-muted-foreground py-10 font-bold uppercase text-[10px] tracking-widest">{t('gamification_page.progress.no_activity')}</p>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </>
                        )}
                    </TabsContent>

                    <TabsContent value="missions" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {missions.map(mission => {
                                const assignment = mission.assignments[0];
                                const isCompleted = assignment?.status === 'DONE';
                                const progressPct = Math.min(((assignment?.progress_value || 0) / mission.target_value) * 100, 100);

                                return (
                                    <Card key={mission.id} className={`overflow-hidden border-2 transition-all hover:shadow-lg ${isCompleted ? 'border-green-200 bg-green-50/20' : 'hover:border-indigo-200'}`}>
                                        <CardHeader className="pb-2">
                                            <div className="flex justify-between items-start mb-2">
                                                <UIBadge variant={isCompleted ? 'default' : 'secondary'} className={`${isCompleted ? 'bg-green-600' : ''} font-black uppercase text-[10px]`}>
                                                    {isCompleted ? t('gamification_page.missions_tab.cleared') : t('gamification_page.missions_tab.active')}
                                                </UIBadge>
                                                <div className="flex items-center gap-1 text-primary font-black">
                                                    <Zap className="h-4 w-4 fill-primary" />
                                                    {mission.points}
                                                </div>
                                            </div>
                                            <CardTitle className="text-xl font-black leading-tight group-hover:text-indigo-600 transition-colors">{mission.title}</CardTitle>
                                            <CardDescription className="text-xs font-medium text-muted-foreground leading-relaxed mt-1">{mission.description}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="space-y-4 pt-2">
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-[11px] font-black uppercase tracking-tight">
                                                    <span className="text-muted-foreground">{t('gamification_page.missions_tab.current_progress')}</span>
                                                    <span className={isCompleted ? 'text-green-600' : 'text-indigo-600'}>
                                                        {assignment?.progress_value || 0} / {mission.target_value}
                                                    </span>
                                                </div>
                                                <Progress value={progressPct} className={`h-2.5 ${isCompleted ? 'bg-green-100' : ''}`}>
                                                    <div className={isCompleted ? 'bg-green-600' : 'bg-indigo-600'} />
                                                </Progress>
                                            </div>

                                            {isCompleted && assignment?.completed_at && (
                                                <div className="flex items-center gap-2 text-[10px] font-black text-green-700 bg-green-100/50 p-2 rounded-lg justify-center uppercase tracking-widest">
                                                    <CheckCircle2 className="h-3 w-3" />
                                                    {t('gamification_page.missions_tab.achieved_on', { date: new Date(assignment.completed_at).toLocaleDateString() })}
                                                </div>
                                            )}
                                        </CardContent>
                                    </Card>
                                );
                            })}
                            {missions.length === 0 && (
                                <div className="col-span-full py-16 text-center border-2 border-dashed rounded-3xl bg-muted/20">
                                    <Target className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                                    <h3 className="text-xl font-black uppercase tracking-tighter">{t('gamification_page.missions_tab.no_missions')}</h3>
                                    <p className="text-muted-foreground text-sm font-medium">{t('gamification_page.missions_tab.no_missions_desc')}</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="rewards" className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {rewards.map(reward => {
                                const canAfford = (progress?.points || 0) >= reward.cost_points;

                                return (
                                    <Card key={reward.id} className="group relative overflow-hidden flex flex-col border-2 hover:border-indigo-600 transition-all shadow-md hover:shadow-2xl">
                                        <div className="h-2 bg-indigo-600" />
                                        <CardHeader>
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="p-2 rounded-xl bg-indigo-50 group-hover:scale-110 transition-transform">
                                                    <Gift className="h-6 w-6 text-indigo-600" />
                                                </div>
                                                <div className="flex items-center gap-1 font-black text-lg text-indigo-600">
                                                    <Zap className="h-4 w-4 fill-indigo-600" />
                                                    {reward.cost_points}
                                                </div>
                                            </div>
                                            <CardTitle className="text-lg font-black group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{reward.name}</CardTitle>
                                            <CardDescription className="text-xs font-medium min-h-[40px] leading-relaxed">{reward.description}</CardDescription>
                                        </CardHeader>
                                        <CardContent className="mt-auto pt-4 border-t">
                                            <Button
                                                className={`w-full font-black uppercase tracking-widest ${canAfford ? 'bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20' : ''}`}
                                                disabled={!canAfford || actionLoading}
                                                variant={canAfford ? 'default' : 'outline'}
                                                onClick={() => handleRedeem(reward.id)}
                                            >
                                                {canAfford ? t('gamification_page.rewards_tab.redeem') : t('gamification_page.rewards_tab.insufficient')}
                                                <ChevronRight className="h-4 w-4 ml-2" />
                                            </Button>
                                        </CardContent>
                                    </Card>
                                );
                            })}
                            {rewards.length === 0 && (
                                <div className="col-span-full py-16 text-center border-2 border-dashed rounded-3xl bg-muted/20">
                                    <Gift className="h-16 w-16 text-muted-foreground/30 mx-auto mb-4" />
                                    <h3 className="text-xl font-black uppercase tracking-tighter">{t('gamification_page.rewards_tab.empty')}</h3>
                                    <p className="text-muted-foreground text-sm font-medium">{t('gamification_page.rewards_tab.empty_desc')}</p>
                                </div>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="leaderboard">
                        <Card className="shadow-2xl border-none shadow-indigo-600/10">
                            {/* ... (Leaderboard content) */}
                        </Card>
                    </TabsContent>

                    {isManager && (
                        <TabsContent value="manager" className="space-y-6">
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <Card className="lg:col-span-2 shadow-md">
                                    <CardHeader className="flex flex-row items-center justify-between">
                                        <div>
                                            <CardTitle className="text-xl font-black uppercase tracking-tight">{t('gamification_page.manager.active_control')}</CardTitle>
                                            <CardDescription className="text-xs font-bold uppercase py-1">{t('gamification_page.manager.all_tactical')}</CardDescription>
                                        </div>
                                        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                                            <DialogTrigger asChild>
                                                <Button className="bg-indigo-600 hover:bg-indigo-700 font-black uppercase text-xs">
                                                    <Plus className="h-4 w-4 mr-2" /> {t('gamification_page.manager.launch')}
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-2xl">
                                                <DialogHeader>
                                                    <DialogTitle className="text-2xl font-black uppercase tracking-tighter">{t('gamification_page.manager.briefing')}</DialogTitle>
                                                    <DialogDescription>{t('gamification_page.manager.briefing_desc')}</DialogDescription>
                                                </DialogHeader>
                                                <div className="grid gap-6 py-4">
                                                    <div className="grid gap-2">
                                                        <Label className="font-black uppercase text-[10px] tracking-widest">{t('gamification_page.manager.form.title')}</Label>
                                                        <Input
                                                            placeholder={t('gamification_page.manager.form.title_placeholder')}
                                                            value={newMission.title}
                                                            onChange={e => setNewMission({ ...newMission, title: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="grid gap-2">
                                                        <Label className="font-black uppercase text-[10px] tracking-widest">{t('gamification_page.manager.form.desc')}</Label>
                                                        <Textarea
                                                            placeholder={t('gamification_page.manager.form.desc_placeholder')}
                                                            value={newMission.description}
                                                            onChange={e => setNewMission({ ...newMission, description: e.target.value })}
                                                        />
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="grid gap-2">
                                                            <Label className="font-black uppercase text-[10px] tracking-widest">{t('gamification_page.manager.form.metric')}</Label>
                                                            <Select value={newMission.metric_key} onValueChange={v => setNewMission({ ...newMission, metric_key: v })}>
                                                                <SelectTrigger>
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="RESOLVED_TICKETS">{t('gamification_page.manager.form.metrics.resolved')}</SelectItem>
                                                                    <SelectItem value="DAILY_SUBMISSION">{t('gamification_page.manager.form.metrics.daily')}</SelectItem>
                                                                    <SelectItem value="ON_TIME_ATTENDANCE">{t('gamification_page.manager.form.metrics.attendance')}</SelectItem>
                                                                    <SelectItem value="HIGH_KPI_SCORE">{t('gamification_page.manager.form.metrics.high_kpi')}</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <Label className="font-black uppercase text-[10px] tracking-widest">{t('gamification_page.manager.form.target')}</Label>
                                                            <Input
                                                                type="number"
                                                                value={newMission.target_value}
                                                                onChange={e => setNewMission({ ...newMission, target_value: parseInt(e.target.value) })}
                                                            />
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="grid gap-2">
                                                            <Label className="font-black uppercase text-[10px] tracking-widest">{t('gamification_page.manager.form.power')}</Label>
                                                            <Input
                                                                type="number"
                                                                value={newMission.points}
                                                                onChange={e => setNewMission({ ...newMission, points: parseInt(e.target.value) })}
                                                            />
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <Label className="font-black uppercase text-[10px] tracking-widest">{t('gamification_page.manager.form.frequency')}</Label>
                                                            <Select value={newMission.frequency} onValueChange={v => setNewMission({ ...newMission, frequency: v })}>
                                                                <SelectTrigger>
                                                                    <SelectValue />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="DAILY">{t('gamification_page.manager.form.frequencies.daily')}</SelectItem>
                                                                    <SelectItem value="WEEKLY">{t('gamification_page.manager.form.frequencies.weekly')}</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-4">
                                                        <div className="grid gap-2">
                                                            <Label className="font-black uppercase text-[10px] tracking-widest">{t('gamification_page.manager.form.scope')}</Label>
                                                            <Select value={newMission.role_scope} onValueChange={v => setNewMission({ ...newMission, role_scope: v })}>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder={t('gamification_page.manager.form.all_roles')} />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="ALL">{t('gamification_page.manager.form.scopes.universal')}</SelectItem>
                                                                    <SelectItem value="CS_AGENT">{t('gamification_page.manager.form.scopes.cs')}</SelectItem>
                                                                    <SelectItem value="ACC_AGENT">{t('gamification_page.manager.form.scopes.acc')}</SelectItem>
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <div className="grid gap-2">
                                                            <Label className="font-black uppercase text-[10px] tracking-widest">{t('gamification_page.manager.form.dept')}</Label>
                                                            <Select value={newMission.department_id} onValueChange={v => setNewMission({ ...newMission, department_id: v })}>
                                                                <SelectTrigger>
                                                                    <SelectValue placeholder={t('gamification_page.manager.form.all_depts')} />
                                                                </SelectTrigger>
                                                                <SelectContent>
                                                                    <SelectItem value="none">{t('gamification_page.manager.form.cross_dept')}</SelectItem>
                                                                    {departments.map(d => (
                                                                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                    </div>
                                                </div>
                                                <DialogFooter>
                                                    <Button variant="outline" onClick={() => setIsCreateModalOpen(false)}>{t('gamification_page.manager.form.abort')}</Button>
                                                    <Button onClick={handleCreateMission} disabled={actionLoading} className="bg-indigo-600">{t('gamification_page.manager.form.deploy')}</Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </CardHeader>
                                    <CardContent>
                                        <Table>
                                            <TableHeader>
                                                <TableRow>
                                                    <TableHead className="font-black uppercase text-[10px]">{t('gamification_page.manager.table.objective')}</TableHead>
                                                    <TableHead className="font-black uppercase text-[10px]">{t('gamification_page.manager.table.scope')}</TableHead>
                                                    <TableHead className="font-black uppercase text-[10px]">{t('gamification_page.manager.table.target')}</TableHead>
                                                    <TableHead className="font-black uppercase text-[10px]">{t('gamification_page.manager.table.reward')}</TableHead>
                                                </TableRow>
                                            </TableHeader>
                                            <TableBody>
                                                {allMissions.map(m => (
                                                    <TableRow key={m.id}>
                                                        <TableCell>
                                                            <p className="font-black text-xs">{m.title}</p>
                                                            <p className="text-[10px] text-muted-foreground">{(m as any).frequency}</p>
                                                        </TableCell>
                                                        <TableCell className="text-[10px] font-bold uppercase">
                                                            {(m as any).department?.name || (m as any).role_scope || t('gamification_page.manager.table.global')}
                                                        </TableCell>
                                                        <TableCell className="text-[10px] font-bold">
                                                            {m.target_value} {m.metric_key}
                                                        </TableCell>
                                                        <TableCell>
                                                            <div className="flex items-center gap-1 font-black text-xs text-indigo-600">
                                                                <Zap className="h-3 w-3 fill-indigo-600" />
                                                                {m.points}
                                                            </div>
                                                        </TableCell>
                                                    </TableRow>
                                                ))}
                                            </TableBody>
                                        </Table>
                                    </CardContent>
                                </Card>

                                <Card className="shadow-md">
                                    <CardHeader>
                                        <CardTitle className="text-xl font-black uppercase tracking-tight">{t('gamification_page.manager.supply.title')}</CardTitle>
                                        <CardDescription className="text-xs font-bold uppercase py-1">{t('gamification_page.manager.supply.subtitle')}</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            {redemptions.filter(r => r.status === 'REQUESTED').map(r => (
                                                <div key={r.id} className="p-4 rounded-xl border bg-muted/20 space-y-3">
                                                    <div className="flex justify-between items-start">
                                                        <div>
                                                            <p className="font-black text-sm">{r.reward?.name}</p>
                                                            <p className="text-[10px] font-bold text-muted-foreground">{t('gamification_page.manager.supply.requested_by', { name: r.user?.name })}</p>
                                                        </div>
                                                        <div className="flex items-center gap-1 font-black text-xs text-indigo-600">
                                                            <Zap className="h-3 w-3 fill-indigo-600" />
                                                            {r.reward?.cost_points}
                                                        </div>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            size="sm"
                                                            className="flex-1 bg-green-600 h-8 text-[10px] font-black uppercase"
                                                            onClick={() => handleApproveRedemption(r.id, 'APPROVED')}
                                                            disabled={actionLoading}
                                                        >
                                                            <Check className="h-3 w-3 mr-1" /> {t('gamification_page.manager.supply.approve')}
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="flex-1 border-red-200 text-red-600 hover:bg-red-50 h-8 text-[10px] font-black uppercase"
                                                            onClick={() => handleApproveRedemption(r.id, 'REJECTED')}
                                                            disabled={actionLoading}
                                                        >
                                                            <X className="h-3 w-3 mr-1" /> {t('gamification_page.manager.supply.deny')}
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}
                                            {redemptions.filter(r => r.status === 'REQUESTED').length === 0 && (
                                                <div className="text-center py-10">
                                                    <CheckCircle2 className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
                                                    <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{t('gamification_page.manager.supply.no_requests')}</p>
                                                </div>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        </TabsContent>
                    )}
                </Tabs>
            </div>
        </AppLayout>
    );
}
