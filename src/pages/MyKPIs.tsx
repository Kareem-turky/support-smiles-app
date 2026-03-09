import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { EmployeeDashboard } from '@/components/dashboard/EmployeeDashboard';
import { useAuth } from '@/contexts/useAuth';
import { EntityModal } from '@/components/shared/EntityModal';
import { KPIService, KpiMetric } from '@/services/kpi.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle } from 'lucide-react';

export default function MyKPIs() {
    const { user } = useAuth();
    const { toast } = useToast();

    // Modals
    const [actualOpened, setActualOpened] = useState(false);
    const [loading, setLoading] = useState(false);
    const [actualForm, setActualForm] = useState({ metricName: '', actualValue: '' });

    const [kpiMetrics, setKpiMetrics] = useState<KpiMetric[]>([]);
    const [metricsLoading, setMetricsLoading] = useState(false);

    const hasMetrics = kpiMetrics.length > 0;

    useEffect(() => {
        if (actualOpened && !hasMetrics && !metricsLoading) {
            setMetricsLoading(true);
            KPIService.getMetrics(true)
                .then(res => setKpiMetrics(res))
                .catch(err => console.error("Failed to fetch metrics", err))
                .finally(() => setMetricsLoading(false));
        }
    }, [actualOpened, hasMetrics, metricsLoading]);

    const [refreshKey, setRefreshKey] = useState(0);
    const reloadDashboard = () => setRefreshKey(prev => prev + 1);

    const handleLogActual = async (e: React.FormEvent) => {
        setLoading(true);
        try {
            await KPIService.logActual({
                employeeId: (user as any)?.employee?.id || user?.id || '',
                metric: actualForm.metricName,
                periodKey: new Date().toISOString().split('T')[0],
                actualValue: Number(actualForm.actualValue)
            });
            toast({ title: 'Success', description: 'Actual logged.' });
            setActualOpened(false);
            reloadDashboard();
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">My Performance</h1>
                        <p className="text-muted-foreground mt-1">
                            Detailed KPI breakdown and score history for {user?.name}
                        </p>
                    </div>
                    {['WH_MANAGER', 'WH_AGENT', 'CS_AGENT'].includes(user?.role as string) && (
                        <Button onClick={() => setActualOpened(true)} variant="outline">
                            <PlusCircle className="w-4 h-4 mr-2" /> Log Daily Actual
                        </Button>
                    )}
                </div>
                <EmployeeDashboard key={refreshKey} />

                {/* Actual Modal */}
                <EntityModal open={actualOpened} onOpenChange={setActualOpened} title="Log KPI Actual" onSubmit={handleLogActual} loading={loading}>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Metric Name</Label>
                            <Select value={actualForm.metricName} onValueChange={v => setActualForm({ ...actualForm, metricName: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select a preset metric" />
                                </SelectTrigger>
                                <SelectContent>
                                    {kpiMetrics.map(m => (
                                        <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                                    ))}
                                    {kpiMetrics.length === 0 && <SelectItem value="none" disabled>No active metrics. Ask Admin to create some.</SelectItem>}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Actual Value Achieved</Label>
                            <Input required type="number" value={actualForm.actualValue} onChange={e => setActualForm({ ...actualForm, actualValue: e.target.value })} />
                        </div>
                    </div>
                </EntityModal>
            </div>
        </AppLayout>
    );
}
