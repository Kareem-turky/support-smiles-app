import { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { EntityModal } from '@/components/shared/EntityModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { api } from '@/lib/api';
import { PlusCircle } from 'lucide-react';

export default function Vendors() {
    const { toast } = useToast();
    const [vendors, setVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [formData, setFormData] = useState({ name: '', phone: '' });

    const fetchVendors = async () => {
        try {
            const res = await api.get('/accounting/vendors');
            const sortedData = res.data.sort((a: any, b: any) => a.name.localeCompare(b.name));
            setVendors(sortedData);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchVendors();
    }, []);

    const handleCreate = async () => {
        const trimmedName = formData.name.trim();
        if (!trimmedName) {
            toast({ title: 'Error', description: 'Vendor name is required', variant: 'destructive' });
            return;
        }
        setCreateLoading(true);
        try {
            const createRes = await api.post('/accounting/vendors', { vendor_name: trimmedName, phone: formData.phone });
            toast({ title: 'Success', description: 'Vendor created successfully.' });
            setIsCreateOpen(false);
            setFormData({ name: '', phone: '' });

            // Optimistically insert at the top of the list for immediate visibility
            const newVendor = { ...createRes.data };
            if (newVendor._count === undefined) {
                newVendor._count = { purchases: 0, deposits: 0 };
            }
            setVendors((prev: any) => [newVendor, ...prev.filter((v: any) => v.id !== newVendor.id)]);
        } catch (err: any) {
            const msg = err.response?.data?.message || err.message || 'Failed to create vendor';
            toast({ title: 'Error', description: Array.isArray(msg) ? msg[0] : msg, variant: 'destructive' });
        } finally {
            setCreateLoading(false);
        }
    };

    const columns = [
        { header: 'ID', accessorKey: 'id' as const },
        { header: 'Name', accessorKey: 'name' as const },
        { header: 'Phone', accessorKey: 'phone' as const },
    ];

    return (
        <AppLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold">Vendors</h1>
                        <p className="text-muted-foreground mt-1">Manage vendor directory.</p>
                    </div>
                    <Button onClick={() => setIsCreateOpen(true)}>
                        <PlusCircle className="mr-2 h-4 w-4" /> Add Vendor
                    </Button>
                </div>

                <DataTable columns={columns} data={vendors} isLoading={loading} />

                <EntityModal
                    open={isCreateOpen}
                    onOpenChange={setIsCreateOpen}
                    title="Add New Vendor"
                    onSubmit={handleCreate}
                    loading={createLoading}
                >
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label>Vendor Name</Label>
                            <Input
                                required
                                value={formData.name}
                                onChange={e => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Phone</Label>
                            <Input
                                value={formData.phone}
                                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                            />
                        </div>
                    </div>
                </EntityModal>
            </div>
        </AppLayout>
    );
}
