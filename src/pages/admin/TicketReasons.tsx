import { useEffect, useState } from 'react';
import { AdminService, TicketReason } from '@/services/admin';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { EntityModal } from '@/components/shared/EntityModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';

export default function TicketReasons() {
    const [data, setData] = useState<TicketReason[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal state
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({ name: '', category: 'OTHER' });

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await AdminService.getTicketReasons();
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
        if (!formData.name) return;
        setSaving(true);
        try {
            await AdminService.createTicketReason(formData);
            toast.success('Reason created successfully');
            setOpen(false);
            setFormData({ name: '', category: 'OTHER' });
            fetchData();
        } catch (err) {
            console.error(err);
            toast.error('Failed to create reason');
        } finally {
            setSaving(false);
        }
    };

    const columns = [
        { header: 'Name', accessorKey: 'name' as any, className: 'font-medium' },
        { header: 'Category', accessorKey: 'category' as any },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Ticket Reasons"
                description="Manage reasons for ticket creation."
                actions={
                    <Button onClick={() => setOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Add Reason
                    </Button>
                }
            />

            <DataTable
                data={data}
                isLoading={loading}
                emptyMessage="No ticket reasons found."
                columns={columns}
            />

            <EntityModal
                open={open}
                onOpenChange={setOpen}
                title="Add Ticket Reason"
                loading={saving}
                onSubmit={handleCreate as any}
            >
                <div>
                    <Label className="mb-2 block">Name</Label>
                    <Input
                        value={formData.name}
                        onChange={e => setFormData({ ...formData, name: e.target.value })}
                        placeholder="e.g. Printer Issue"
                        required
                    />
                </div>
                <div>
                    <Label className="mb-2 block">Category</Label>
                    <Select
                        value={formData.category}
                        onValueChange={val => setFormData({ ...formData, category: val })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ACCOUNTING">Accounting</SelectItem>
                            <SelectItem value="CS">CS</SelectItem>
                            <SelectItem value="SHIPPING">Shipping</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </EntityModal>
        </div>
    );
}
