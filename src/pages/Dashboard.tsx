import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/useAuth';
import { DashboardService } from '@/services/dashboard';
import { AppLayout } from '@/components/layout/AppLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Ticket, DollarSign, ShoppingCart, Users, TrendingUp, CreditCard } from 'lucide-react';
import { EmployeeDashboard } from '@/components/dashboard/EmployeeDashboard';
import { ManagerDashboard } from '@/components/dashboard/ManagerDashboard';

interface DashboardData {
  period: { from: string; to: string };
  financials: {
    deposits_total: number;
    purchases_total: number;
    expenses_total: number;
    payroll_total: number;
    transfers_total: number;
    hr_bonus_total: number;
    hr_deduction_total: number;
    net_profit_loss: number;
  };
  counts: {
    tickets_open: number;
    orders_pending: number;
    employees_active: number;
  };
  recent: {
    purchases: any[];
    expenses: any[];
    deposits: any[];
  }
}

export default function Dashboard() {
  const { user, hasRole } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Role-based views
  const showFinancials = hasRole(['ADMIN', 'ACC_MANAGER']);
  const showManager = hasRole(['CS_MANAGER', 'HR_MANAGER', 'WH_MANAGER']);
  const showEmployee = !showFinancials && !showManager;

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (showFinancials) {
          const result = await DashboardService.getSummary();
          setData(result);
        }
      } catch (error) {
        console.error('Failed to fetch dashboard data', error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, [showFinancials]);

  if (isLoading && showFinancials) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  // Employee View
  if (showEmployee) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.name}</h1>
          <p className="text-muted-foreground mt-1">
            Your Performance & Gamification Dashboard
          </p>
        </div>
        <EmployeeDashboard />
      </div>
    );
  }

  // Manager View
  if (showManager) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome back, {user?.name}</h1>
          <p className="text-muted-foreground mt-1">
            Team Overview & Leaderboards
          </p>
        </div>
        <ManagerDashboard />
      </div>
    );
  }

  // Financial / Admin View
  const { financials, counts } = data!;
  const totalExpenses = financials.purchases_total + financials.expenses_total + financials.payroll_total + financials.transfers_total + financials.hr_bonus_total;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user?.name}</h1>
        <p className="text-muted-foreground mt-1">
          Financial & Operational Overview
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Profit / Loss</CardTitle>
            <TrendingUp className={`h-4 w-4 ${financials.net_profit_loss >= 0 ? 'text-green-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${financials.net_profit_loss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ${financials.net_profit_loss.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Revenue - All Costs
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              ${financials.deposits_total.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Vendor Deposits
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">
              ${totalExpenses.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Purchases + Ops + Payroll
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Open Tickets</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{counts.tickets_open}</div>
            <p className="text-xs text-muted-foreground">
              Requires Attention
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Purchases</span>
                <span className="font-medium">${financials.purchases_total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Operational Expenses</span>
                <span className="font-medium">${financials.expenses_total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Payroll</span>
                <span className="font-medium">${financials.payroll_total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Transfers</span>
                <span className="font-medium">${financials.transfers_total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Bonuses (HR)</span>
                <span className="font-medium">${financials.hr_bonus_total.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t">
                <span>Deductions (Credit)</span>
                <span className="font-medium text-green-600">-${financials.hr_deduction_total.toLocaleString()}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-1 lg:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {data?.recent.deposits.slice(0, 3).map((d: any) => (
                <div key={d.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="text-sm font-medium">Deposit from {d.vendor?.name}</p>
                    <p className="text-xs text-muted-foreground">{new Date(d.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-green-600 font-bold">+${Number(d.amount).toLocaleString()}</div>
                </div>
              ))}
              {data?.recent.expenses.slice(0, 3).map((e: any) => (
                <div key={e.id} className="flex items-center justify-between border-b pb-2 last:border-0">
                  <div>
                    <p className="text-sm font-medium">Expense: {e.category}</p>
                    <p className="text-xs text-muted-foreground">{new Date(e.date).toLocaleDateString()}</p>
                  </div>
                  <div className="text-red-600 font-bold">-${Number(e.amount).toLocaleString()}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
