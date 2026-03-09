import { useEffect, useState } from 'react';
import { HRService } from '@/services/hr';
import { Adjustment, Employee } from '@/types';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { EntityModal } from '@/components/shared/EntityModal';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Combobox } from '@/components/ui/combobox';
import { useTranslation } from 'react-i18next';

export default function Adjustments() {
    const { t } = useTranslation();
    const [data, setData] = useState<Adjustment[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');

    // Modal
    const [open, setOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        employee_id: '',
        type: 'BONUS',
        amount: 0,
        date: new Date().toISOString().split('T')[0],
        reason: ''
    });

    const fetchData = async () => {
        setLoading(true);
        try {
            // For Adjustments list, we probably want both Bonus and Deductions but NOT advances
            // This logic depends on backend filtering, for now we fetch all or specific types
            // assuming default gets all
            const [adj, emps] = await Promise.all([
                HRService.getAdjustments({
                    from: dateFrom || undefined,
                    to: dateTo || undefined
                }),
                HRService.getEmployees()
            ]);
            setData(adj.filter(a => a.type !== 'ADVANCE')); // Exclude advances here if needed
            setEmployees(emps);
        } catch (err: any) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [dateFrom, dateTo]);

    const handleCreate = async () => {
        if (!formData.employee_id || formData.amount <= 0) {
            toast.error(t('hr.hr_adjustments.messages.fill_required'));
            return;
        }
        setSaving(true);
        try {
            await HRService.createAdjustment(formData);
            toast.success(t('hr.hr_adjustments.messages.success'));
            setOpen(false);
            setFormData({
                employee_id: '',
                type: 'BONUS',
                amount: 0,
                date: new Date().toISOString().split('T')[0],
                reason: ''
            });
            fetchData();
        } catch (err) {
            console.error(err);
            toast.error(t('hr.hr_adjustments.messages.error'));
        } finally {
            setSaving(false);
        }
    };

    const filteredData = data.filter(item => {
        if (dateFrom && new Date(item.date) < new Date(dateFrom)) return false;
        if (dateTo && new Date(item.date) > new Date(dateTo)) return false;
        return true;
    });

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-3xl font-bold">{t('hr.hr_adjustments.title')}</h1>
                <Button onClick={() => setOpen(true)}>
                    <Plus className="mr-2 h-4 w-4" /> {t('hr.hr_adjustments.new_adjustment')}
                </Button>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>{t('hr.hr_adjustments.history')}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex gap-4 mb-4 items-end">
                        <div className="grid gap-1.5">
                            <label className="text-sm font-medium">{t('hr.hr_adjustments.filters.from')}</label>
                            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} />
                        </div>
                        <div className="grid gap-1.5">
                            <label className="text-sm font-medium">{t('hr.hr_adjustments.filters.to')}</label>
                            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} />
                        </div>
                    </div>
                    {filteredData.length === 0 ? (
                        <div className="text-center py-4 text-muted-foreground">{t('hr.hr_adjustments.no_records')}</div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('hr.hr_adjustments.table.employee')}</TableHead>
                                    <TableHead>{t('hr.hr_adjustments.table.type')}</TableHead>
                                    <TableHead>{t('hr.hr_adjustments.table.date')}</TableHead>
                                    <TableHead>{t('hr.hr_adjustments.table.amount')}</TableHead>
                                    <TableHead>{t('hr.hr_adjustments.table.reason')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredData.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.employee?.full_name || 'Unknown'}</TableCell>
                                        <TableCell>
                                            <span className={`font-semibold ${item.type === 'BONUS' ? 'text-green-600' : 'text-amber-600'}`}>
                                                {item.type === 'BONUS' ? t('hr.hr_adjustments.types.bonus') : t('hr.hr_adjustments.types.deduction')}
                                            </span>
                                        </TableCell>
                                        <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
                                        <TableCell className="font-mono">${Number(item.amount).toFixed(2)}</TableCell>
                                        <TableCell>{item.reason}</TableCell>
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
                title={t('hr.hr_adjustments.new_adjustment')}
                loading={saving}
                onSubmit={handleCreate as any}
            >
                <div>
                    <Label className="mb-2 block">{t('hr.hr_adjustments.modal.employee_label')}</Label>
                    <Combobox
                        options={employees.map(e => ({ label: e.full_name, value: e.id }))}
                        value={formData.employee_id}
                        onChange={(val) => setFormData({ ...formData, employee_id: val })}
                        placeholder={t('hr.hr_adjustments.modal.select_emp')}
                        searchPlaceholder={t('hr.hr_adjustments.modal.search_emp')}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <Label className="mb-2 block">{t('hr.hr_adjustments.modal.type_label')}</Label>
                        <Select
                            value={formData.type}
                            onValueChange={val => setFormData({ ...formData, type: val })}
                        >
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="BONUS">{t('hr.hr_adjustments.types.bonus')}</SelectItem>
                                <SelectItem value="DEDUCTION">{t('hr.hr_adjustments.types.deduction')}</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <Label className="mb-2 block">{t('hr.hr_adjustments.modal.amount_label')}</Label>
                        <Input
                            type="number"
                            value={formData.amount}
                            onChange={e => setFormData({ ...formData, amount: Number(e.target.value) })}
                        />
                    </div>
                </div>
                <div>
                    <Label className="mb-2 block">{t('hr.hr_adjustments.modal.date_label')}</Label>
                    <Input
                        type="date"
                        value={formData.date}
                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                    />
                </div>
                <div>
                    <Label className="mb-2 block">{t('hr.hr_adjustments.modal.reason_label')}</Label>
                    <Input
                        value={formData.reason}
                        onChange={e => setFormData({ ...formData, reason: e.target.value })}
                    />
                </div>
            </EntityModal>
        </div>
    );
}
