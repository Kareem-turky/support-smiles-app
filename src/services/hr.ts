import { api } from '@/lib/api';

export interface Department {
    id: string;
    name: string;
    _count?: { employees: number };
}

export interface Employee {
    id: string;
    code: string;
    full_name: string;
    department_id: string;
    department?: Department;
    start_date: string;
    base_salary: number;
    salary_type: 'MONTHLY' | 'DAILY';
    is_active: boolean;
}

export interface Adjustment {
    id: string;
    employee_id: string;
    employee?: Employee;
    type: 'BONUS' | 'DEDUCTION' | 'ADVANCE';
    amount: number;
    date: string;
    reason: string;
}

export const HRService = {
    // Departments
    getDepartments: async () => (await api.get<Department[]>('/hr/departments')).data,
    createDepartment: async (name: string) => (await api.post<Department>('/hr/departments', { name })).data,

    // Employees
    getEmployees: async () => (await api.get<Employee[]>('/hr/employees')).data,
    createEmployee: async (data: any) => (await api.post<Employee>('/hr/employees', data)).data,

    // Adjustments
    getAdjustments: async (params?: { type?: string; employee_id?: string; from?: string; to?: string }) => {
        return (await api.get<Adjustment[]>('/hr/adjustments', { params })).data;
    },
    createAdjustment: async (data: any) => (await api.post<Adjustment>('/hr/adjustments', data)).data,
};
