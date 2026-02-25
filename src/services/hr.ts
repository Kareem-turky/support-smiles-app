import { api } from '@/lib/api';
import { Department, Employee, Adjustment, HRAttendance, HRLeave } from '@/types';

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

    // Attendance
    getAttendance: async (params?: { from: string; to: string; employeeId?: string }) => {
        return (await api.get<HRAttendance[]>('/hr/attendance', { params })).data;
    },
    upsertAttendance: async (data: any) => (await api.post<HRAttendance>('/hr/attendance', data)).data,

    // Leaves
    getLeaves: async () => (await api.get<HRLeave[]>('/hr/leaves')).data,
    createLeave: async (data: any) => (await api.post<HRLeave>('/hr/leaves', data)).data,
};

