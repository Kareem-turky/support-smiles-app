
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

interface PayrollItem {
    id: string;
    month: number;
    year: number;
    status: string;
    total_amount?: string;
}

export default function Payroll() {
    const [data, setData] = useState<PayrollItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get<PayrollItem[]>('/accounting/payroll');
                setData(res.data || []);
            } catch (err: any) {
                if (err.response?.status === 401) {
                    setError('Not authenticated.');
                } else {
                    setError('Failed to fetch payroll');
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
            <h1 className="text-2xl font-bold">Payroll</h1>
            {data.length === 0 ? (
                <div className="text-muted-foreground">No records found.</div>
            ) : (
                <ul className="space-y-2">
                    {data.map((item) => (
                        <li key={item.id} className="p-2 border rounded">
                            <div className="font-medium">{item.month}/{item.year} - {item.status}</div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
