import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Onboarding from "./pages/Onboarding";
import Settings from "./pages/Settings";
import Pricing from "./pages/Pricing";
import CheckoutReturn from "./pages/CheckoutReturn";
import NotFound from "./pages/NotFound";
import Admin from "./pages/Admin";
import Insights from "./pages/Insights";
import Alerts from "./pages/Alerts";
import Help from "./pages/Help";
import Compare from "./pages/Compare";
import Presentation from "./pages/Presentation";
import ResetPassword from "./pages/ResetPassword";
import Live from "./pages/Live";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route path="/pricing" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />
            <Route path="/checkout/return" element={<ProtectedRoute><CheckoutReturn /></ProtectedRoute>} />
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute requireSubscription><Settings /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute requireSubscription><Dashboard /></ProtectedRoute>} />
            <Route path="/insights" element={<ProtectedRoute requireSubscription><Insights /></ProtectedRoute>} />
            <Route path="/alerts" element={<ProtectedRoute requireSubscription><Alerts /></ProtectedRoute>} />
            <Route path="/compare" element={<ProtectedRoute requireSubscription><Compare /></ProtectedRoute>} />
            <Route path="/presentation" element={<ProtectedRoute requireSubscription><Presentation /></ProtectedRoute>} />
            <Route path="/live" element={<ProtectedRoute requireSubscription><Live /></ProtectedRoute>} />
            <Route path="/help" element={<ProtectedRoute><Help /></ProtectedRoute>} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin><Admin /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
