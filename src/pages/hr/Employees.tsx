import { useEffect, useState, useCallback } from 'react';
import { HRService } from '@/services/hr';
import { authService } from '@/services/auth.service';
import { useAuth } from '@/contexts/useAuth';
import { Employee, Department } from '@/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, LogIn, MoreHorizontal, Edit, Trash2, Key, Power } from 'lucide-react';
import { EntityModal } from '@/components/shared/EntityModal';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { Combobox } from '@/components/ui/combobox';
import { useTranslation } from 'react-i18next';

export default function Employees() {
    const { t } = useTranslation();
    const [data, setData] = useState<Employee[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const { hasRole } = useAuth();

    // Modal
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);

    const defaultFormData = {
        full_name: '',
        email: '',
        code: '',
        department_id: '',
        salary_type: 'MONTHLY',
        base_salary: 0,
        start_date: new Date().toISOString().split('T')[0],
        role: 'CS_AGENT',
    };
    const [formData, setFormData] = useState(defaultFormData);

    // Department Creation
    const [deptModalOpen, setDeptModalOpen] = useState(false);
    const [newDeptName, setNewDeptName] = useState('');
    const [creatingDept, setCreatingDept] = useState(false);

    const fetchData = useCallback(async () => {
        setLoading(true);
        try {
            const [emps, depts] = await Promise.all([
                HRService.getEmployees(),
                HRService.getDepartments()
            ]);
            setData(emps);
            setDepartments(depts);
        } catch (err: any) {
            setError(err.message || t('hr.hr_employees.messages.error'));
        } finally {
            setLoading(false);
        }
    }, [t]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleImpersonate = async (userId: string) => {
        const result = await authService.impersonate(userId);
        if (!result.success) {
            toast.error(result.error || 'Failed to login as employee');
        }
    };

    const openCreateModal = () => {
        setEditingId(null);
        setFormData(defaultFormData);
        setOpen(true);
    };

    const handleEdit = (employee: Employee) => {
        setEditingId(employee.id);
        setFormData({
            full_name: employee.full_name,
            email: employee.email,
            code: employee.code,
            department_id: employee.department_id || '',
            salary_type: employee.salary_type || 'MONTHLY',
            base_salary: employee.base_salary,
            start_date: new Date(employee.start_date).toISOString().split('T')[0],
            role: employee.user?.role || 'CS_AGENT',
        });
        setOpen(true);
    };

    const handleDelete = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to permanently delete employee "${name}"? This action cannot be undone.`)) return;
        try {
            await HRService.deleteEmployee(id);
            toast.success(`Employee ${name} deleted successfully`);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to delete employee');
        }
    };

    const handleToggleStatus = async (id: string, name: string, currentStatus: boolean) => {
        try {
            await HRService.toggleEmployeeStatus(id);
            toast.success(`Employee ${name} ${currentStatus ? 'suspended' : 'activated'}`);
            fetchData();
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to toggle status');
        }
    };

    const handleResetPassword = async (id: string, name: string) => {
        if (!confirm(`Reset password for ${name} to "password123"?`)) return;
        try {
            const res = await HRService.resetPassword(id);
            toast.success(res.message);
        } catch (err: any) {
            toast.error(err.response?.data?.message || 'Failed to reset password');
        }
    };

    const handleSubmit = async () => {
        if (!formData.full_name || !formData.email || !formData.code || !formData.department_id) {
            toast.error(t('hr.hr_employees.messages.fill_required'));
            return;
        }
        setSaving(true);
        try {
            if (editingId) {
                await HRService.updateEmployee(editingId, formData);
                toast.success('Employee updated successfully');
            } else {
                await HRService.createEmployee(formData);
                toast.success(t('hr.hr_employees.messages.created_success'));
            }
            setOpen(false);
            setFormData(defaultFormData);
            fetchData();
        } catch (err: any) {
            console.error(err);
            toast.error(err.response?.data?.message || t('hr.hr_employees.messages.created_error'));
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
            toast.success(t('hr.hr_employees.messages.dept_success'));
            setDeptModalOpen(false);
            setNewDeptName('');
        } catch (error) {
            console.error(error);
            toast.error(t('hr.hr_employees.messages.dept_error'));
        } finally {
            setCreatingDept(false);
        }
    };

    if (loading) return <div className="p-8 text-center">{t('hr.hr_employees.messages.loading')}</div>;
    if (error) return <div className="p-8 text-center text-destructive">{error}</div>;

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">{t('hr.hr_employees.title')}</h1>
                <Button onClick={openCreateModal}>
                    <Plus className="mr-2 h-4 w-4" /> {t('hr.hr_employees.new_employee')}
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('hr.hr_employees.directory')}</CardTitle>
                </CardHeader>
                <CardContent>
                    {data.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">{t('hr.hr_employees.no_employees')}</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('hr.hr_employees.table.code')}</TableHead>
                                    <TableHead>{t('hr.hr_employees.table.name')}</TableHead>
                                    <TableHead>{t('hr.hr_employees.table.dept')}</TableHead>
                                    <TableHead>{t('hr.hr_employees.table.salary_type')}</TableHead>
                                    <TableHead>{t('hr.hr_employees.table.start_date')}</TableHead>
                                    <TableHead>{t('hr.hr_employees.table.status')}</TableHead>
                                    {hasRole(['ADMIN']) && <TableHead className="text-right">Actions</TableHead>}
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
                                                {item.is_active ? t('hr.hr_employees.table.active') : t('hr.hr_employees.table.inactive')}
                                            </Badge>
                                        </TableCell>
                                        {hasRole(['ADMIN']) && (
                                            <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        {item.user_id && (
                                                            <DropdownMenuItem onClick={() => handleImpersonate(item.user_id!)}>
                                                                <LogIn className="mr-2 h-4 w-4" /> Login As
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuItem onClick={() => handleEdit(item)}>
                                                            <Edit className="mr-2 h-4 w-4" /> Edit Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem onClick={() => handleToggleStatus(item.id, item.full_name, item.is_active)}>
                                                            <Power className="mr-2 h-4 w-4" /> {item.is_active ? 'Suspend Account' : 'Activate Account'}
                                                        </DropdownMenuItem>
                                                        {item.user_id && (
                                                            <DropdownMenuItem onClick={() => handleResetPassword(item.id, item.full_name)}>
                                                                <Key className="mr-2 h-4 w-4" /> Reset Password
                                                            </DropdownMenuItem>
                                                        )}
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-destructive focus:bg-destructive focus:text-destructive-foreground" onClick={() => handleDelete(item.id, item.full_name)}>
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete Employee
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        )}
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
                title={t('hr.hr_employees.modal.new_dept_title')}
                loading={creatingDept}
                onSubmit={async (e) => { e.preventDefault(); await handleCreateDepartment(newDeptName); }}
                submitLabel={t('hr.hr_employees.modal.create_dept_btn')}
                width="sm:max-w-[400px]"
            >
                <div>
                    <Label className="mb-2 block">{t('hr.hr_employees.modal.dept_name_label')}</Label>
                    <Input
                        value={newDeptName}
                        onChange={(e) => setNewDeptName(e.target.value)}
                        placeholder={t('hr.hr_employees.modal.dept_name_placeholder')}
                        autoFocus
                    />
                </div>
            </EntityModal>

            <EntityModal
                open={open}
                onOpenChange={setOpen}
                title={editingId ? 'Edit Employee' : t('hr.hr_employees.modal.add_title')}
                loading={saving}
                onSubmit={handleSubmit as any}
            >
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className="mb-2 block">{t('hr.hr_employees.modal.code_label')}</Label>
                        <Input
                            value={formData.code}
                            onChange={e => setFormData({ ...formData, code: e.target.value })}
                            placeholder={t('hr.hr_employees.modal.code_placeholder')}
                            required
                        />
                    </div>
                    <div>
                        <Label className="mb-2 block">{t('hr.hr_employees.modal.name_label')}</Label>
                        <Input
                            value={formData.full_name}
                            onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                            placeholder={t('hr.hr_employees.modal.name_placeholder')}
                            required
                        />
                    </div>
                </div>

                <div>
                    <Label className="mb-2 block">{t('hr.hr_employees.modal.email_label')}</Label>
                    <Input
                        type="email"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        placeholder={t('hr.hr_employees.modal.email_placeholder')}
                        required
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className="mb-2 block">{t('hr.hr_employees.modal.dept_label')}</Label>
                        <Combobox
                            options={departments.map(d => ({ label: d.name, value: d.id }))}
                            value={formData.department_id}
                            onChange={(val) => setFormData({ ...formData, department_id: val })}
                            placeholder={t('hr.hr_employees.modal.select_dept')}
                            searchPlaceholder={t('hr.hr_employees.modal.search_dept')}
                            onCreate={(inputValue) => {
                                setNewDeptName(inputValue);
                                setDeptModalOpen(true);
                            }}
                            createLabel={t('hr.hr_employees.modal.add_dept')}
                        />
                    </div>
                    <div>
                        <Label className="mb-2 block">System Role</Label>
                        <Select
                            value={formData.role}
                            onValueChange={val => setFormData({ ...formData, role: val })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="ADMIN">Administrator</SelectItem>
                                <SelectItem value="CS_MANAGER">CS Manager</SelectItem>
                                <SelectItem value="CS_AGENT">CS Agent</SelectItem>
                                <SelectItem value="ACC_MANAGER">Accounting Manager</SelectItem>
                                <SelectItem value="ACC_AGENT">Accounting Agent</SelectItem>
                                <SelectItem value="HR_MANAGER">HR Manager</SelectItem>
                                <SelectItem value="HR_AGENT">HR Agent</SelectItem>
                                <SelectItem value="WH_MANAGER">Warehouse Manager</SelectItem>
                                <SelectItem value="WH_AGENT">Warehouse Agent</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className="mb-2 block">{t('hr.hr_employees.modal.salary_type_label')}</Label>
                        <Select
                            value={formData.salary_type}
                            onValueChange={val => setFormData({ ...formData, salary_type: val })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="MONTHLY">{t('hr.hr_employees.modal.monthly')}</SelectItem>
                                <SelectItem value="DAILY">{t('hr.hr_employees.modal.daily')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="mb-2 block">{t('hr.hr_employees.modal.base_salary_label')}</Label>
                        <Input
                            type="number"
                            value={formData.base_salary}
                            onChange={e => setFormData({ ...formData, base_salary: Number(e.target.value) })}
                        />
                    </div>
                </div>

                <div>
                    <Label className="mb-2 block">{t('hr.hr_employees.modal.start_date_label')}</Label>
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
