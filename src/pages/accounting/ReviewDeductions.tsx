import { useEffect, useState } from 'react';
import { AccountingService, ReviewDeduction } from '@/services/accounting';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Check, X } from 'lucide-react';
import { toast } from 'sonner';

export default function ReviewDeductions() {
    const [data, setData] = useState<ReviewDeduction[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchData = async () => {
        setLoading(true);
        try {
            const deductions = await AccountingService.getReviewDeductions();
            setData(deductions);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load review deductions');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleApprove = async (id: string) => {
        try {
            await AccountingService.approveReviewDeduction(id);
            toast.success('Deduction approved');
            fetchData();
        } catch (err) {
            toast.error('Failed to approve');
        }
    };

    const handleReject = async (id: string) => {
        try {
            await AccountingService.rejectReviewDeduction(id);
            toast.success('Deduction rejected');
            fetchData();
        } catch (err) {
            toast.error('Failed to reject');
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Review Pending Deductions</h1>

            <Card>
                <CardHeader>
                    <CardTitle>Deductions Awaiting Accounting Approval</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Employee</TableHead>
                                <TableHead>Department</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Suggested Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center">Loading...</TableCell>
                                </TableRow>
                            ) : data.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={7} className="text-center text-muted-foreground">No deductions found.</TableCell>
                                </TableRow>
                            ) : data.map((d) => (
                                <TableRow key={d.id}>
                                    <TableCell>{new Date(d.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell>{d.employee?.full_name}</TableCell>
                                    <TableCell>{d.department?.name}</TableCell>
                                    <TableCell>{d.reason_key}</TableCell>
                                    <TableCell>${Number(d.suggested_amount).toFixed(2)}</TableCell>
                                    <TableCell>
                                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${d.status === 'APPROVED' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100' : d.status === 'REJECTED' ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100' : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-100'}`}>
                                            {d.status.replace('_', ' ')}
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {d.status === 'REVIEW_NEEDED' && (
                                            <div className="flex justify-end gap-2">
                                                <Button size="sm" variant="outline" className="text-green-600 hover:text-green-700" onClick={() => handleApprove(d.id)}>
                                                    <Check className="h-4 w-4 mr-1" /> Approve
                                                </Button>
                                                <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700" onClick={() => handleReject(d.id)}>
                                                    <X className="h-4 w-4 mr-1" /> Reject
                                                </Button>
                                            </div>
                                        )}
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
