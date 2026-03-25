import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPIService, TeamStats } from '@/services/kpi.service';
import { GamificationService } from '@/services/gamification.service';
import { LeaderboardEntry } from '@/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Trophy, Users, AlertTriangle, FileText, Target, Activity } from 'lucide-react';
import { AccountingService, ReviewDeduction } from '@/services/accounting';
import { useTranslation } from 'react-i18next';

export function ManagerDashboard() {
    const { t } = useTranslation();
    const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [pendingReviews, setPendingReviews] = useState<ReviewDeduction[]>([]);
    const [targets, setTargets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState(new Date().toISOString().slice(0, 7));

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const [teamRes, lbRes, reviewRes, targetsRes] = await Promise.all([
                    KPIService.getTeamStats(period),
                    GamificationService.getLeaderboard(),
                    AccountingService.getReviewDeductions(),
                    KPIService.getTeamTargets()
                ]);
                setTeamStats(teamRes);
                setLeaderboard(Array.isArray(lbRes) ? lbRes : []);
                setPendingReviews(Array.isArray(reviewRes) ? reviewRes.filter(r => r.status === 'REVIEW_NEEDED') : []);
                setTargets(Array.isArray(targetsRes) ? targetsRes : []);
            } catch (error) {
                console.error('Failed to load manager dashboard', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [period]);

    if (loading) return <div>Loading team data...</div>;

    return (
        <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.stats.tickets_resolved')}</CardTitle>
                        <div className="p-2 bg-primary/10 rounded-full">
                            <Users className="h-4 w-4 text-primary" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{teamStats?.total_tickets || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1">Across entire team</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">{t('dashboard.stats.avg_response')}</CardTitle>
                        <div className="p-2 bg-blue-500/10 rounded-full">
                            <Activity className="h-4 w-4 text-blue-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold">{teamStats?.avg_response_time?.toFixed(1) || 0}h</div>
                        <p className="text-xs text-muted-foreground mt-1">Average resolving time</p>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-md transition-shadow focus-within:ring-2 focus-within:ring-destructive">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">Open Issues</CardTitle>
                        <div className="p-2 bg-red-500/10 rounded-full">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-red-600">{teamStats?.open_issues || 0}</div>
                        <p className="text-xs text-muted-foreground mt-1 whitespace-nowrap overflow-hidden text-ellipsis">Active unresolved problems</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Team Performance */}
                <Card className="col-span-1 border-t-4 border-t-primary shadow-sm bg-card/50 backdrop-blur-sm">
                    <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Users className="h-5 w-5 text-primary" />
                            Team Performance
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <label className="text-xs text-muted-foreground font-medium">Month:</label>
                            <input
                                type="month"
                                value={period}
                                onChange={(e) => setPeriod(e.target.value)}
                                className="text-xs bg-muted p-1 rounded border border-input focus:outline-none focus:ring-1 focus:ring-primary"
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="grid gap-6 pt-6">
                        {(teamStats?.member_performance || []).map((member: any) => (
                            <div key={member.id} className="flex items-center justify-between group hover:bg-muted/50 p-2 rounded-lg transition-colors -mx-2">
                                <div className="flex items-center space-x-4">
                                    <Avatar className="h-10 w-10 border-2 border-background shadow-sm group-hover:scale-105 transition-transform">
                                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.name || 'User'}&backgroundColor=0f172a,334155,0284c7`} alt={member.name || 'User'} />
                                        <AvatarFallback>{member.name ? member.name.substring(0, 2).toUpperCase() : 'U'}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-bold leading-none">{member.name}</p>
                                        <div className="flex items-center gap-2 mt-1.5 line-clamp-1">
                                            <span className="text-xs font-medium bg-muted px-2 py-0.5 rounded-full">{member.score}% Score</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex flex-col items-end gap-2 w-[120px]">
                                    <Badge variant={member.score >= 90 ? 'default' : member.score >= 70 ? 'secondary' : 'destructive'}
                                        className={`w-fit shadow-xs ${member.score >= 90 ? 'bg-green-500 hover:bg-green-600' : ''}`}>
                                        {member.score >= 90 ? 'Excellent' : member.score >= 70 ? 'Good' : 'Needs Impr.'}
                                    </Badge>
                                    <Progress value={member.score} className="h-1.5 w-full bg-muted/50" />
                                </div>
                            </div>
                        ))}
                        {(!teamStats?.member_performance || teamStats.member_performance.length === 0) && (
                            <div className="flex flex-col items-center justify-center py-8 text-center text-muted-foreground">
                                <Users className="h-8 w-8 mb-2 opacity-20" />
                                <p className="text-sm">No team data available.</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Leaderboard */}
                <Card className="col-span-1 border-t-4 border-t-yellow-400 shadow-sm bg-card/50 backdrop-blur-sm">
                    <CardHeader className="pb-3 border-b">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-yellow-500" />
                            Gamification Leaderboard
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-6">
                        <Table>
                            <TableHeader className="bg-muted/50">
                                <TableRow>
                                    <TableHead className="w-[60px] text-center rounded-tl-lg">Rank</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead className="text-right rounded-tr-lg">Points</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(leaderboard || []).map((entry: any, index: number) => (
                                    <TableRow key={entry.user_id} className={`hover:bg-muted/50 ${index < 3 ? 'font-medium' : ''}`}>
                                        <TableCell className="text-center">
                                            {index === 0 ? (
                                                <div className="bg-yellow-100 text-yellow-700 w-8 h-8 rounded-full flex items-center justify-center mx-auto text-lg shadow-sm border border-yellow-200">🥇</div>
                                            ) : index === 1 ? (
                                                <div className="bg-slate-100 text-slate-700 w-8 h-8 rounded-full flex items-center justify-center mx-auto text-lg shadow-sm border border-slate-200">🥈</div>
                                            ) : index === 2 ? (
                                                <div className="bg-orange-100 text-orange-800 w-8 h-8 rounded-full flex items-center justify-center mx-auto text-lg shadow-sm border border-orange-200">🥉</div>
                                            ) : (
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center mx-auto text-sm text-muted-foreground bg-secondary/50">{entry.rank}</div>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${entry.name || 'User'}&backgroundColor=0f172a`} />
                                                    <AvatarFallback>{entry.name ? entry.name[0].toUpperCase() : 'U'}</AvatarFallback>
                                                </Avatar>
                                                <span>{entry.name}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <Badge variant="secondary" className="font-mono bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400 border-none">
                                                {entry.points.toLocaleString()} XP
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* Pending Reviews */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5 text-blue-500" />
                        Pending Accounting Reviews
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {!pendingReviews || pendingReviews.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No pending deductions waiting for Accounting approval.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Reason</TableHead>
                                    <TableHead>Suggested Amount</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(pendingReviews || []).map((review: any) => (
                                    <TableRow key={review.id}>
                                        <TableCell>{review.employee?.full_name}</TableCell>
                                        <TableCell>{review.reason_key}</TableCell>
                                        <TableCell>${Number(review.suggested_amount).toFixed(2)}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 border-none">
                                                AWAITING APPROVAL
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Team Targets */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Target className="h-5 w-5 text-indigo-500" />
                        Active Team Targets
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {!targets || targets.length === 0 ? (
                        <p className="text-muted-foreground text-sm">No targets set for your team yet.</p>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Metric</TableHead>
                                    <TableHead>Target Value</TableHead>
                                    <TableHead>Weight</TableHead>
                                    <TableHead>Target Month</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {(targets || []).map((t: any) => (
                                    <TableRow key={t.id}>
                                        <TableCell className="font-medium">{t.employee?.full_name}</TableCell>
                                        <TableCell>{t.metric_name}</TableCell>
                                        <TableCell>{Number(t.target_value).toLocaleString()}</TableCell>
                                        <TableCell>{t.weight}%</TableCell>
                                        <TableCell>{t.date && !isNaN(new Date(t.date).getTime()) ? new Date(t.date).toISOString().slice(0, 7) : 'N/A'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
