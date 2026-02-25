import { useEffect, useState } from 'react';
import { HRService, HRLeave, Employee } from '@/services/hr';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { format } from 'date-fns';
import { EntityModal } from '@/components/shared/EntityModal';
import { toast } from 'sonner';
import { Combobox } from '@/components/ui/combobox';

export default function LeavesPage() {
    const [data, setData] = useState<HRLeave[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);

    // Modal
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);

    // Form
    const [formData, setFormData] = useState({
        employee_id: '',
        from_date: format(new Date(), 'yyyy-MM-dd'),
        to_date: format(new Date(), 'yyyy-MM-dd'),
        leave_type: 'ANNUAL',
        notes: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            const [leavesRes, employeesRes] = await Promise.all([
                HRService.getLeaves(),
                HRService.getEmployees()
            ]);
            setData(leavesRes);
            setEmployees(employeesRes);
        } catch (err) {
            console.error(err);
            toast.error('Failed to load leaves data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSubmit = async () => {
        if (!formData.employee_id) {
            toast.error('Select employee');
            return;
        }
        setSaving(true);
        try {
            await HRService.createLeave(formData);
            toast.success('Leave saved');
            setOpen(false);
            fetchData();
        } catch (err) {
            console.error(err);
            toast.error('Failed to save leave');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Leaves</h1>
                <Button onClick={() => setOpen(true)}>Request Leave</Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Leave History</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Employee</TableHead>
                                    <TableHead>From</TableHead>
                                    <TableHead>To</TableHead>
                                    <TableHead>Type</TableHead>
                                    <TableHead>Notes</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                                            No leave records found.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    data.map((item) => (
                                        <TableRow key={item.id}>
                                            <TableCell>
                                                <div className="font-medium">{item.employee?.full_name}</div>
                                                <div className="text-xs text-muted-foreground">{item.employee?.code}</div>
                                            </TableCell>
                                            <TableCell>{format(new Date(item.from_date), 'yyyy-MM-dd')}</TableCell>
                                            <TableCell>{format(new Date(item.to_date), 'yyyy-MM-dd')}</TableCell>
                                            <TableCell>
                                                <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                    {item.leave_type}
                                                </span>
                                            </TableCell>
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
                title="Request Leave"
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
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className="mb-2 block">From Date</Label>
                        <Input
                            type="date"
                            value={formData.from_date}
                            onChange={(e) => setFormData({ ...formData, from_date: e.target.value })}
                        />
                    </div>
                    <div>
                        <Label className="mb-2 block">To Date</Label>
                        <Input
                            type="date"
                            value={formData.to_date}
                            onChange={(e) => setFormData({ ...formData, to_date: e.target.value })}
                        />
                    </div>
                </div>
                <div>
                    <Label className="mb-2 block">Type</Label>
                    <Select
                        value={formData.leave_type}
                        onValueChange={(val) => setFormData({ ...formData, leave_type: val })}
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="ANNUAL">Annual</SelectItem>
                            <SelectItem value="SICK">Sick</SelectItem>
                            <SelectItem value="UNPAID">Unpaid</SelectItem>
                            <SelectItem value="OTHER">Other</SelectItem>
                        </SelectContent>
                    </Select>
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
