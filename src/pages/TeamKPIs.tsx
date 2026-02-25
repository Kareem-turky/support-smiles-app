import { useState } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { ManagerDashboard } from '@/components/dashboard/ManagerDashboard';
import { useAuth } from '@/contexts/useAuth';
import { EntityModal } from '@/components/shared/EntityModal';
import { KPIService } from '@/services/kpi.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Target, AlertTriangle } from 'lucide-react';

export default function TeamKPIs() {
    const { user } = useAuth();
    const { toast } = useToast();

    // Modals
    const [targetOpened, setTargetOpened] = useState(false);
    const [actualOpened, setActualOpened] = useState(false);
    const [issueOpened, setIssueOpened] = useState(false);
    const [loading, setLoading] = useState(false);

    // Form states
    const [targetForm, setTargetForm] = useState({ role: '', metricName: '', targetValue: '', period: 'DAILY', weight: '10' });
    const [actualForm, setActualForm] = useState({ userId: '', metricName: '', actualValue: '' });
    const [issueForm, setIssueForm] = useState({ employeeId: '', type: 'PRODUCTIVITY', description: '', severity: 'LOW', deductionPoints: '0' });

    const reloadDashboard = () => {
        // Need to trigger re-render of ManagerDashboard, using a key trick
        setRefreshKey(prev => prev + 1);
    }
    const [refreshKey, setRefreshKey] = useState(0);

    const handleCreateTarget = async (e: React.FormEvent) => {
        setLoading(true);
        try {
            await KPIService.createTarget({
                role: targetForm.role || undefined,
                metricName: targetForm.metricName,
                targetValue: Number(targetForm.targetValue),
                period: targetForm.period,
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
        setLoading(true);
        try {
            await KPIService.logActual({
                userId: actualForm.userId,
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
                            <Label>Role (Optional)</Label>
                            <Input value={targetForm.role} onChange={e => setTargetForm({ ...targetForm, role: e.target.value })} placeholder="e.g. CS_AGENT" />
                        </div>
                        <div className="space-y-2">
                            <Label>Metric Name</Label>
                            <Input required value={targetForm.metricName} onChange={e => setTargetForm({ ...targetForm, metricName: e.target.value })} placeholder="Daily Tickets" />
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
                            <Label>User ID</Label>
                            <Input required value={actualForm.userId} onChange={e => setActualForm({ ...actualForm, userId: e.target.value })} />
                        </div>
                        <div className="space-y-2">
                            <Label>Metric Name</Label>
                            <Input required value={actualForm.metricName} onChange={e => setActualForm({ ...actualForm, metricName: e.target.value })} />
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
                            <Label>Employee ID</Label>
                            <Input required value={issueForm.employeeId} onChange={e => setIssueForm({ ...issueForm, employeeId: e.target.value })} />
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

