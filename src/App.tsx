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
import { PaymentTestModeBanner } from "@/components/PaymentTestModeBanner";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <PaymentTestModeBanner />
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/login" element={<Login />} />
            <Route path="/pricing" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />
            <Route path="/checkout/return" element={<ProtectedRoute><CheckoutReturn /></ProtectedRoute>} />
            <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute requireSubscription><Settings /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute requireSubscription><Dashboard /></ProtectedRoute>} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
