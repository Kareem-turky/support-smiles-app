import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

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

    // Form
    const [customerName, setCustomerName] = useState('');
    const [selectedCompany, setSelectedCompany] = useState('');
    const [orderNumber, setOrderNumber] = useState(''); // Optional, backend gen usually

    const fetchData = async () => {
        try {
            const [ordersRes, compRes] = await Promise.all([
                api.get('/orders'),
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
                order_number: orderNumber || undefined // Let backend gen if empty
            });
            toast.success('Order created');
            // reset
            setCustomerName('');
            setSelectedCompany('');
            setOrderNumber('');
            fetchData();
        } catch (err: any) {
            toast.error('Failed to create order');
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Orders</h1>

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

            <Card>
                <CardHeader>
                    <CardTitle>Recent Orders</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order #</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Carrier</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {orders.map((order) => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-mono">{order.order_number}</TableCell>
                                    <TableCell>{order.customer_name}</TableCell>
                                    <TableCell>{order.shipping_company?.name || '-'}</TableCell>
                                    <TableCell>{order.status}</TableCell>
                                    <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
