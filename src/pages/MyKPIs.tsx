import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { EmployeeDashboard } from '@/components/dashboard/EmployeeDashboard';
import { useAuth } from '@/contexts/useAuth';
import { EntityModal } from '@/components/shared/EntityModal';
import { KPIService } from '@/services/kpi.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

    const [refreshKey, setRefreshKey] = useState(0);
    const reloadDashboard = () => setRefreshKey(prev => prev + 1);

    const handleLogActual = async (e: React.FormEvent) => {
        setLoading(true);
        try {
            await KPIService.logActual({
                userId: user?.id || '',
                metricName: actualForm.metricName,
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
                            <Input required value={actualForm.metricName} onChange={e => setActualForm({ ...actualForm, metricName: e.target.value })} placeholder="e.g. Daily Orders" />
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
