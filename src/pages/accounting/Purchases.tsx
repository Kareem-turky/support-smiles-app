import { useEffect, useState } from 'react';
import { AccountingService, Purchase, Vendor } from '@/services/accounting';
import { useAuth } from '@/contexts/useAuth';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { EntityModal } from '@/components/shared/EntityModal';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Combobox } from '@/components/ui/combobox';

export default function Purchases() {
    const [data, setData] = useState<Purchase[]>([]);
    const [vendors, setVendors] = useState<Vendor[]>([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuth();

    // Filters
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Modal
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        vendor_id: '',
        date: new Date().toISOString().split('T')[0],
        notes: '',
        items: [] as { item_name: string; qty: number; unit_price: number }[]
    });
    const [newItem, setNewItem] = useState({ item_name: '', qty: 1, unit_price: 0 });

    // Vendor Creation State
    const [vendorModalOpen, setVendorModalOpen] = useState(false);
    const [newVendorName, setNewVendorName] = useState('');
    const [newVendorPhone, setNewVendorPhone] = useState('');
    const [creatingVendor, setCreatingVendor] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [purchases, vendorList] = await Promise.all([
                AccountingService.getPurchases(),
                AccountingService.getVendors()
            ]);
            setData(purchases);
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

    const handleAddItem = () => {
        if (!newItem.item_name) return;
        setFormData({
            ...formData,
            items: [...formData.items, newItem]
        });
        setNewItem({ item_name: '', qty: 1, unit_price: 0 });
    };

    const handleCreate = async () => {
        if (!formData.vendor_id || formData.items.length === 0) {
            toast.error('Please select vendor and add at least one item');
            return;
        }
        setSaving(true);
        try {
            // Calculate total from items
            const total_amount = formData.items.reduce((sum, item) => sum + (item.qty * item.unit_price), 0);

            await AccountingService.createPurchase({
                ...formData,
                total_amount
            });
            toast.success('Purchase created');
            setOpen(false);
            setFormData({
                vendor_id: '',
                date: new Date().toISOString().split('T')[0],
                notes: '',
                items: []
            });
            fetchData();
        } catch (err) {
            console.error(err);
            toast.error('Failed to create purchase');
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
            setFormData({ ...formData, vendor_id: vendor.id }); // Auto-select
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

    const totalAmount = filteredData.reduce((sum, item) => sum + Number(item.total_amount), 0);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Purchases</h1>
                <Button onClick={() => setOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> New Purchase
                </Button>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Purchases</CardTitle>
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
                    {filteredData.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">No records found.</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Vendor</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Notes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredData.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.vendor?.name || 'Unknown'}</TableCell>
                                        <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                                        <TableCell>${Number(item.total_amount).toFixed(2)}</TableCell>
                                        <TableCell>{item.notes || '-'}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            {/* Vendor Creation Modal */}
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

            {/* Purchase Modal */}
            <EntityModal
                open={open}
                onOpenChange={setOpen}
                title="New Purchase"
                loading={saving}
                onSubmit={handleCreate as any}
                width="sm:max-w-[600px]"
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
                    <Label className="mb-2 block">Notes</Label>
                    <Input
                        value={formData.notes}
                        onChange={e => setFormData({ ...formData, notes: e.target.value })}
                    />
                </div>

                <div className="border rounded-md p-4 space-y-4">
                    <Label>Items</Label>
                    <div className="grid grid-cols-12 gap-2">
                        <div className="col-span-6">
                            <Input
                                placeholder="Item Name"
                                value={newItem.item_name}
                                onChange={e => setNewItem({ ...newItem, item_name: e.target.value })}
                            />
                        </div>
                        <div className="col-span-2">
                            <Input
                                type="number"
                                placeholder="Qty"
                                value={newItem.qty}
                                onChange={e => setNewItem({ ...newItem, qty: Number(e.target.value) })}
                            />
                        </div>
                        <div className="col-span-3">
                            <Input
                                type="number"
                                placeholder="Price"
                                value={newItem.unit_price}
                                onChange={e => setNewItem({ ...newItem, unit_price: Number(e.target.value) })}
                            />
                        </div>
                        <div className="col-span-1">
                            <Button type="button" size="icon" onClick={handleAddItem}><Plus className="h-4 w-4" /></Button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        {formData.items.map((item, idx) => (
                            <div key={idx} className="flex justify-between items-center text-sm bg-muted p-2 rounded">
                                <span>{item.item_name} (x{item.qty})</span>
                                <div className="flex items-center gap-4">
                                    <span>${(item.qty * item.unit_price).toFixed(2)}</span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-destructive"
                                        onClick={() => setFormData({
                                            ...formData,
                                            items: formData.items.filter((_, i) => i !== idx)
                                        })}
                                    >
                                        <Trash2 className="h-3 w-3" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                        {formData.items.length > 0 && (
                            <div className="flex justify-between font-bold pt-2 border-t">
                                <span>Total</span>
                                <span>${formData.items.reduce((s, i) => s + (i.qty * i.unit_price), 0).toFixed(2)}</span>
                            </div>
                        )}
                    </div>
                </div>
            </EntityModal>
        </div>
    );
}
