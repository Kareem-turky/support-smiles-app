import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/useAuth';

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
        try {
            const res = await api.get('/shipping/companies');
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
            fetchData();
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold">Shipping Companies</h1>

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

            <Card>
                <CardHeader>
                    <CardTitle>Companies List</CardTitle>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.map((item) => (
                                <TableRow key={item.id}>
                                    <TableCell className="font-medium">{item.name}</TableCell>
                                    <TableCell>{item.is_active ? 'Active' : 'Inactive'}</TableCell>
                                    <TableCell>
                                        <Button variant="ghost" size="icon" disabled><Trash2 className="h-4 w-4" /></Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
