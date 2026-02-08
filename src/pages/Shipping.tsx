import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/useAuth';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

interface ShippingCompany {
    id: string;
    name: string;
    is_active: boolean;
}

export default function Shipping() {
    const [data, setData] = useState<ShippingCompany[]>([]);
    const [loading, setLoading] = useState(true);
    const [newName, setNewName] = useState('');
    const { user } = useAuth(); // Assume only Admin/Accounting can edit

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await api.get<ShippingCompany[]>('/shipping/companies');
            setData(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await api.post('/shipping/companies', { name: newName });
            setNewName('');
            toast.success('Shipping company added');
            fetchData();
        } catch (err) {
            console.error(err);
            toast.error('Failed to add company');
        }
    };

    const columns = [
        { header: 'Name', accessorKey: 'name' as any, className: 'font-medium' },
        { header: 'Status', cell: (item: ShippingCompany) => item.is_active ? 'Active' : 'Inactive' },
        {
            header: 'Actions', cell: (item: ShippingCompany) => (
                <Button variant="ghost" size="icon" disabled><Trash2 className="h-4 w-4" /></Button>
            )
        },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Shipping Companies"
                description="Manage courier and shipping partners."
            />

            <Card>
                <CardHeader>
                    <CardTitle>Add Company</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleCreate} className="flex gap-4">
                        <Input
                            value={newName}
                            onChange={e => setNewName(e.target.value)}
                            placeholder="Company Name (e.g. Aramex)"
                            className="max-w-md"
                        />
                        <Button type="submit"><Plus className="mr-2 h-4 w-4" /> Add</Button>
                    </form>
                </CardContent>
            </Card>

            <DataTable
                data={data}
                isLoading={loading}
                emptyMessage="No shipping companies found."
                columns={columns}
            />
        </div>
    );
}
