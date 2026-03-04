import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ManagerDashboard } from '@/components/dashboard/ManagerDashboard';
import { useAuth } from '@/contexts/useAuth';
import { EntityModal } from '@/components/shared/EntityModal';
import { KPIService } from '@/services/kpi.service';
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
    const [targetForm, setTargetForm] = useState({ employeeId: '', metric: '', targetValue: '', date: '', weight: '10' });
    const [actualForm, setActualForm] = useState({ employeeId: '', metric: '', actualValue: '', date: '' });
    const [issueForm, setIssueForm] = useState({ employeeId: '', type: 'PRODUCTIVITY', description: '', severity: 'LOW', deductionPoints: '0' });

    const [employees, setEmployees] = useState<Employee[]>([]);
    const [employeesLoading, setEmployeesLoading] = useState(false);

    useEffect(() => {
        if (targetOpened || actualOpened || issueOpened) {
            if (employees.length === 0 && !employeesLoading) {
                setEmployeesLoading(true);
                HRService.getEmployees()
                    .then(res => setEmployees(res))
                    .catch(err => console.error("Failed to fetch employees", err))
                    .finally(() => setEmployeesLoading(false));
            }
        }
    }, [targetOpened, actualOpened, issueOpened]);

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
        if (!targetForm.employeeId) {
            toast({ title: 'Validation Error', description: 'Please select an employee.', variant: 'destructive' });
            return;
        }
        setLoading(true);
        try {
            await KPIService.createTarget({
                employeeId: targetForm.employeeId,
                metric: targetForm.metric,
                targetValue: Number(targetForm.targetValue),
                date: targetForm.date || new Date().toISOString(),
                weight: Number(targetForm.weight)
            });
            toast({ title: 'Success', description: 'Target created.' });
            setTargetOpened(false);
            reloadDashboard();
        } catch (err: any) {
            toast({ title: 'Error', description: err.message, variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    const handleLogActual = async (e: React.FormEvent) => {
        if (!actualForm.employeeId) {
            toast({ title: 'Validation Error', description: 'Please select an employee.', variant: 'destructive' });
            return;
        }
        setLoading(true);
        try {
            await KPIService.logActual({
                employeeId: actualForm.employeeId,
                metric: actualForm.metric,
                date: actualForm.date || new Date().toISOString(),
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
                        <div className="space-y-2">
                            <Label>Metric Name</Label>
                            <Input required value={targetForm.metric} onChange={e => setTargetForm({ ...targetForm, metric: e.target.value })} placeholder="Daily Tickets" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Target Value</Label>
                                <Input required type="number" value={targetForm.targetValue} onChange={e => setTargetForm({ ...targetForm, targetValue: e.target.value })} />
                            </div>
                            <div className="space-y-2">
                                <Label>Weight (%)</Label>
                                <Input required type="number" value={targetForm.weight} onChange={e => setTargetForm({ ...targetForm, weight: e.target.value })} />
                            </div>
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
                                    value={actualForm.employeeId}
                                    onChange={(val) => setActualForm({ ...actualForm, employeeId: val })}
                                    placeholder="Select Employee..."
                                    searchPlaceholder="Search employee name/code/role..."
                                />
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label>Metric Name</Label>
                            <Input required value={actualForm.metric} onChange={e => setActualForm({ ...actualForm, metric: e.target.value })} placeholder="Daily Tickets" />
                        </div>
                        <div className="space-y-2">
                            <Label>Actual Value Achieved</Label>
                            <Input required type="number" value={actualForm.actualValue} onChange={e => setActualForm({ ...actualForm, actualValue: e.target.value })} />
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
                            <Input required value={issueForm.type} onChange={e => setIssueForm({ ...issueForm, type: e.target.value })} placeholder="e.g. LATE_DELIVERY" />
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

