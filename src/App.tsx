import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";

// Lazy-load all route pages so each becomes its own chunk.
// This dramatically reduces unused JS on initial load (only the
// page the user actually visits is downloaded).
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const Settings = lazy(() => import("./pages/Settings"));
const Pricing = lazy(() => import("./pages/Pricing"));
const CheckoutReturn = lazy(() => import("./pages/CheckoutReturn"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Admin = lazy(() => import("./pages/Admin"));
const Insights = lazy(() => import("./pages/Insights"));
const Alerts = lazy(() => import("./pages/Alerts"));
const Help = lazy(() => import("./pages/Help"));
const Compare = lazy(() => import("./pages/Compare"));
const Presentation = lazy(() => import("./pages/Presentation"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const Live = lazy(() => import("./pages/Live"));
const Subscription = lazy(() => import("./pages/Subscription"));
const Install = lazy(() => import("./pages/Install"));
const PWAQA = lazy(() => import("./pages/PWAQA"));
const Landing = lazy(() => import("./pages/Landing"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
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
  </QueryClientProvider>
);

export default App;
