import { useEffect, useState } from 'react';
import { HRService, Adjustment } from '@/services/hr';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { format } from 'date-fns';

export default function Advances() {
    const [data, setData] = useState<Adjustment[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            const result = await HRService.getAdjustments({
                type: 'ADVANCE',
                from: dateFrom || undefined,
                to: dateTo || undefined
            });
            setData(result);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch advances');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleFilter = (e: React.FormEvent) => {
        e.preventDefault();
        fetchData();
    };

    const totalAmount = data.reduce((sum, item) => sum + Number(item.amount), 0);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Advances (سلف)</h1>
                <Button><Plus className="mr-2 h-4 w-4" /> New Advance</Button>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Advances</CardTitle>
                    <div className="text-2xl font-bold">${totalAmount.toFixed(2)}</div>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleFilter} className="flex gap-4 mb-4 items-end">
                        <div className="grid gap-1.5">
                            <label className="text-sm font-medium">From</label>
                            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                        </div>
                        <div className="grid gap-1.5">
                            <label className="text-sm font-medium">To</label>
                            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                        </div>
                        <Button type="submit" variant="secondary"><Search className="h-4 w-4 mr-2" /> Filter</Button>
                    </form>

                    {loading ? (
                        <div className="text-center py-4">Loading...</div>
                    ) : error ? (
                        <div className="text-center py-4 text-destructive">{error}</div>
                    ) : data.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">No records found.</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Reason</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell className="font-medium">{item.employee?.full_name || 'Unknown'}</TableCell>
                                        <TableCell>{format(new Date(item.date), 'PPP')}</TableCell>
                                        <TableCell>${Number(item.amount).toFixed(2)}</TableCell>
                                        <TableCell>{item.reason}</TableCell>
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
