
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface Reason {
    id: string;
    name: string;
    category: string;
}

export default function TicketReasons() {
    const [data, setData] = useState<Reason[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get<Reason[]>('/ticket-reasons'); // Public endpoint usually, or admin
                setData(res.data || []);
            } catch (err: any) {
                // Try admin endpoint if fail
                try {
                    const res2 = await api.get<Reason[]>('/admin/ticket-reasons');
                    setData(res2.data || []);
                } catch {
                    if (err.response?.status === 401) {
                        setError('Not authenticated.');
                    } else {
                        setError('Failed to fetch reasons');
                    }
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div>Loading...</div>;
    if (error) return <div className="text-destructive">{error}</div>;

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">Ticket Reasons</h1>
            {data.length === 0 ? (
                <div className="text-muted-foreground">No records found.</div>
            ) : (
                <ul className="space-y-2">
                    {data.map((item) => (
                        <li key={item.id} className="p-2 border rounded">
                            <div className="font-medium">{item.name} ({item.category})</div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
