import { useEffect, useState } from 'react';
import { HRService, HRAttendance, Employee } from '@/services/hr';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function AttendancePage() {
    const [data, setData] = useState<HRAttendance[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [open, setOpen] = useState(false);

    // Filters
    const [fromDate, setFromDate] = useState(format(startOfMonth(new Date()), 'yyyy-MM-dd'));
    const [toDate, setToDate] = useState(format(endOfMonth(new Date()), 'yyyy-MM-dd'));

    // Form
    const [formData, setFormData] = useState({
        employee_id: '',
        date: format(new Date(), 'yyyy-MM-dd'),
        status: 'PRESENT',
        minutes_late: 0,
        notes: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [attendanceRes, employeesRes] = await Promise.all([
                HRService.getAttendance({ from: fromDate, to: toDate }),
                HRService.getEmployees()
            ]);
            setData(attendanceRes);
            setEmployees(employeesRes);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load attendance data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [fromDate, toDate]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await HRService.upsertAttendance(formData);
            toast.success('Attendance saving...');
            setOpen(false);
            fetchData();
        } catch (err) {
            console.error(err);
            toast.error('Failed to save attendance');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Attendance</h1>
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <Button>Mark Attendance</Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Mark Attendance</DialogTitle>
                        </DialogHeader>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <Label>Employee</Label>
                                <Select
                                    value={formData.employee_id}
                                    onValueChange={(val) => setFormData({ ...formData, employee_id: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select Employee" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {employees.map(emp => (
                                            <SelectItem key={emp.id} value={emp.id}>{emp.full_name} ({emp.code})</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Date</Label>
                                <Input
                                    type="date"
                                    value={formData.date}
                                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                />
                            </div>
                            <div>
                                <Label>Status</Label>
                                <Select
                                    value={formData.status}
                                    onValueChange={(val) => setFormData({ ...formData, status: val })}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="PRESENT">Present</SelectItem>
                                        <SelectItem value="ABSENT">Absent</SelectItem>
                                        <SelectItem value="LEAVE">Leave</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Minutes Late</Label>
                                <Input
                                    type="number"
                                    value={formData.minutes_late}
                                    onChange={(e) => setFormData({ ...formData, minutes_late: parseInt(e.target.value) })}
                                />
                            </div>
                            <div>
                                <Label>Notes</Label>
                                <Input
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                />
                            </div>
                            <Button type="submit" className="w-full">Save</Button>
                        </form>
                    </DialogContent>
                </Dialog>
            </div>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Attendance Records</CardTitle>
                        <div className="flex gap-2">
                            <Input
                                type="date"
                                value={fromDate}
                                onChange={(e) => setFromDate(e.target.value)}
                                className="w-auto"
                            />
                            <Input
                                type="date"
                                value={toDate}
                                onChange={(e) => setToDate(e.target.value)}
                                className="w-auto"
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Late (min)</TableHead>
                                    <TableHead>Notes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {loading ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8">
                                            <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                                        </TableCell>
                                    </TableRow>
                                ) : data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            No attendance records found for this period.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>{format(new Date(item.date), 'yyyy-MM-dd')}</TableCell>
                                            <TableCell>
                                                <div className="font-medium">{item.employee?.full_name}</div>
                                                <div className="text-xs text-muted-foreground">{item.employee?.code}</div>
                                            </TableCell>
                                            <TableCell>
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.status === 'PRESENT' ? 'bg-green-100 text-green-800' :
                                                        item.status === 'ABSENT' ? 'bg-red-100 text-red-800' :
                                                            'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {item.status}
                                                </span>
                                            </TableCell>
                                            <TableCell>{item.minutes_late}</TableCell>
                                            <TableCell>{item.notes || '-'}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
