import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { EntityModal } from '@/components/shared/EntityModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Trash2 } from 'lucide-react';
import { KPIService, KpiMetric } from '@/services/kpi.service';
import { Switch } from '@/components/ui/switch';

export default function KPITypes() {
    const { toast } = useToast();
    const [metrics, setMetrics] = useState<KpiMetric[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [formData, setFormData] = useState({ name: '' });

    const fetchMetrics = async () => {
        try {
            const data = await KPIService.getMetrics();
            setMetrics(data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchMetrics();
    }, []);

    const handleCreate = async () => {
        if (!formData.name.trim()) {
            toast({ title: 'Error', description: 'Metric name is required', variant: 'destructive' });
            return;
        }
        setCreateLoading(true);
        try {
            await KPIService.createMetric(formData.name);
            toast({ title: 'Success', description: 'Metric created successfully.' });
            setIsCreateOpen(false);
            setFormData({ name: '' });
            fetchMetrics();
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Failed to create metric';
            toast({ title: 'Error', description: Array.isArray(msg) ? msg[0] : msg, variant: 'destructive' });
        } finally {
            setCreateLoading(false);
        }
    };

    const handleToggle = async (id: string, current: boolean) => {
        try {
            await KPIService.toggleMetric(id, !current);
            setMetrics(prev => prev.map(m => m.id === id ? { ...m, is_active: !current } : m));
        } catch (err) {
            toast({ title: 'Error', description: 'Failed to update metric state', variant: 'destructive' });
        }
    };

    const handleDelete = async (id: string) => {
        if (!window.confirm('Are you sure you want to delete this KPI type?')) return;
        try {
            await KPIService.deleteMetric(id);
            setMetrics(prev => prev.filter(m => m.id !== id));
            toast({ title: 'Deleted', description: 'KPI Type removed successfully' });
        } catch (err: any) {
            toast({ title: 'Error', description: err.response?.data?.message || 'Failed to delete', variant: 'destructive' });
        }
    };

    const columns = [
        { header: 'Metric Name', accessorKey: 'name' as const },
        {
            header: 'Active',
            accessorKey: 'is_active' as const,
            cell: (m: KpiMetric) => (
                <Switch
                    checked={m.is_active}
                    onCheckedChange={() => handleToggle(m.id, m.is_active)}
                />
            )
        },
        {
            header: 'Actions',
            accessorKey: 'id' as const,
            cell: (m: KpiMetric) => (
                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(m.id)}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            )
        },
    ];

    return (
        <AppLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">KPI Types</h1>
                        <p className="text-muted-foreground mt-1">Manage standard performance metrics available for managers.</p>
                    </div>
                    <Button onClick={() => setIsCreateOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add KPI Type
                    </Button>
                </div>

                <DataTable columns={columns} data={metrics} isLoading={loading} />

                <EntityModal
                    open={isCreateOpen}
                    onOpenChange={setIsCreateOpen}
                    title="Add New KPI Type"
                    onSubmit={handleCreate}
                    loading={createLoading}
                >
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Metric Name</Label>
                            <Input
                                required
                                placeholder="e.g., Response Time, QA Score"
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                    </div>
                </EntityModal>
            </div>
        </AppLayout>
    );
}
