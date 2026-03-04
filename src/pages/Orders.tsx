import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Building2, Package, Search } from 'lucide-react';
import { OrdersService } from '@/services/orders.service';
import { HRService } from '@/services/hr';
import { ShippingService } from '@/services/shipping';
import { useToast } from '@/components/ui/use-toast';
import { Order, Department, Employee, ShippingCompany } from '@/types';
import { useAuth } from '@/contexts/useAuth';

export default function Orders() {
    const { toast } = useToast();
    const { user } = useAuth();

    const [orders, setOrders] = useState<Order[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [shippingCompanies, setShippingCompanies] = useState<ShippingCompany[]>([]);

    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isAllEmployees, setIsAllEmployees] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    const [formData, setFormData] = useState({
        customer_name: '',
        department_id: '',
        assigned_employee_id: '',
        shipping_company_id: '',
        amount: '',
        notes: ''
    });

    const loadData = async () => {
        try {
            const [ords, depts, emps, ships] = await Promise.all([
                OrdersService.getOrders(),
                HRService.getDepartments(),
                HRService.getEmployees(),
                ShippingService.getCompanies()
            ]);
            setOrders(ords);
            setDepartments(depts);
            setEmployees(emps);
            setShippingCompanies(ships);
        } catch (err) {
            toast({ title: 'Error', description: 'Failed to load data', variant: 'destructive' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleCreate = async () => {
        try {
            await OrdersService.createOrder({
                ...formData,
                amount: formData.amount ? parseFloat(formData.amount) : undefined
            });
            toast({ title: 'Success', description: 'Order created successfully' });
            setIsModalOpen(false);
            setFormData({ customer_name: '', department_id: '', assigned_employee_id: '', shipping_company_id: '', amount: '', notes: '' });
            loadData();
        } catch (err) {
            toast({ title: 'Error', description: 'Failed to create order', variant: 'destructive' });
        }
    };

    const filteredEmployees = isAllEmployees
        ? employees
        : employees.filter(e => e.department_id === formData.department_id);

    const filteredOrders = orders.filter(o =>
        o.order_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (o.customer_name && o.customer_name.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6 max-w-7xl mx-auto">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Orders Management</h1>
                    <p className="text-muted-foreground mt-1 text-lg">
                        Track, assign, and manage customer orders across all departments.
                    </p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> New Order
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Orders List</CardTitle>
                        <div className="relative w-64">
                            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search orders..." className="pl-8" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Order #</TableHead>
                                <TableHead>Customer</TableHead>
                                <TableHead>Target Dept</TableHead>
                                <TableHead>Assignee</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Date</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {loading ? (
                                <TableRow><TableCell colSpan={7} className="text-center">Loading...</TableCell></TableRow>
                            ) : filteredOrders.map(order => (
                                <TableRow key={order.id}>
                                    <TableCell className="font-medium text-primary">{order.order_number}</TableCell>
                                    <TableCell>{order.customer_name || 'N/A'}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-muted-foreground" />
                                            {order.department?.name}
                                        </div>
                                    </TableCell>
                                    <TableCell>{order.assigned_employee?.full_name || 'Unassigned'}</TableCell>
                                    <TableCell><span className={`px-2 py-1 rounded-full text-xs font-bold ${order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>{order.status}</span></TableCell>
                                    <TableCell>{order.amount ? `$${order.amount}` : '-'}</TableCell>
                                    <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                                </TableRow>
                            ))}
                            {(!loading && filteredOrders.length === 0) && (
                                <TableRow><TableCell colSpan={7} className="text-center py-6 text-muted-foreground">No orders found.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Create Cross-Department Order</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label>Customer Name</Label>
                            <Input value={formData.customer_name} onChange={e => setFormData({ ...formData, customer_name: e.target.value })} placeholder="Optional" />
                        </div>
                        <div className="space-y-2">
                            <Label>Target Department</Label>
                            <Select value={formData.department_id} onValueChange={val => setFormData({ ...formData, department_id: val, assigned_employee_id: '' })}>
                                <SelectTrigger><SelectValue placeholder="Select target department" /></SelectTrigger>
                                <SelectContent>
                                    {departments.map(d => (
                                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2 p-3 bg-muted/50 rounded-lg border">
                            <div className="flex justify-between items-center mb-2">
                                <Label>Assignee (Optional)</Label>
                                {user?.role === 'ADMIN' && (
                                    <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={() => setIsAllEmployees(!isAllEmployees)}>
                                        {isAllEmployees ? 'Showing All' : 'Show All Employees'}
                                    </Button>
                                )}
                            </div>
                            <Select value={formData.assigned_employee_id} onValueChange={val => setFormData({ ...formData, assigned_employee_id: val })}>
                                <SelectTrigger disabled={!formData.department_id && !isAllEmployees}>
                                    <SelectValue placeholder={!formData.department_id && !isAllEmployees ? "Select department first" : "Select employee"} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="unassigned">Unassigned</SelectItem>
                                    {filteredEmployees.map(e => (
                                        <SelectItem key={e.id} value={e.id}>{e.full_name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label>Shipping Company</Label>
                            <Select value={formData.shipping_company_id} onValueChange={val => setFormData({ ...formData, shipping_company_id: val })}>
                                <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                                <SelectContent>
                                    {shippingCompanies.map(c => (
                                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                        <Button onClick={handleCreate} disabled={!formData.department_id}>Create Order</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
