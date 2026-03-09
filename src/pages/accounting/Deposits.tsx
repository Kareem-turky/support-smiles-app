import { useEffect, useState } from 'react';
import { AccountingService, Deposit, Vendor } from '@/services/accounting';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { EntityModal } from '@/components/shared/EntityModal';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Combobox } from '@/components/ui/combobox';

export default function Deposits() {
    const [data, setData] = useState<Deposit[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);

    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Modal
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        vendor_id: '',
        date: new Date().toISOString().split('T')[0],
        amount: 0,
        notes: ''
    });

    // Vendor Creation State
    const [vendorModalOpen, setVendorModalOpen] = useState(false);
    const [newVendorName, setNewVendorName] = useState('');
    const [newVendorPhone, setNewVendorPhone] = useState('');
    const [creatingVendor, setCreatingVendor] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [deposits, vendorList] = await Promise.all([
                AccountingService.getDeposits(),
                AccountingService.getVendors()
            ]);
            setData(deposits);
            setVendors(vendorList);
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
        if (!formData.vendor_id || formData.amount <= 0) {
            toast.error('Please select vendor and enter valid amount');
            return;
        }
        setSaving(true);
        try {
            await AccountingService.createDeposit(formData);
            toast.success('Deposit created');
            setOpen(false);
            setFormData({
                vendor_id: '',
                date: new Date().toISOString().split('T')[0],
                amount: 0,
                notes: ''
            });
            fetchData();
        } catch (err) {
            console.error(err);
            toast.error('Failed to create deposit');
        } finally {
            setSaving(false);
        }
    };

    const handleCreateVendor = async (name: string) => {
        const trimmedName = name.trim();
        if (!trimmedName) {
            toast.error('Vendor name is required');
            return;
        }
        setCreatingVendor(true);
        try {
            const vendor = await AccountingService.createVendor({ name: trimmedName, phone: newVendorPhone });
            setVendors([...vendors, vendor]);
            setFormData({ ...formData, vendor_id: vendor.id });
            toast.success(`Vendor "${name}" created`);
            setVendorModalOpen(false);
            setNewVendorName('');
            setNewVendorPhone('');
        } catch (error: any) {
            console.error(error);
            const msg = error.response?.data?.message || error.message || 'Failed to create vendor';
            toast.error(typeof msg === 'string' ? msg : (Array.isArray(msg) ? msg[0] : 'Failed to create vendor'));
        } finally {
            setCreatingVendor(false);
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
                <h1 className="text-3xl font-bold">Vendor Deposits</h1>
                <Button onClick={() => setOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> New Deposit
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Deposit History</CardTitle>
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
                                    <TableHead>Vendor</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Profit/Loss</TableHead>
                                    <TableHead>Notes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredData.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.vendor?.name || 'Unknown'}</TableCell>
                                        <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                                        <TableCell>${Number(item.amount).toFixed(2)}</TableCell>
                                        <TableCell>{item.profit_loss ? `$${Number(item.profit_loss).toFixed(2)}` : '-'}</TableCell>
                                        <TableCell>{item.notes || '-'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <EntityModal
                open={vendorModalOpen}
                onOpenChange={setVendorModalOpen}
                title="Create New Vendor"
                loading={creatingVendor}
                onSubmit={async (e) => { e.preventDefault(); await handleCreateVendor(newVendorName); }}
                submitLabel="Create Vendor"
                width="sm:max-w-[400px]"
            >
                <div>
                    <Label className="mb-2 block">Vendor Name</Label>
                    <Input
                        value={newVendorName}
                        onChange={(e) => setNewVendorName(e.target.value)}
                        placeholder="Enter vendor name"
                        autoFocus
                        className="mb-4"
                    />
                    <Label className="mb-2 block">Phone (Optional)</Label>
                    <Input
                        value={newVendorPhone}
                        onChange={(e) => setNewVendorPhone(e.target.value)}
                        placeholder="Enter phone number"
                    />
                </div>
            </EntityModal>

            <EntityModal
                open={open}
                onOpenChange={setOpen}
                title="New Vendor Deposit"
                loading={saving}
                onSubmit={handleCreate as any}
            >
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className="mb-2 block">Vendor *</Label>
                        <Combobox
                            options={vendors.map(v => ({ label: v.name, value: v.id }))}
                            value={formData.vendor_id}
                            onChange={(val) => setFormData({ ...formData, vendor_id: val })}
                            placeholder="Select Vendor"
                            searchPlaceholder="Search vendors..."
                            onCreate={(inputValue) => {
                                setNewVendorName(inputValue);
                                setVendorModalOpen(true);
                            }}
                            createLabel="Add Vendor"
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
