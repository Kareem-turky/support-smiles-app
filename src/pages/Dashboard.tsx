import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ticketsService } from '@/services/tickets.service';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Ticket, CheckCircle, Clock, AlertTriangle, TrendingUp, Users } from 'lucide-react';
import { STATUS_LABELS, PRIORITY_LABELS } from '@/types';

interface DashboardStats {
  total: number;
  byStatus: Record<string, number>;
  byPriority: Record<string, number>;
  resolvedThisWeek: number;
  avgResolutionTime: number;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const result = await ticketsService.getStats();
      if (result.success && result.data) {
        setStats(result.data);
      }
      setIsLoading(false);
    };
    fetchStats();
  }, []);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  const openTickets = stats ? 
    (stats.byStatus['NEW'] || 0) + 
    (stats.byStatus['ASSIGNED'] || 0) + 
    (stats.byStatus['IN_PROGRESS'] || 0) + 
    (stats.byStatus['WAITING'] || 0) + 
    (stats.byStatus['REOPENED'] || 0) : 0;

  const urgentCount = stats?.byPriority['URGENT'] || 0;
  const highCount = stats?.byPriority['HIGH'] || 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.name}</h1>
          <p className="text-muted-foreground mt-1">
            Here's an overview of your ticket management system
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
              <Ticket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.total || 0}</div>
              <p className="text-xs text-muted-foreground">
                All tickets in the system
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{openTickets}</div>
              <p className="text-xs text-muted-foreground">
                Requiring attention
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Resolved This Week</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats?.resolvedThisWeek || 0}</div>
              <p className="text-xs text-muted-foreground">
                Successfully resolved
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Urgent & High</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{urgentCount + highCount}</div>
              <p className="text-xs text-muted-foreground">
                High priority tickets
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tickets by Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats?.byStatus || {}).map(([status, count]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {STATUS_LABELS[status as keyof typeof STATUS_LABELS] || status}
                    </span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
                {Object.keys(stats?.byStatus || {}).length === 0 && (
                  <p className="text-sm text-muted-foreground">No tickets yet</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Tickets by Priority</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {Object.entries(stats?.byPriority || {}).map(([priority, count]) => (
                  <div key={priority} className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      {PRIORITY_LABELS[priority as keyof typeof PRIORITY_LABELS] || priority}
                    </span>
                    <span className="font-medium">{count}</span>
                  </div>
                ))}
                {Object.keys(stats?.byPriority || {}).length === 0 && (
                  <p className="text-sm text-muted-foreground">No tickets yet</p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {stats && stats.avgResolutionTime > 0 && (
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg">Performance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.avgResolutionTime} hours</div>
              <p className="text-sm text-muted-foreground">
                Average ticket resolution time
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
