import { useEffect, useState } from 'react';
import { AccountingService, Transfer } from '@/services/accounting';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';
import { EntityModal } from '@/components/shared/EntityModal';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Combobox } from '@/components/ui/combobox';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/useAuth';

const defaultTypes = [
    { label: 'Payroll', value: 'PAYROLL' },
    { label: 'Supplier', value: 'SUPPLIER' },
    { label: 'Expense', value: 'EXPENSE' },
    { label: 'Other', value: 'OTHER' }
];

export default function Transfers() {
    const [data, setData] = useState<Transfer[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [open, setOpen] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [transferTypes, setTransferTypes] = useState(defaultTypes);

    const [formData, setFormData] = useState<Omit<Transfer, 'id'>>({
        type: 'OTHER',
        method: 'BANK',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        notes: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const result = await AccountingService.getTransfers();
            setData(result);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch transfers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = async () => {
        if (formData.amount <= 0) {
            toast.error('Enter valid amount');
            return;
        }
        setSaving(true);
        try {
            await AccountingService.createTransfer(formData);
            toast.success('Transfer created');
            setOpen(false);
            setFormData({
                type: 'OTHER',
                method: 'BANK',
                amount: 0,
                date: new Date().toISOString().split('T')[0],
                notes: ''
            });
            fetchData();
        } catch (err) {
            console.error(err);
            toast.error('Failed to create transfer');
        } finally {
            setSaving(false);
        }
    };

    const filteredData = data.filter(item => {
        if (dateFrom && new Date(item.date) < new Date(dateFrom)) return false;
        if (dateTo && new Date(item.date) > new Date(dateTo)) return false;
        return true;
    });

    const totalAmount = filteredData.reduce((sum, item) => sum + Number(item.amount), 0);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Transfers</h1>
                <Button onClick={() => setOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> New Transfer
                </Button>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Transfers</CardTitle>
                    <div className="text-2xl font-bold">${totalAmount.toFixed(2)}</div>
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

                    {loading ? (
                        <div className="text-center py-4">Loading...</div>
                    ) : error ? (
                        <div className="text-center py-4 text-destructive">{error}</div>
                    ) : filteredData.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">No records found.</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Notes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredData.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.type}</TableCell>
                                        <TableCell>{item.method}</TableCell>
                                        <TableCell>{format(new Date(item.date), 'PPP')}</TableCell>
                                        <TableCell>${Number(item.amount).toFixed(2)}</TableCell>
                                        <TableCell>{item.notes || '-'}</TableCell>
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
                title="New Transfer"
                loading={saving}
                onSubmit={handleCreate as any}
            >
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className="mb-2 block">Type</Label>
                        <Combobox
                            options={transferTypes}
                            value={formData.type}
                            onChange={val => setFormData({ ...formData, type: val as any })}
                            onCreate={val => {
                                setTransferTypes(prev => [...prev, { label: val, value: val }]);
                                setFormData({ ...formData, type: val as any });
                            }}
                            createLabel="Custom Type"
                            placeholder="Select or Type"
                        />
                    </div>
                    <div>
                        <Label className="mb-2 block">Method</Label>
                        <Select
                            value={formData.method}
                            onValueChange={val => setFormData({ ...formData, method: val })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="BANK">Bank</SelectItem>
                                <SelectItem value="CASH">Cash</SelectItem>
                                <SelectItem value="OTHER">Other</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
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
                    <Label className="mb-2 block">Notes</Label>
                    <Input
                        value={formData.notes}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    />
                </div>
            </EntityModal>
        </div>
    );
}
