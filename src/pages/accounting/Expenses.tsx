
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';

interface Expense {
    id: string;
    category: string;
    description: string;
    amount: string;
    date: string;
}

export default function Expenses() {
    const [data, setData] = useState<Expense[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get<Expense[]>('/accounting/expenses');
                setData(res.data || []);
            } catch (err: any) {
                if (err.response?.status === 401) {
                    setError('Not authenticated.');
                } else {
                    setError('Failed to fetch expenses');
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
            <h1 className="text-2xl font-bold">Expenses</h1>
            {data.length === 0 ? (
                <div className="text-muted-foreground">No records found.</div>
            ) : (
                <ul className="space-y-2">
                    {data.map((item) => (
                        <li key={item.id} className="p-2 border rounded">
                            <div className="font-medium">{item.category} - ${item.amount}</div>
                            <div className="text-sm text-muted-foreground">{new Date(item.date).toLocaleDateString()}</div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
