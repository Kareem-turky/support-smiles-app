import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPIService, KPIMetrics } from '@/services/kpi.service';
import { GamificationService, GamificationProgress } from '@/services/gamification.service';
import { Award, Zap, Target, Star, Flame } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import {
    RadialBarChart,
    RadialBar,
    Legend,
    ResponsiveContainer,
    Tooltip,
} from 'recharts';

export function EmployeeDashboard() {
    const [metrics, setMetrics] = useState<KPIMetrics | null>(null);
    const [gamification, setGamification] = useState<GamificationProgress | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [metricsRes, gameRes] = await Promise.all([
                    KPIService.getMyStats(),
                    GamificationService.getMyProgress(),
                ]);
                setMetrics(metricsRes);
                setGamification(gameRes);
            } catch (error) {
                console.error('Failed to load dashboard data', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div>Loading statistics...</div>;

    // Map backend metrics to chart data
    const chartData = metrics?.metrics.map(m => ({
        name: m.name,
        value: m.score, // Use score (0-100+)
        fill: m.score >= 100 ? '#82ca9d' : m.score >= 80 ? '#8884d8' : '#ffc658',
    })) || [];

    return (
        <div className="space-y-6">
            {/* Gamification Header */}
            {gamification && (
                <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-none">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-blue-100 font-medium mb-1">Current Level</p>
                                <h2 className="text-4xl font-bold flex items-center gap-2">
                                    <Star className="fill-yellow-400 text-yellow-400" />
                                    Level {gamification.level}
                                </h2>
                                <div className="mt-4 flex items-center gap-4">
                                    <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
                                        <Zap className="h-4 w-4 text-yellow-300" />
                                        <span className="font-bold">{gamification.points} Points</span>
                                    </div>
                                    <div className="flex items-center gap-1 bg-white/20 px-3 py-1 rounded-full">
                                        <Flame className="h-4 w-4 text-orange-400" />
                                        <span className="font-bold">{gamification.streak_days} Day Streak</span>
                                    </div>
                                </div>
                            </div>
                            <div className="w-1/3">
                                <div className="flex justify-between text-sm mb-2 text-blue-100">
                                    <span>Progress to Level {gamification.level + 1}</span>
                                    <span>{gamification.next_level_points - gamification.points} needed</span>
                                </div>
                                <Progress value={(gamification.points / gamification.next_level_points) * 100} className="h-3 bg-white/30" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* KPI Chart */}
                <Card className="col-span-1 lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Performance Metrics ({metrics?.period})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[300px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <RadialBarChart cx="50%" cy="50%" innerRadius="10%" outerRadius="80%" barSize={20} data={chartData}>
                                    <RadialBar
                                        label={{ position: 'insideStart', fill: '#fff' }}
                                        background
                                        dataKey="value"
                                    />
                                    <Legend iconSize={10} layout="vertical" verticalAlign="middle" wrapperStyle={{ right: 0 }} />
                                    <Tooltip />
                                </RadialBarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Stats Cards */}
                <div className="space-y-6">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Final Score</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-4xl font-bold text-primary">{metrics?.final_score || 0}</div>
                            <p className="text-xs text-muted-foreground">Target: 100</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-muted-foreground">Total Deductions</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-3xl font-bold text-red-600">-{metrics?.total_deductions.toFixed(2) || 0}</div>
                            <p className="text-xs text-muted-foreground">{metrics?.issues.length || 0} Issues Logged</p>
                        </CardContent>
                    </Card>
                    {/* Issues List */}
                    <Card className="overflow-hidden">
                        <CardHeader className="pb-2 bg-muted/50">
                            <CardTitle className="text-sm font-medium">Recent Issues</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="max-h-[150px] overflow-y-auto">
                                {metrics?.issues.map((issue, i) => (
                                    <div key={i} className="p-3 border-b last:border-0 text-sm flex justify-between">
                                        <span>{issue.type}</span>
                                        <span className="text-red-600 font-bold">-{issue.deduction}</span>
                                    </div>
                                ))}
                                {(!metrics?.issues || metrics.issues.length === 0) && (
                                    <div className="p-4 text-center text-muted-foreground text-xs">No issues this period.</div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Badges */}
            <h3 className="text-xl font-semibold flex items-center gap-2">
                <Award className="h-5 w-5" /> Recent Badges
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {gamification?.badges?.length === 0 ? (
                    <p className="text-muted-foreground col-span-4">No badges earned yet. Keep up the good work!</p>
                ) : (
                    gamification?.badges.map((badge) => (
                        <Card key={badge.id} className="text-center p-4 hover:shadow-md transition-shadow">
                            <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-3 text-2xl">
                                {badge.icon}
                            </div>
                            <h4 className="font-bold">{badge.name}</h4>
                            <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
                        </Card>
                    ))
                )}
            </div>
        </div>
    );
}
