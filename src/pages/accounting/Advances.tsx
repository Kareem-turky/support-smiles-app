import { useEffect, useState, useCallback } from 'react';
import { HRService } from '@/services/hr';
import { Adjustment, Employee } from '@/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { format } from 'date-fns';
import { EntityModal } from '@/components/shared/EntityModal';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function Advances() {
    const [data, setData] = useState<Adjustment[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Modal
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        employee_id: '',
        type: 'ADVANCE',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        reason: ''
    });

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [advances, emps] = await Promise.all([
                HRService.getAdjustments({
                    type: 'ADVANCE',
                    from: dateFrom || undefined,
                    to: dateTo || undefined
                }),
                HRService.getEmployees()
            ]);
            setData(advances);
            setEmployees(emps);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch advances');
        } finally {
            setLoading(false);
        }
    }, [dateFrom, dateTo]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreate = async () => {
        if (!formData.employee_id || formData.amount <= 0) {
            toast.error('Select employee and valid amount');
            return;
        }
        setSaving(true);
        try {
            await HRService.createAdjustment(formData);
            toast.success('Advance created');
            setOpen(false);
            setFormData({
                employee_id: '',
                type: 'ADVANCE',
                amount: 0,
                date: new Date().toISOString().split('T')[0],
                reason: ''
            });
            fetchData();
        } catch (err) {
            console.error(err);
            toast.error('Failed to create advance');
        } finally {
            setSaving(false);
        }
    };

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        fetchData();
    };

    const totalAmount = data.reduce((sum, item) => sum + Number(item.amount), 0);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Advances (سلف)</h1>
                <Button onClick={() => setOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> New Advance
                </Button>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Advances</CardTitle>
                    <div className="text-2xl font-bold">${totalAmount.toFixed(2)}</div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleFilter} className="flex gap-4 mb-4 items-end">
                        <div className="grid gap-1.5">
                            <label className="text-sm font-medium">From</label>
                            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                        </div>
                        <div className="grid gap-1.5">
                            <label className="text-sm font-medium">To</label>
                            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                        </div>
                        <Button type="submit" variant="secondary"><Search className="h-4 w-4 mr-2" /> Filter</Button>
                    </form>

                    {loading ? (
                        <div className="text-center py-4">Loading...</div>
                    ) : error ? (
                        <div className="text-center py-4 text-destructive">{error}</div>
                    ) : data.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">No records found.</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Reason</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.employee?.full_name || 'Unknown'}</TableCell>
                                        <TableCell>{format(new Date(item.date), 'PPP')}</TableCell>
                                        <TableCell>${Number(item.amount).toFixed(2)}</TableCell>
                                        <TableCell>{item.reason}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <EntityModal
                open={open}
                onOpenChange={setOpen}
                title="New Advance (السلفة)"
                loading={saving}
                onSubmit={handleCreate as any}
            >
                <div>
                    <Label className="mb-2 block">Employee *</Label>
                    <Select
                        value={formData.employee_id}
                        onValueChange={val => setFormData({ ...formData, employee_id: val })}
                    >
                        <SelectTrigger>
                            <SelectValue placeholder="Select Employee" />
                        </SelectTrigger>
                        <SelectContent>
                            {employees.map(e => (
                                <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className="mb-2 block">Amount</Label>
                        <Input
                            type="number"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                        />
                    </div>
                    <div>
                        <Label className="mb-2 block">Date</Label>
                        <Input
                            type="date"
                            value={formData.date}
                            onChange={e => setFormData({ ...formData, date: e.target.value })}
                        />
                    </div>
                </div>
                <div>
                    <Label className="mb-2 block">Reason / Notes</Label>
                    <Input
                        value={formData.reason}
                        onChange={e => setFormData({ ...formData, reason: e.target.value })}
                    />
                </div>
            </EntityModal>
        </div>
    );
}
