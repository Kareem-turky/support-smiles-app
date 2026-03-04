import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ShoppingCart, TrendingUp, Trophy, Target, Award } from 'lucide-react';
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/layout/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import TicketsList from "./pages/TicketsList";
import TicketDetails from "./pages/TicketDetails";
import Orders from "./pages/Orders";
import UsersPage from "./pages/UsersPage";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import Purchases from "./pages/accounting/Purchases";
import Expenses from "./pages/accounting/Expenses";
import Payroll from "./pages/accounting/Payroll";
import Deposits from "./pages/accounting/Deposits";
import Transfers from "./pages/accounting/Transfers";
import Advances from "./pages/accounting/Advances";
import Vendors from "./pages/accounting/Vendors";
import AttendancePage from "./pages/hr/Attendance";
import LeavesPage from "./pages/hr/Leaves";
import Employees from "./pages/hr/Employees";
import Adjustments from "./pages/hr/Adjustments";
import Shipping from "./pages/Shipping";
import TicketReasons from "./pages/admin/TicketReasons";
import MyKPIs from "./pages/MyKPIs";
import TeamKPIs from "./pages/TeamKPIs";
import Gamification from "./pages/Gamification";
import { DevTools } from "./components/DevTools";
import { useEffect } from "react";
import { api } from "@/lib/api";

const queryClient = new QueryClient();

const HealthCheck = () => {
  useEffect(() => {
    if (import.meta.env.DEV) {
      api.get('/health').catch(err => console.error('Health check failed', err));
    }
  }, []);
  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HealthCheck />
    <BrowserRouter>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/unauthorized" element={<Unauthorized />} />

            {/* Protected Routes with Layout */}
            <Route element={<ProtectedRoute><AppLayout /></ProtectedRoute>}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/tickets" element={<TicketsList />} />
              <Route path="/tickets/:id" element={<TicketDetails />} />
              <Route path="/orders" element={<Orders />} />

              <Route path="/users" element={
                <ProtectedRoute allowedRoles={['ADMIN']}><UsersPage /></ProtectedRoute>
              } />

              {/* Accounting */}
              <Route path="/accounting/vendors" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'ACC_MANAGER', 'ACC_CLERK']}><Vendors /></ProtectedRoute>
              } />
              <Route path="/accounting/purchases" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'ACC_MANAGER', 'ACC_CLERK']}><Purchases /></ProtectedRoute>
              } />
              <Route path="/accounting/expenses" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'ACC_MANAGER', 'ACC_CLERK']}><Expenses /></ProtectedRoute>
              } />
              <Route path="/accounting/deposits" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'ACC_MANAGER']}><Deposits /></ProtectedRoute>
              } />
              <Route path="/accounting/payroll" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'ACC_MANAGER']}><Payroll /></ProtectedRoute>
              } />
              <Route path="/accounting/transfers" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'ACC_MANAGER']}><Transfers /></ProtectedRoute>
              } />
              <Route path="/accounting/advances" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'ACC_MANAGER', 'ACC_CLERK']}><Advances /></ProtectedRoute>
              } />

              {/* HR */}
              <Route path="/hr/employees" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'HR_MANAGER', 'HR_ASSISTANT']}><Employees /></ProtectedRoute>
              } />
              <Route path="/hr/adjustments" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'HR_MANAGER', 'HR_ASSISTANT']}><Adjustments /></ProtectedRoute>
              } />
              <Route path="/hr/attendance" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'HR_MANAGER', 'HR_ASSISTANT']}><AttendancePage /></ProtectedRoute>
              } />
              <Route path="/hr/leaves" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'HR_MANAGER', 'HR_ASSISTANT']}><LeavesPage /></ProtectedRoute>
              } />

              {/* Operations */}
              <Route path="/shipping" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'WH_MANAGER']}><Shipping /></ProtectedRoute>
              } />

              {/* Admin */}
              {/* KPI & Gamification */}
              <Route path="/kpi" element={<MyKPIs />} />
              <Route path="/gamification" element={<Gamification />} />
              <Route path="/team-kpi" element={
                <ProtectedRoute allowedRoles={['ADMIN', 'CS_MANAGER', 'HR_MANAGER', 'WH_MANAGER', 'ACC_MANAGER']}><TeamKPIs /></ProtectedRoute>
              } />

              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
          <DevTools />
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
