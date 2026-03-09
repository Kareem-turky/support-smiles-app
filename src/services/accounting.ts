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

export interface ReviewDeduction {
    id: string;
    employee_id: string;
    employee?: { full_name: string };
    department_id: string;
    department?: { name: string };
    period_key: string;
    reason_key: string;
    details_json: string;
    suggested_amount: string | number;
    status: 'REVIEW_NEEDED' | 'APPROVED' | 'REJECTED';
    created_at: string;
}

export const AccountingService = {
    // Vendors
    getVendors: async () => (await api.get<Vendor[]>('/accounting/vendors')).data,
    createVendor: async (data: { name: string; phone?: string }) => (await api.post<Vendor>('/accounting/vendors', { vendor_name: data.name, phone: data.phone })).data,

    // Deposits
    getDeposits: async () => (await api.get<Deposit[]>('/accounting/deposits')).data,
    createDeposit: async (data: Omit<Deposit, 'id'>) => (await api.post<Deposit>('/accounting/deposits', data)).data,

    // Purchases
    getPurchases: async () => (await api.get<Purchase[]>('/accounting/purchases')).data,
    createPurchase: async (data: Omit<Purchase, 'id'>) => (await api.post<Purchase>('/accounting/purchases', data)).data,

    // Expenses
    getExpenses: async () => (await api.get<Expense[]>('/accounting/expenses')).data,
    createExpense: async (data: Omit<Expense, 'id'>) => (await api.post<Expense>('/accounting/expenses', data)).data,

    // Transfers
    getTransfers: async () => (await api.get<Transfer[]>('/accounting/transfers')).data,
    createTransfer: async (data: Omit<Transfer, 'id'>) => (await api.post<Transfer>('/accounting/transfers', data)).data,

    // Payroll
    getPayrollRuns: async () => (await api.get<PayrollRun[]>('/accounting/payroll')).data,
    calculatePayroll: async (year: number, month: number) => (await api.post<PayrollRun>('/accounting/payroll/calculate', { year, month })).data,
    approvePayroll: async (id: string) => (await api.post<PayrollRun>(`/accounting/payroll/${id}/approve`)).data,
    payPayroll: async (id: string) => (await api.post<PayrollRun>(`/accounting/payroll/${id}/pay`)).data,

    // Review Deductions
    getReviewDeductions: async () => (await api.get<ReviewDeduction[]>('/accounting/review-deductions')).data,
    approveReviewDeduction: async (id: string) => (await api.patch<ReviewDeduction>(`/accounting/review-deductions/${id}/approve`)).data,
    rejectReviewDeduction: async (id: string) => (await api.patch<ReviewDeduction>(`/accounting/review-deductions/${id}/reject`)).data,
};
