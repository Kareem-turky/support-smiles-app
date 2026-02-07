import { useEffect, useState } from 'react';
import { AccountingService, Transfer } from '@/services/accounting';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Search } from 'lucide-react';
import { format } from 'date-fns';

export default function Transfers() {
    const [data, setData] = useState<Transfer[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    const fetchData = async () => {
        setLoading(true);
        try {
            // Note: need to add filtering support to AccountingService & Backend if not exists
            // For now assuming getAll returns all and we client filter or backend accepts params
            // Start simple: fetch all
            const result = await AccountingService.getTransfers();
            setData(result);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch transfers');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const filteredData = data.filter(item => {
        if (dateFrom && new Date(item.date) < new Date(dateFrom)) return false;
        if (dateTo && new Date(item.date) > new Date(dateTo)) return false;
        return true;
    });

    const totalAmount = filteredData.reduce((sum, item) => sum + Number(item.amount), 0);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Transfers</h1>
                <Button><Plus className="mr-2 h-4 w-4" /> New Transfer</Button>
            </div>

            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Transfers</CardTitle>
                    <div className="text-2xl font-bold">${totalAmount.toFixed(2)}</div>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 mb-4 items-end">
                        <div className="grid gap-1.5">
                            <label className="text-sm font-medium">From</label>
                            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                        </div>
                        <div className="grid gap-1.5">
                            <label className="text-sm font-medium">To</label>
                            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                        </div>
                    </div>

                    {loading ? (
                        <div className="text-center py-4">Loading...</div>
                    ) : error ? (
                        <div className="text-center py-4 text-destructive">{error}</div>
                    ) : filteredData.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">No records found.</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Method</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Amount</TableHead>
                                    <TableHead>Notes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredData.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.type}</TableCell>
                                        <TableCell>{item.method}</TableCell>
                                        <TableCell>{format(new Date(item.date), 'PPP')}</TableCell>
                                        <TableCell>${Number(item.amount).toFixed(2)}</TableCell>
                                        <TableCell>{item.notes || '-'}</TableCell>
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
