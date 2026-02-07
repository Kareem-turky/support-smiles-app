
import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/contexts/useAuth';
import { Button } from '@/components/ui/button';

interface Purchase {
    id: string;
    vendor_name: string;
    total_amount: string;
    date: string;
}

export default function Purchases() {
    const [data, setData] = useState<Purchase[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get<Purchase[]>('/accounting/purchases');
                setData(res.data || []);
            } catch (err: any) {
                if (err.response?.status === 401) {
                    setError('Not authenticated. Please login.');
                } else {
                    setError('Failed to fetch purchases');
                }
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div>Loading...</div>;
    if (error) return (
        <div className="p-4 bg-destructive/10 text-destructive rounded-md">
            {error}
            {error.includes('login') && <Button className="ml-4" onClick={() => window.location.href = '/login'}>Login</Button>}
        </div>
    );

    return (
        <div className="space-y-4">
            <h1 className="text-2xl font-bold">Purchases</h1>
            {data.length === 0 ? (
                <div className="text-muted-foreground">No records found.</div>
            ) : (
                <table className="w-full border-collapse">
                    <thead>
                        <tr className="border-b text-left">
                            <th className="p-2">Vendor</th>
                            <th className="p-2">Amount</th>
                            <th className="p-2">Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {data.map((item) => (
                            <tr key={item.id} className="border-b">
                                <td className="p-2">{item.vendor_name}</td>
                                <td className="p-2">${item.total_amount}</td>
                                <td className="p-2">{new Date(item.date).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
}
