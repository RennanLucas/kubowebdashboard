import { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { lazyWithRetry } from "@/lib/chunk-reload";

// Lazy-load all route pages so each becomes its own chunk.
// This dramatically reduces unused JS on initial load (only the
// page the user actually visits is downloaded).
const Login = lazyWithRetry(() => import("./pages/Login"), "login");
const Dashboard = lazyWithRetry(() => import("./pages/Dashboard"), "dashboard");
const Onboarding = lazyWithRetry(() => import("./pages/Onboarding"), "onboarding");
const Settings = lazyWithRetry(() => import("./pages/Settings"), "settings");
const Pricing = lazyWithRetry(() => import("./pages/Pricing"), "pricing");
const CheckoutReturn = lazyWithRetry(() => import("./pages/CheckoutReturn"), "checkout-return");
const NotFound = lazyWithRetry(() => import("./pages/NotFound"), "not-found");
const Admin = lazyWithRetry(() => import("./pages/Admin"), "admin");
const Insights = lazyWithRetry(() => import("./pages/Insights"), "insights");
const Alerts = lazyWithRetry(() => import("./pages/Alerts"), "alerts");
const Help = lazyWithRetry(() => import("./pages/Help"), "help");
const Compare = lazyWithRetry(() => import("./pages/Compare"), "compare");
const Presentation = lazyWithRetry(() => import("./pages/Presentation"), "presentation");
const ResetPassword = lazyWithRetry(() => import("./pages/ResetPassword"), "reset-password");
const Live = lazyWithRetry(() => import("./pages/Live"), "live");
const Subscription = lazyWithRetry(() => import("./pages/Subscription"), "subscription");
const Install = lazyWithRetry(() => import("./pages/Install"), "install");
const PWAQA = lazyWithRetry(() => import("./pages/PWAQA"), "pwa-qa");
const Landing = lazyWithRetry(() => import("./pages/Landing"), "landing");

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={null}>
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/login" element={<Login />} />
              <Route path="/reset-password" element={<ResetPassword />} />
              <Route path="/install" element={<Install />} />
              <Route path="/pricing" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />
              <Route path="/subscription" element={<ProtectedRoute requireSubscription><Subscription /></ProtectedRoute>} />
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
              <Route path="/admin/pwa-qa" element={<ProtectedRoute requireAdmin><PWAQA /></ProtectedRoute>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
