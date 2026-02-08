import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable } from '@/components/shared/DataTable';
import { FiltersBar } from '@/components/shared/FiltersBar';

interface Order {
    id: string;
    order_number: string;
    customer_name: string;
    shipping_company?: { name: string };
    status: string;
    created_at: string;
}

export default function Orders() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [companies, setCompanies] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');

    // Form
    const [customerName, setCustomerName] = useState('');
    const [selectedCompany, setSelectedCompany] = useState('');
    const [orderNumber, setOrderNumber] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const [ordersRes, compRes] = await Promise.all([
                api.get<Order[]>('/orders'),
                api.get('/shipping/companies')
            ]);
            setOrders(ordersRes.data);
            setCompanies(compRes.data);
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
        if (!customerName || !selectedCompany) {
            toast.error('Please fill required fields');
            return;
        }
        try {
            await api.post('/orders', {
                customer_name: customerName,
                shipping_company_id: selectedCompany,
                order_number: orderNumber || undefined
            });
            toast.success('Order created');
            setCustomerName('');
            setSelectedCompany('');
            setOrderNumber('');
            fetchData();
        } catch (err: any) {
            toast.error('Failed to create order');
        }
    };

    const filteredOrders = orders.filter(o =>
        o.order_number.toLowerCase().includes(search.toLowerCase()) ||
        o.customer_name.toLowerCase().includes(search.toLowerCase())
    );

    const columns = [
        { header: 'Order #', accessorKey: 'order_number' as any, className: 'font-mono font-medium' },
        { header: 'Customer', accessorKey: 'customer_name' as any },
        { header: 'Carrier', accessorKey: 'shipping_company.name' as any, cell: (item: Order) => item.shipping_company?.name || '-' },
        { header: 'Status', accessorKey: 'status' as any },
        { header: 'Date', cell: (item: Order) => new Date(item.created_at).toLocaleDateString() },
    ];

    return (
        <div className="space-y-6">
            <PageHeader
                title="Orders"
                description="Manage customer orders and shipments."
            />

            <Card>
                <CardHeader>
                    <CardTitle>Create New Order</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Customer Name</label>
                            <Input value={customerName} onChange={e => setCustomerName(e.target.value)} placeholder="John Doe" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Shipping Company</label>
                            <Select value={selectedCompany} onValueChange={setSelectedCompany}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select carrier" />
                                </SelectTrigger>
                                <SelectContent>
                                    {companies.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Order Number (Optional)</label>
                            <Input value={orderNumber} onChange={e => setOrderNumber(e.target.value)} placeholder="Auto-generated if empty" />
                        </div>
                    </div>
                    <Button onClick={handleCreate}><Plus className="mr-2 h-4 w-4" /> Create Order</Button>
                </CardContent>
            </Card>

            <FiltersBar
                onSearch={setSearch}
                searchValue={search}
                searchPlaceholder="Search orders..."
                onReset={() => setSearch('')}
            />

            <DataTable
                data={filteredOrders}
                isLoading={loading}
                emptyMessage="No orders found."
                columns={columns}
            />
        </div>
    );
}
