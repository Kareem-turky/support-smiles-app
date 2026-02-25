import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { KPIService, TeamStats } from '@/services/kpi.service';
import { GamificationService, LeaderboardEntry } from '@/services/gamification.service';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Trophy, Users, AlertTriangle } from 'lucide-react';

export function ManagerDashboard() {
    const [teamStats, setTeamStats] = useState<TeamStats | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [teamRes, lbRes] = await Promise.all([
                    KPIService.getTeamStats(),
                    GamificationService.getLeaderboard(),
                ]);
                setTeamStats(teamRes);
                setLeaderboard(lbRes);
            } catch (error) {
                console.error('Failed to load manager dashboard', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div>Loading team data...</div>;

    return (
        <div className="space-y-6">
            {/* Overview Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Team Tickets</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{teamStats?.total_tickets || 0}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{teamStats?.avg_response_time.toFixed(1) || 0}h</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Open Issues</CardTitle>
                        <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-red-600">{teamStats?.open_issues || 0}</div>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                {/* Team Performance */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle>Team Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Member</TableHead>
                                    <TableHead>Score</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {teamStats?.member_performance.map((member) => (
                                    <TableRow key={member.user_id}>
                                        <TableCell className="font-medium">{member.name}</TableCell>
                                        <TableCell>{member.score}</TableCell>
                                        <TableCell>
                                            <Badge variant={member.score >= 90 ? 'default' : member.score >= 70 ? 'secondary' : 'destructive'}>
                                                {member.score >= 90 ? 'Excellent' : member.score >= 70 ? 'Good' : 'Needs Impr.'}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Leaderboard */}
                <Card className="col-span-1">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Trophy className="h-5 w-5 text-yellow-500" />
                            Gamification Leaderboard
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[50px]">Rank</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead className="text-right">Points</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {leaderboard.map((entry, index) => (
                                    <TableRow key={entry.user_id}>
                                        <TableCell className="font-bold">
                                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : entry.rank}
                                        </TableCell>
                                        <TableCell>{entry.name}</TableCell>
                                        <TableCell className="text-right font-mono">{entry.points.toLocaleString()}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
