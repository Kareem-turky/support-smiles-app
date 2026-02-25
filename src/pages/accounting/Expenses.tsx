import { useEffect, useState } from 'react';
import { AccountingService, Expense } from '@/services/accounting';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { EntityModal } from '@/components/shared/EntityModal';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Combobox } from '@/components/ui/combobox';

export default function Expenses() {
    const [data, setData] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Modal
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        category: 'OFFICE',
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        notes: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await AccountingService.getExpenses();
            setData(res);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = async () => {
        if (formData.amount <= 0) {
            toast.error('Amount must be greater than 0');
            return;
        }
        setSaving(true);
        try {
            await AccountingService.createExpense(formData);
            toast.success('Expense created');
            setOpen(false);
            setFormData({
                category: 'OFFICE',
                date: new Date().toISOString().split('T')[0],
                amount: 0,
                notes: ''
            });
            fetchData();
        } catch (err) {
            console.error(err);
            toast.error('Failed to create expense');
        } finally {
            setSaving(false);
        }
    };

    const filteredData = data.filter(item => {
        if (dateFrom && new Date(item.date) < new Date(dateFrom)) return false;
        if (dateTo && new Date(item.date) > new Date(dateTo)) return false;
        return true;
    });

    // Derive unique categories from existing data + defaults
    const defaultCategories = ['OFFICE', 'UTILITIES', 'RENT', 'MAINTENANCE', 'OTHER'];
    const existingCategories = Array.from(new Set(data.map(e => e.category)));
    const allCategories = Array.from(new Set([...defaultCategories, ...existingCategories]));

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Expenses</h1>
                <Button onClick={() => setOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> New Expense
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Expense History</CardTitle>
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
                                    <TableHead>Category</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Notes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredData.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.category}</TableCell>
                                        <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
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
                title="New Expense"
                loading={saving}
                onSubmit={handleCreate as any}
            >
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className="mb-2 block">Category</Label>
                        <Combobox
                            options={allCategories.map(c => ({ label: c, value: c }))}
                            value={formData.category}
                            onChange={(val) => setFormData({ ...formData, category: val })}
                            placeholder="Select Category"
                            searchPlaceholder="Search categories..."
                            onCreate={(inputValue) => {
                                setFormData({ ...formData, category: inputValue });
                            }}
                            createLabel="Add Category"
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
                    <Label className="mb-2 block">Amount</Label>
                    <Input
                        type="number"
                        value={formData.amount}
                        onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                    />
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
