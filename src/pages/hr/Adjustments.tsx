import { useEffect, useState } from 'react';
import { HRService, Adjustment, Employee } from '@/services/hr';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { EntityModal } from '@/components/shared/EntityModal';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Combobox } from '@/components/ui/combobox';

export default function Adjustments() {
    const [data, setData] = useState<Adjustment[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Modal
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        employee_id: '',
        type: 'BONUS',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        reason: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            // For Adjustments list, we probably want both Bonus and Deductions but NOT advances
            // This logic depends on backend filtering, for now we fetch all or specific types
            // assuming default gets all
            const [adj, emps] = await Promise.all([
                HRService.getAdjustments({
                    from: dateFrom || undefined,
                    to: dateTo || undefined
                }),
                HRService.getEmployees()
            ]);
            setData(adj.filter(a => a.type !== 'ADVANCE')); // Exclude advances here if needed
            setEmployees(emps);
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [dateFrom, dateTo]);

    const handleCreate = async () => {
        if (!formData.employee_id || formData.amount <= 0) {
            toast.error('Select employee and valid amount');
            return;
        }
        setSaving(true);
        try {
            await HRService.createAdjustment(formData);
            toast.success('Adjustment created');
            setOpen(false);
            setFormData({
                employee_id: '',
                type: 'BONUS',
                amount: 0,
                date: new Date().toISOString().split('T')[0],
                reason: ''
            });
            fetchData();
        } catch (err) {
            console.error(err);
            toast.error('Failed to create adjustment');
        } finally {
            setSaving(false);
        }
    };

    const filteredData = data.filter(item => {
        if (dateFrom && new Date(item.date) < new Date(dateFrom)) return false;
        if (dateTo && new Date(item.date) > new Date(dateTo)) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">HR Adjustments</h1>
                <Button onClick={() => setOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> New Adjustment
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Adjustments History</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 mb-4 items-end">
                        <div className="grid gap-1.5">
                            <label className="text-sm font-medium">From</label>
                            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                        </div>
                        <div className="grid gap-1.5">
                            <label className="text-sm font-medium">To</label>
                            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                        </div>
                    </div>
                    {filteredData.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">No records found.</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Reason</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredData.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.employee?.full_name || 'Unknown'}</TableCell>
                                        <TableCell>
                                            <span className={`font-semibold ${item.type === 'BONUS' ? 'text-green-600' : 'text-amber-600'}`}>
                                                {item.type}
                                            </span>
                                        </TableCell>
                                        <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                                        <TableCell className="font-mono">${Number(item.amount).toFixed(2)}</TableCell>
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
                title="New Adjustment"
                loading={saving}
                onSubmit={handleCreate as any}
            >
                <div>
                    <Label className="mb-2 block">Employee *</Label>
                    <Combobox
                        options={employees.map(e => ({ label: e.full_name, value: e.id }))}
                        value={formData.employee_id}
                        onChange={(val) => setFormData({ ...formData, employee_id: val })}
                        placeholder="Select Employee"
                        searchPlaceholder="Search employees..."
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className="mb-2 block">Type</Label>
                        <Select
                            value={formData.type}
                            onValueChange={val => setFormData({ ...formData, type: val })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="BONUS">Bonus</SelectItem>
                                <SelectItem value="DEDUCTION">Deduction</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="mb-2 block">Amount</Label>
                        <Input
                            type="number"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                        />
                    </div>
                </div>
                <div>
                    <Label className="mb-2 block">Date</Label>
                    <Input
                        type="date"
                        value={formData.date}
                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                    />
                </div>
                <div>
                    <Label className="mb-2 block">Reason</Label>
                    <Input
                        value={formData.reason}
                        onChange={e => setFormData({ ...formData, reason: e.target.value })}
                    />
                </div>
            </EntityModal>
        </div>
    );
}
