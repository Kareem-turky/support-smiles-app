import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import TicketsList from "./pages/TicketsList";
import TicketDetails from "./pages/TicketDetails";
import UsersPage from "./pages/UsersPage";
import Unauthorized from "./pages/Unauthorized";
import NotFound from "./pages/NotFound";
import Purchases from "./pages/accounting/Purchases";
import Expenses from "./pages/accounting/Expenses";
import Payroll from "./pages/accounting/Payroll";
import Deposits from "./pages/accounting/Deposits";
import Transfers from "./pages/accounting/Transfers";
import Advances from "./pages/accounting/Advances";
import AttendancePage from "./pages/hr/Attendance";
import LeavesPage from "./pages/hr/Leaves";
import Employees from "./pages/hr/Employees";
import Adjustments from "./pages/hr/Adjustments";
import Shipping from "./pages/Shipping";
import Orders from "./pages/Orders";
import TicketReasons from "./pages/admin/TicketReasons";
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
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tickets"
              element={
                <ProtectedRoute>
                  <TicketsList />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tickets/:id"
              element={
                <ProtectedRoute>
                  <TicketDetails />
                </ProtectedRoute>
              }
            />
            <Route
              path="/users"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <UsersPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accounting/purchases"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'ACCOUNTING']}>
                  <Purchases />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accounting/expenses"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'ACCOUNTING']}>
                  <Expenses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accounting/deposits"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'ACCOUNTING']}>
                  <Deposits />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accounting/payroll"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'ACCOUNTING']}>
                  <Payroll />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accounting/transfers"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'ACCOUNTING']}>
                  <Transfers />
                </ProtectedRoute>
              }
            />
            <Route
              path="/accounting/advances"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'ACCOUNTING']}>
                  <Advances />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hr/employees"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
                  <Employees />
                </ProtectedRoute>
              }
            />
            <Route
              path="/hr/adjustments"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'HR']}>
                  <Adjustments />
                </ProtectedRoute>
              }
            />
            <Route
              path="/orders"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'ACCOUNTING', 'CS']}>
                  <Orders />
                </ProtectedRoute>
              }
            />
            <Route
              path="/shipping"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'ACCOUNTING']}>
                  <Shipping />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin/ticket-reasons"
              element={
                <ProtectedRoute allowedRoles={['ADMIN']}>
                  <TicketReasons />
                </ProtectedRoute>
              }
            />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </TooltipProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
