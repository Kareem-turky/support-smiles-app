import { useEffect, useState } from 'react';
import { HRService, Employee, Department } from '@/services/hr';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { EntityModal } from '@/components/shared/EntityModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Combobox } from '@/components/ui/combobox';

export default function Employees() {
    const [data, setData] = useState<Employee[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        code: '',
        department_id: '',
        salary_type: 'MONTHLY',
        base_salary: 0,
        start_date: new Date().toISOString().split('T')[0],
    });

    // Department Creation
    const [deptModalOpen, setDeptModalOpen] = useState(false);
    const [newDeptName, setNewDeptName] = useState('');
    const [creatingDept, setCreatingDept] = useState(false);

    const fetchData = async () => {
        setLoading(true);
        try {
            const [emps, depts] = await Promise.all([
                HRService.getEmployees(),
                HRService.getDepartments()
            ]);
            setData(emps);
            setDepartments(depts);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = async () => {
        if (!formData.full_name || !formData.code || !formData.department_id) {
            toast.error('Please fill in all required fields');
            return;
        }
        setSaving(true);
        try {
            await HRService.createEmployee(formData);
            toast.success('Employee created successfully');
            setOpen(false);
            setFormData({
                full_name: '',
                code: '',
                department_id: '',
                salary_type: 'MONTHLY',
                base_salary: 0,
                start_date: new Date().toISOString().split('T')[0],
            });
            fetchData();
        } catch (err) {
            console.error(err);
            toast.error('Failed to create employee');
        } finally {
            setSaving(false);
        }
    };

    const handleCreateDepartment = async (name: string) => {
        setCreatingDept(true);
        try {
            const dept = await HRService.createDepartment(name);
            setDepartments([...departments, dept]);
            setFormData({ ...formData, department_id: dept.id });
            toast.success(`Department "${name}" created`);
            setDeptModalOpen(false);
            setNewDeptName('');
        } catch (error) {
            console.error(error);
            toast.error('Failed to create department');
        } finally {
            setCreatingDept(false);
        }
    };

    if (loading) return <div className="p-8 text-center">Loading employees...</div>;
    if (error) return <div className="p-8 text-center text-destructive">{error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">Employees</h1>
                <Button onClick={() => setOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> New Employee
                </Button>
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

            <EntityModal
                open={deptModalOpen}
                onOpenChange={setDeptModalOpen}
                title="Create New Department"
                loading={creatingDept}
                onSubmit={async (e) => { e.preventDefault(); await handleCreateDepartment(newDeptName); }}
                submitLabel="Create Department"
                width="sm:max-w-[400px]"
            >
                <div>
                    <Label className="mb-2 block">Department Name</Label>
                    <Input
                        value={newDeptName}
                        onChange={(e) => setNewDeptName(e.target.value)}
                        placeholder="Enter department name"
                        autoFocus
                    />
                </div>
            </EntityModal>

            <EntityModal
                open={open}
                onOpenChange={setOpen}
                title="Add New Employee"
                loading={saving}
                onSubmit={handleCreate as any}
            >
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className="mb-2 block">Code *</Label>
                        <Input
                            value={formData.code}
                            onChange={e => setFormData({ ...formData, code: e.target.value })}
                            placeholder="EMP-001"
                            required
                        />
                    </div>
                    <div>
                        <Label className="mb-2 block">Full Name *</Label>
                        <Input
                            value={formData.full_name}
                            onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                            placeholder="John Doe"
                            required
                        />
                    </div>
                </div>

                <div>
                    <Label className="mb-2 block">Department *</Label>
                    <Combobox
                        options={departments.map(d => ({ label: d.name, value: d.id }))}
                        value={formData.department_id}
                        onChange={(val) => setFormData({ ...formData, department_id: val })}
                        placeholder="Select Department"
                        searchPlaceholder="Search departments..."
                        onCreate={(inputValue) => {
                            setNewDeptName(inputValue);
                            setDeptModalOpen(true);
                        }}
                        createLabel="Add Department"
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className="mb-2 block">Salary Type</Label>
                        <Select
                            value={formData.salary_type}
                            onValueChange={val => setFormData({ ...formData, salary_type: val })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="MONTHLY">Monthly</SelectItem>
                                <SelectItem value="DAILY">Daily</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="mb-2 block">Base Salary</Label>
                        <Input
                            type="number"
                            value={formData.base_salary}
                            onChange={e => setFormData({ ...formData, base_salary: Number(e.target.value) })}
                        />
                    </div>
                </div>

                <div>
                    <Label className="mb-2 block">Start Date</Label>
                    <Input
                        type="date"
                        value={formData.start_date}
                        onChange={e => setFormData({ ...formData, start_date: e.target.value })}
                    />
                </div>
            </EntityModal>
        </div>
    );
}
