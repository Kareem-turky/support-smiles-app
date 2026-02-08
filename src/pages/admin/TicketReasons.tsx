import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

interface Reason {
    id: string;
    name: string;
    category: string;
}

export default function TicketReasons() {
    const [data, setData] = useState<Reason[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            // In a real app we'd have a service for this
            try {
                // Try admin endpoint first as we are in admin section
                try {
                    const res = await api.get<Reason[]>('/admin/ticket-reasons');
                    setData(res.data || []);
                } catch {
                    // Fallback to public if admin fails (or different path)
                    const res = await api.get<Reason[]>('/ticket-reasons');
                    setData(res.data || []);
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    const columns = [
        { header: 'Name', accessorKey: 'name' as any, className: 'font-medium' },
        { header: 'Category', accessorKey: 'category' as any },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Ticket Reasons"
                description="Manage reasons for ticket creation."
                actions={<Button variant="outline"><Plus className="mr-2 h-4 w-4" /> Add Reason</Button>}
            />

            <DataTable
                data={data}
                isLoading={loading}
                emptyMessage="No ticket reasons found."
                columns={columns}
            />
        </div>
    );
}
