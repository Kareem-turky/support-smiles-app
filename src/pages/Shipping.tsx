import { useEffect, useState } from 'react';
import { ShippingService, ShippingCompany } from '@/services/shipping';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { EntityModal } from '@/components/shared/EntityModal';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function Shipping() {
    const [data, setData] = useState<ShippingCompany[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [newName, setNewName] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await ShippingService.getCompanies();
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
        if (!newName.trim()) {
            toast.error('Company name required');
            return;
        }
        setSaving(true);
        try {
            await ShippingService.createCompany(newName);
            toast.success('Shipping company added');
            setOpen(false);
            setNewName('');
            fetchData();
        } catch (err) {
            console.error(err);
            toast.error('Failed to add company');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure?')) return;
        try {
            await ShippingService.deleteCompany(id);
            toast.success('Company deleted');
            fetchData();
        } catch (err) {
            console.error(err);
            toast.error('Failed to delete company');
        }
    }

    const columns = [
        { header: 'Name', accessorKey: 'name' as any, className: 'font-medium' },
        { header: 'Status', cell: (item: ShippingCompany) => item.is_active ? 'Active' : 'Inactive' },
        {
            header: 'Actions', cell: (item: ShippingCompany) => (
                <Button variant="ghost" size="icon" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Shipping Companies"
                description="Manage courier and shipping partners."
                actions={
                    <Button onClick={() => setOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Add Company
                    </Button>
                }
            />

            <DataTable
                data={data}
                isLoading={loading}
                emptyMessage="No shipping companies found."
                columns={columns}
            />

            <EntityModal
                open={open}
                onOpenChange={setOpen}
                title="Add Shipping Company"
                loading={saving}
                onSubmit={handleCreate as any}
            >
                <div>
                    <Label className="mb-2 block">Company Name</Label>
                    <Input
                        value={newName}
                        onChange={e => setNewName(e.target.value)}
                        placeholder="e.g. Aramex"
                        required
                    />
                </div>
            </EntityModal>
        </div>
    );
}
