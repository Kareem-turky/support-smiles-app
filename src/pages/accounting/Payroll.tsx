import { useEffect, useState } from 'react';
import { AccountingService, PayrollRun } from '@/services/accounting';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Calculator } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { EntityModal } from '@/components/shared/EntityModal';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function Payroll() {
    const [data, setData] = useState<PayrollRun[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // modal
    const [open, setOpen] = useState(false);
    const [calculating, setCalculating] = useState(false);
    const [period, setPeriod] = useState({ year: new Date().getFullYear(), month: new Date().getMonth() + 1 });

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await AccountingService.getPayrollRuns();
            setData(res);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch payroll runs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCalculate = async () => {
        setCalculating(true);
        try {
            await AccountingService.calculatePayroll(period.year, period.month);
            toast.success('Payroll calculated successfully');
            setOpen(false);
            fetchData();
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.message || 'Failed to calculate payroll');
        } finally {
            setCalculating(false);
        }
    };

    const filteredData = data.filter(item => {
        const itemDate = new Date(item.year, item.month - 1, 1);
        if (dateFrom && itemDate < new Date(dateFrom)) return false;
        if (dateTo && itemDate > new Date(dateTo)) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Payroll</h1>
                <Button onClick={() => setOpen(true)}>
                    <Calculator className="mr-2 h-4 w-4" /> Calculate Payroll
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Payroll Runs</CardTitle>
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
                    {filteredData.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">No records found.</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Period</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredData.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.month}/{item.year}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${item.status === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                                                {item.status}
                                            </span>
                                        </TableCell>
                                        <TableCell>
                                            <Button variant="outline" size="sm">View</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </CardContent>
            </Card>

            <EntityModal
                open={open}
                onOpenChange={setOpen}
                title="Calculate Payroll"
                description="This will calculate payroll for all active employees for the selected period."
                loading={calculating}
                onSubmit={handleCalculate as any}
                submitLabel="Calculate"
                width="sm:max-w-[400px]"
            >
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className="mb-2 block">Year</Label>
                        <Input
                            type="number"
                            value={period.year}
                            onChange={e => setPeriod({ ...period, year: parseInt(e.target.value) })}
                        />
                    </div>
                    <div>
                        <Label className="mb-2 block">Month</Label>
                        <Input
                            type="number"
                            min={1}
                            max={12}
                            value={period.month}
                            onChange={e => setPeriod({ ...period, month: parseInt(e.target.value) })}
                        />
                    </div>
                </div>
            </EntityModal>
        </div>
    );
}
