import { useEffect, useState } from 'react';
import { HRService, Employee } from '@/services/hr';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';

export default function Employees() {
    const [data, setData] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                const result = await HRService.getEmployees();
                setData(result);
            } catch (err: any) {
                setError(err.message || 'Failed to fetch employees');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return <div className="p-8 text-center">Loading employees...</div>;
    if (error) return <div className="p-8 text-center text-destructive">{error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Employees</h1>
                <Button><Plus className="mr-2 h-4 w-4" /> New Employee</Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Employee Directory</CardTitle>
                </CardHeader>
                <CardContent>
                    {data.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">No employees found.</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Code</TableHead>
                                    <TableHead>Name</TableHead>
                                    <TableHead>Department</TableHead>
                                    <TableHead>Salary Type</TableHead>
                                    <TableHead>Start Date</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.code}</TableCell>
                                        <TableCell>{item.full_name}</TableCell>
                                        <TableCell>{item.department?.name || '-'}</TableCell>
                                        <TableCell>{item.salary_type}</TableCell>
                                        <TableCell>{new Date(item.start_date).toLocaleDateString()}</TableCell>
                                        <TableCell>
                                            <Badge variant={item.is_active ? 'default' : 'secondary'}>
                                                {item.is_active ? 'Active' : 'Inactive'}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
