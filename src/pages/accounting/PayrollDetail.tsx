import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AccountingService, PayrollRun } from '@/services/accounting';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, CreditCard, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function PayrollDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [run, setRun] = useState<PayrollRun | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    const fetchDetail = async () => {
        if (!id) return;
        setLoading(true);
        try {
            const data = await AccountingService.getPayrollRunById(id);
            setRun(data);
        } catch (err: any) {
            toast.error(err.message || 'Failed to fetch payroll details');
            navigate('/accounting/payroll');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDetail();
    }, [id]);

    const handleApprove = async () => {
        if (!id) return;
        setActionLoading(true);
        try {
            await AccountingService.approvePayroll(id);
            toast.success('Payroll approved successfully');
            fetchDetail();
        } catch (err: any) {
            toast.error(err.message || 'Failed to approve payroll');
        } finally {
            setActionLoading(false);
        }
    };

    const handlePay = async () => {
        if (!id) return;
        setActionLoading(true);
        try {
            await AccountingService.payPayroll(id);
            toast.success('Payroll paid successfully');
            fetchDetail();
        } catch (err: any) {
            toast.error(err.message || 'Failed to pay payroll');
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!run) return null;

    const getStatusVariant = (status: string) => {
        switch (status) {
            case 'PAID': return 'default';
            case 'APPROVED': return 'secondary';
            case 'CALCULATED': return 'outline';
            default: return 'outline';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => navigate('/accounting/payroll')}>
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <h1 className="text-3xl font-bold">Payroll Details - {run.month}/{run.year}</h1>
                    <Badge variant={getStatusVariant(run.status)}>{run.status}</Badge>
                </div>
                <div className="flex gap-2">
                    {run.status === 'CALCULATED' && (
                        <Button onClick={handleApprove} disabled={actionLoading}>
                            <CheckCircle className="mr-2 h-4 w-4" /> Approve
                        </Button>
                    )}
                    {run.status === 'APPROVED' && (
                        <Button onClick={handlePay} disabled={actionLoading}>
                            <CreditCard className="mr-2 h-4 w-4" /> Pay Now
                        </Button>
                    )}
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Employee Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Employee</TableHead>
                                <TableHead className="text-right">Base Salary</TableHead>
                                <TableHead className="text-right">Deductions</TableHead>
                                <TableHead className="text-right">Adjustments</TableHead>
                                <TableHead className="text-right font-bold">Net Salary</TableHead>
                                <TableHead>Notes</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {run.items?.map((item: any) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.employee?.full_name}</TableCell>
                                    <TableCell className="text-right">{parseFloat(item.base_salary).toLocaleString()} EGP</TableCell>
                                    <TableCell className="text-right text-red-600">-{parseFloat(item.total_deductions).toLocaleString()} EGP</TableCell>
                                    <TableCell className="text-right text-green-600">+{parseFloat(item.adjustments).toLocaleString()} EGP</TableCell>
                                    <TableCell className="text-right font-bold">{parseFloat(item.net_salary).toLocaleString()} EGP</TableCell>
                                    <TableCell className="text-xs text-muted-foreground italic">
                                        {item.breakdown_json ? JSON.parse(item.breakdown_json).map((b: any) => `${b.type}: ${b.reason}`).join(', ') : '-'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
