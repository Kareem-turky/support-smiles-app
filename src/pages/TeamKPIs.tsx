import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ManagerDashboard } from '@/components/dashboard/ManagerDashboard';
import { useAuth } from '@/contexts/useAuth';
import { EntityModal } from '@/components/shared/EntityModal';
import { KPIService, KpiMetric } from '@/services/kpi.service';
import { HRService } from '@/services/hr';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Target, AlertTriangle } from 'lucide-react';
import { Employee } from '@/types';

export default function TeamKPIs() {
    const { user } = useAuth();
    const { toast } = useToast();

    // Modals
    const [targetOpened, setTargetOpened] = useState(false);
    const [actualOpened, setActualOpened] = useState(false);
    const [issueOpened, setIssueOpened] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form states
    const [targetForm, setTargetForm] = useState({ 
        employeeId: '', 
        metric_key: '', 
        metric_label: '', 
        frequency: 'DAILY', 
        target_value: '', 
        weight: '10' 
    });
    
    const [actualForm, setActualForm] = useState({ 
        employee_id: '', 
        metric_key: '', 
        frequency: 'DAILY', 
        period_key: new Date().toISOString().slice(0, 10), 
        delta_value: '' 
    });

    const [issueForm, setIssueForm] = useState({ employeeId: '', type: 'PRODUCTIVITY', description: '', severity: 'LOW', deductionPoints: '0' });

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [employeesLoading, setEmployeesLoading] = useState(false);

    // KPI Metrics Dropdown list
    const [kpiMetrics, setKpiMetrics] = useState<KpiMetric[]>([]);
    const [metricsLoading, setMetricsLoading] = useState(false);
    const [metricsFetched, setMetricsFetched] = useState(false);

    const hasEmployees = employees.length > 0;
    const hasMetrics = kpiMetrics.length > 0;

    useEffect(() => {
        if (targetOpened || actualOpened || issueOpened) {
            if (!hasEmployees && !employeesLoading) {
                setEmployeesLoading(true);
                HRService.getEmployees()
                    .then(res => setEmployees(res))
                    .catch(err => console.error("Failed to fetch employees", err))
                    .finally(() => setEmployeesLoading(false));
            }
            if (!metricsFetched && !metricsLoading && (targetOpened || actualOpened || issueOpened)) {
                setMetricsLoading(true);
                KPIService.getMetrics(true) // only active
                    .then(res => {
                        setKpiMetrics(res);
                        setMetricsFetched(true);
                    })
                    .catch(err => console.error("Failed to fetch metrics", err))
                    .finally(() => setMetricsLoading(false));
            }
        }
    }, [targetOpened, actualOpened, issueOpened, hasEmployees, employeesLoading, metricsFetched, metricsLoading]);

    const employeeOptions = employees.map(emp => ({
        value: emp.id,
        label: `${emp.full_name || 'No Name'} (${emp.department?.name || 'No Dept'}) - ${emp.role || 'No Role'}`
    }));

    const reloadDashboard = () => {
        // Need to trigger re-render of ManagerDashboard, using a key trick
        setRefreshKey(prev => prev + 1);
    }
    const [refreshKey, setRefreshKey] = useState(0);

    const handleCreateTarget = async (e: React.FormEvent) => {
        if (!targetForm.employeeId || !targetForm.metric_key) {
            toast({ title: 'Validation Error', description: 'Please select an employee and metric.', variant: 'destructive' });
            return;
        }
        setLoading(true);
        try {
            await KPIService.createTarget({
                employeeId: targetForm.employeeId,
                metric_key: targetForm.metric_key,
                metric_label: targetForm.metric_label,
                target_value: Number(targetForm.target_value),
                frequency: targetForm.frequency,
                weight: Number(targetForm.weight),
            });
            toast({ title: 'Success', description: 'Target created.' });
            setTargetForm({ employeeId: '', metric_key: '', metric_label: '', frequency: 'DAILY', target_value: '', weight: '10' });
            setTargetOpened(false);
            reloadDashboard();
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleLogActual = async (e: React.FormEvent) => {
        if (!actualForm.employee_id || !actualForm.metric_key) {
            toast({ title: 'Validation Error', description: 'Please select an employee and metric.', variant: 'destructive' });
            return;
        }
        setLoading(true);
        try {
            await KPIService.logActual({
                employee_id: actualForm.employee_id,
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

    const handleAddIssue = async (e: React.FormEvent) => {
        setLoading(true);
        try {
            await KPIService.logIssue({
                employeeId: issueForm.employeeId,
                type: issueForm.type,
                description: issueForm.description,
                severity: issueForm.severity,
                deductionPoints: Number(issueForm.deductionPoints),
                date: new Date().toISOString()
            });
            toast({ title: 'Success', description: 'Issue logged.' });
            setIssueOpened(false);
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
                        <h1 className="text-3xl font-bold">Team Performance</h1>
                        <p className="text-muted-foreground mt-1">
                            Team leaderboard and individual KPI tracking
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <Button onClick={() => setTargetOpened(true)} variant="outline"><Target className="w-4 h-4 mr-2" /> Add Target</Button>
                        <Button onClick={() => setActualOpened(true)} variant="outline"><PlusCircle className="w-4 h-4 mr-2" /> Log Actual</Button>
                        <Button onClick={() => setIssueOpened(true)} variant="destructive"><AlertTriangle className="w-4 h-4 mr-2" /> Add Issue</Button>
                    </div>
                </div>
                <ManagerDashboard key={refreshKey} />

                {/* Target Modal */}
                <EntityModal open={targetOpened} onOpenChange={setTargetOpened} title="Create KPI Target" onSubmit={handleCreateTarget} loading={loading}>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Employee</Label>
                            {employeesLoading ? <div className="h-10 animate-pulse bg-muted rounded-md" /> : (
                                <Combobox
                                    options={employeeOptions}
                                    value={targetForm.employeeId}
                                    onChange={(val) => setTargetForm({ ...targetForm, employeeId: val })}
                                    placeholder="Select Employee..."
                                    searchPlaceholder="Search employee name/code/role..."
                                />
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Frequency</Label>
                                <Select value={targetForm.frequency} onValueChange={v => setTargetForm({ ...targetForm, frequency: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="DAILY">DAILY (YYYY-MM-DD)</SelectItem>
                                        <SelectItem value="MONTHLY">MONTHLY (YYYY-MM)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Weight (%)</Label>
                                <Input required type="number" value={targetForm.weight} onChange={e => setTargetForm({ ...targetForm, weight: e.target.value })} />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label>Metric Name / Key</Label>
                            <Select value={targetForm.metric_key} onValueChange={v => {
                                const m = kpiMetrics.find(x => x.name === v);
                                setTargetForm({ ...targetForm, metric_key: v, metric_label: m?.name || v });
                            }}>
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
                            <Label>Target Value</Label>
                            <Input required type="number" value={targetForm.target_value} onChange={e => setTargetForm({ ...targetForm, target_value: e.target.value })} />
                        </div>
                    </div>
                </EntityModal>

                {/* Actual Modal */}
                <EntityModal open={actualOpened} onOpenChange={setActualOpened} title="Log KPI Actual" onSubmit={handleLogActual} loading={loading}>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Employee</Label>
                            {employeesLoading ? <div className="h-10 animate-pulse bg-muted rounded-md" /> : (
                                <Combobox
                                    options={employeeOptions}
                                    value={actualForm.employee_id}
                                    onChange={(val) => setActualForm({ ...actualForm, employee_id: val })}
                                    placeholder="Select Employee..."
                                    searchPlaceholder="Search employee name/code/role..."
                                />
                            )}
                        </div>
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
                            <Input required type="number" placeholder="Enter amount to increment/decrement" value={actualForm.delta_value} onChange={e => setActualForm({ ...actualForm, delta_value: e.target.value })} />
                        </div>
                    </div>
                </EntityModal>

                {/* Issue Modal */}
                <EntityModal open={issueOpened} onOpenChange={setIssueOpened} title="Log Quality Issue" onSubmit={handleAddIssue} loading={loading} submitLabel="Log Issue">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Employee</Label>
                            {employeesLoading ? <div className="h-10 animate-pulse bg-muted rounded-md" /> : (
                                <Combobox
                                    options={employeeOptions}
                                    value={issueForm.employeeId}
                                    onChange={(val) => setIssueForm({ ...issueForm, employeeId: val })}
                                    placeholder="Select Employee..."
                                    searchPlaceholder="Search employee name/code/role..."
                                />
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <Select value={issueForm.type} onValueChange={v => setIssueForm({ ...issueForm, type: v })}>
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
                            <Label>Description</Label>
                            <Input value={issueForm.description} onChange={e => setIssueForm({ ...issueForm, description: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Severity</Label>
                                <Select value={issueForm.severity} onValueChange={v => setIssueForm({ ...issueForm, severity: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="LOW">LOW</SelectItem>
                                        <SelectItem value="MEDIUM">MEDIUM</SelectItem>
                                        <SelectItem value="HIGH">HIGH</SelectItem>
                                        <SelectItem value="FATAL">FATAL</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label>Deduction Points</Label>
                                <Input required type="number" value={issueForm.deductionPoints} onChange={e => setIssueForm({ ...issueForm, deductionPoints: e.target.value })} />
                            </div>
                        </div>
                    </div>
                </EntityModal>
            </div>
        </AppLayout>
    );
}

