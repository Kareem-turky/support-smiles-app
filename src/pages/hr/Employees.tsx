import { useEffect, useState } from 'react';
import { HRService } from '@/services/hr';
import { Employee, Department } from '@/types';
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
import { useTranslation } from 'react-i18next';

export default function Employees() {
    const { t } = useTranslation();
    const [data, setData] = useState<Employee[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // Modal
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
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
            setError(err.message || t('hr.hr_employees.messages.error'));
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleCreate = async () => {
        if (!formData.full_name || !formData.email || !formData.code || !formData.department_id) {
            toast.error(t('hr.hr_employees.messages.fill_required'));
            return;
        }
        setSaving(true);
        try {
            await HRService.createEmployee(formData);
            toast.success(t('hr.hr_employees.messages.created_success'));
            setOpen(false);
            setFormData({
                full_name: '',
                email: '',
                code: '',
                department_id: '',
                salary_type: 'MONTHLY',
                base_salary: 0,
                start_date: new Date().toISOString().split('T')[0],
            });
            fetchData();
        } catch (err) {
            console.error(err);
            toast.error(t('hr.hr_employees.messages.created_error'));
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
                <Button onClick={() => setOpen(true)}>
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
                title={t('hr.hr_employees.modal.add_title')}
                loading={saving}
                onSubmit={handleCreate as any}
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
