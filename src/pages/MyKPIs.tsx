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
    const [actualForm, setActualForm] = useState({ 
        metric_key: '', 
        frequency: 'DAILY', 
        period_key: new Date().toISOString().slice(0, 10), 
        delta_value: '' 
    });

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
        if (!actualForm.metric_key) {
            toast({ title: 'Validation Error', description: 'Please select a metric.', variant: 'destructive' });
            return;
        }
        setLoading(true);
        try {
            await KPIService.logActual({
                employee_id: (user as any)?.employee?.id || user?.id || '',
                metric_key: actualForm.metric_key,
                frequency: actualForm.frequency,
                period_key: actualForm.period_key,
                delta_value: Number(actualForm.delta_value)
            });
            toast({ title: 'Success', description: 'Actual logged (additive).' });
            setActualOpened(false);
            setActualForm(prev => ({ ...prev, delta_value: '' }));
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
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Frequency</Label>
                                <Select value={actualForm.frequency} onValueChange={v => setActualForm({ ...actualForm, frequency: v, period_key: v === 'DAILY' ? new Date().toISOString().slice(0, 10) : new Date().toISOString().slice(0, 7) })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DAILY">DAILY</SelectItem>
                                        <SelectItem value="MONTHLY">MONTHLY</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>For Period</Label>
                                <Input 
                                    type={actualForm.frequency === 'DAILY' ? 'date' : 'month'} 
                                    value={actualForm.period_key} 
                                    onChange={e => setActualForm({ ...actualForm, period_key: e.target.value })} 
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Metric Name</Label>
                            <Select value={actualForm.metric_key} onValueChange={v => setActualForm({ ...actualForm, metric_key: v })}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select metric" />
                                </SelectTrigger>
                                <SelectContent>
                                    {kpiMetrics.map(m => (
                                        <SelectItem key={m.id} value={m.name}>{m.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Value to Add (Delta)</Label>
                            <Input required type="number" placeholder="Enter amount to add" value={actualForm.delta_value} onChange={e => setActualForm({ ...actualForm, delta_value: e.target.value })} />
                        </div>
                    </div>
                </EntityModal>
            </div>
        </AppLayout>
    );
}
