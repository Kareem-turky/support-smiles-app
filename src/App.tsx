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
import TicketReasons from "./pages/admin/TicketReasons";

const queryClient = new QueryClient();

import { useEffect } from "react";
import { api } from "@/lib/api";

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
              path="/accounting/payroll"
              element={
                <ProtectedRoute allowedRoles={['ADMIN', 'ACCOUNTING']}>
                  <Payroll />
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
