import { useEffect, useState } from 'react';
import { HRService, HRAttendance, Employee } from '@/services/hr';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { EntityModal } from '@/components/shared/EntityModal';
import { toast } from 'sonner';
import { Combobox } from '@/components/ui/combobox';

export default function AttendancePage() {
    const [data, setData] = useState<HRAttendance[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);

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

    const handleSubmit = async () => {
        if (!formData.employee_id) {
            toast.error('Select employee');
            return;
        }
        setSaving(true);
        try {
            await HRService.upsertAttendance(formData);
            toast.success('Attendance saved');
            setOpen(false);
            fetchData();
        } catch (err) {
            console.error(err);
            toast.error('Failed to save attendance');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Attendance</h1>
                <Button onClick={() => setOpen(true)}>Mark Attendance</Button>
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
                                {data.length === 0 ? (
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

            <EntityModal
                open={open}
                onOpenChange={setOpen}
                title="Mark Attendance"
                loading={saving}
                onSubmit={handleSubmit as any}
            >
                <div>
                    <Label className="mb-2 block">Employee</Label>
                    <Combobox
                        options={employees.map(emp => ({ label: `${emp.full_name} (${emp.code})`, value: emp.id }))}
                        value={formData.employee_id}
                        onChange={(val) => setFormData({ ...formData, employee_id: val })}
                        placeholder="Select Employee"
                        searchPlaceholder="Search employees..."
                    />
                </div>
                <div>
                    <Label className="mb-2 block">Date</Label>
                    <Input
                        type="date"
                        value={formData.date}
                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    />
                </div>
                <div>
                    <Label className="mb-2 block">Status</Label>
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
                    <Label className="mb-2 block">Minutes Late</Label>
                    <Input
                        type="number"
                        value={formData.minutes_late}
                        onChange={(e) => setFormData({ ...formData, minutes_late: parseInt(e.target.value) })}
                    />
                </div>
                <div>
                    <Label className="mb-2 block">Notes</Label>
                    <Input
                        value={formData.notes}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                </div>
            </EntityModal>
        </div>
    );
}
