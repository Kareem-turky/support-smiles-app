import { api } from '@/lib/api';

export interface Vendor {
    id: string;
    name: string;
}

export interface Deposit {
    id: string;
    vendor_id: string;
    vendor?: Vendor;
    amount: number;
    date: string;
    profit_loss?: number;
    notes?: string;
}

export interface Purchase {
    id: string;
    vendor_id: string;
    vendor?: Vendor;
    date: string;
    total_amount: number;
    notes?: string;
    items?: PurchaseItem[];
}

export interface PurchaseItem {
    id: string;
    item_name: string;
    qty: number;
    unit_price: number;
    line_total: number;
}

export interface Expense {
    id: string;
    category: string;
    date: string;
    amount: number;
    notes?: string;
}

export interface Transfer {
    id: string;
    type: 'PAYROLL' | 'SUPPLIER' | 'EXPENSE' | 'OTHER';
    amount: number;
    method: 'BANK' | 'CASH' | 'OTHER';
    date: string;
    notes?: string;
}

export interface PayrollRun {
    id: string;
    year: number;
    month: number;
    status: string;
    paid_at?: string;
    items?: any[];
}

export const AccountingService = {
    // Vendors
    getVendors: async () => (await api.get<Vendor[]>('/accounting/vendors')).data,
    createVendor: async (name: string) => (await api.post<Vendor>('/accounting/vendors', { name })).data,

    // Deposits
    getDeposits: async () => (await api.get<Deposit[]>('/accounting/deposits')).data,
    createDeposit: async (data: any) => (await api.post<Deposit>('/accounting/deposits', data)).data,

    // Purchases
    getPurchases: async () => (await api.get<Purchase[]>('/accounting/purchases')).data,
    createPurchase: async (data: any) => (await api.post<Purchase>('/accounting/purchases', data)).data,

    // Expenses
    getExpenses: async () => (await api.get<Expense[]>('/accounting/expenses')).data,
    createExpense: async (data: any) => (await api.post<Expense>('/accounting/expenses', data)).data,

    // Transfers
    getTransfers: async () => (await api.get<Transfer[]>('/accounting/transfers')).data,
    createTransfer: async (data: any) => (await api.post<Transfer>('/accounting/transfers', data)).data,

    // Payroll
    getPayrollRuns: async () => (await api.get<PayrollRun[]>('/accounting/payroll')).data,
    calculatePayroll: async (year: number, month: number) => (await api.post<PayrollRun>('/accounting/payroll/calculate', { year, month })).data,
    approvePayroll: async (id: string) => (await api.post<PayrollRun>(`/accounting/payroll/${id}/approve`)).data,
    payPayroll: async (id: string) => (await api.post<PayrollRun>(`/accounting/payroll/${id}/pay`)).data,
};
