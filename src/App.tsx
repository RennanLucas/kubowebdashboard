import { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { lazyWithRetry } from "@/lib/chunk-reload";

// Lazy-load all route pages so each becomes its own chunk.
// This dramatically reduces unused JS on initial load (only the
// page the user actually visits is downloaded).
// lazy loading routes
const AuthCallback = lazyWithRetry(() => import("./pages/AuthCallback"), "auth-callback");
const Login = lazyWithRetry(() => import("./pages/Login"), "login");
const Dashboard = lazyWithRetry(() => import("./pages/Dashboard"), "dashboard");
const Onboarding = lazyWithRetry(() => import("./pages/Onboarding"), "onboarding");
const Settings = lazyWithRetry(() => import("./pages/Settings"), "settings");
const Pricing = lazyWithRetry(() => import("./pages/Pricing"), "pricing");
const CheckoutReturn = lazyWithRetry(() => import("./pages/CheckoutReturn"), "checkout-return");
const NotFound = lazyWithRetry(() => import("./pages/NotFound"), "not-found");
const AdminRouter = lazyWithRetry(() => import("./pages/admin"), "admin");
const Insights = lazyWithRetry(() => import("./pages/Insights"), "insights");
const Alerts = lazyWithRetry(() => import("./pages/Alerts"), "alerts");
const Help = lazyWithRetry(() => import("./pages/Help"), "help");
const Feedback = lazyWithRetry(() => import("./pages/Feedback"), "feedback");
const Compare = lazyWithRetry(() => import("./pages/Compare"), "compare");
const Presentation = lazyWithRetry(() => import("./pages/Presentation"), "presentation");
const ResetPassword = lazyWithRetry(() => import("./pages/ResetPassword"), "reset-password");
const Live = lazyWithRetry(() => import("./pages/Live"), "live");
const Subscription = lazyWithRetry(() => import("./pages/Subscription"), "subscription");
const Install = lazyWithRetry(() => import("./pages/Install"), "install");
const PWAQA = lazyWithRetry(() => import("./pages/PWAQA"), "pwa-qa");
const Landing = lazyWithRetry(() => import("./pages/Landing"), "landing");
const Reports = lazyWithRetry(() => import("./pages/Reports"), "reports");
const Goals = lazyWithRetry(() => import("./pages/Goals"), "goals");
const Heatmaps = lazyWithRetry(() => import("./pages/Heatmaps"), "heatmaps");

import { ErrorBoundary } from "@/components/ErrorBoundary";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes default for historical data
      refetchOnWindowFocus: false, // Prevent aggressive refetching on tab switch
      retry: 1, // Only retry once by default
    },
  },
});

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
  </div>
);

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <OrganizationProvider>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  <Route path="/" element={<Landing />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/auth/callback" element={<AuthCallback />} />
                  <Route path="/reset-password" element={<ResetPassword />} />
                  <Route path="/install" element={<Install />} />
                  <Route path="/pricing" element={<ProtectedRoute><Pricing /></ProtectedRoute>} />
                  <Route path="/subscription" element={<ProtectedRoute requireSubscription><Subscription /></ProtectedRoute>} />
                  <Route path="/checkout/return" element={<ProtectedRoute><CheckoutReturn /></ProtectedRoute>} />
                  <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/insights" element={<ProtectedRoute requireFeature="ai_insights"><Insights /></ProtectedRoute>} />
                  <Route path="/alerts" element={<ProtectedRoute><Alerts /></ProtectedRoute>} />
                  <Route path="/compare" element={<ProtectedRoute requireFeature="compare"><Compare /></ProtectedRoute>} />
                  <Route path="/presentation" element={<ProtectedRoute requireFeature="presentation"><Presentation /></ProtectedRoute>} />
                  <Route path="/live" element={<ProtectedRoute><Live /></ProtectedRoute>} />
                  <Route path="/help/*" element={<ProtectedRoute><Help /></ProtectedRoute>} />
                  <Route path="/feedback/*" element={<ProtectedRoute><Feedback /></ProtectedRoute>} />
                  <Route path="/admin/*" element={<ProtectedRoute ><AdminRouter /></ProtectedRoute>} />
                  <Route path="/admin/pwa-qa" element={<ProtectedRoute requireAdmin><PWAQA /></ProtectedRoute>} />
                  <Route path="/reports" element={<ProtectedRoute requireFeature="pdf_report"><Reports /></ProtectedRoute>} />
                  <Route path="/goals" element={<ProtectedRoute requireFeature="goals"><Goals /></ProtectedRoute>} />
                  <Route path="/heatmaps" element={<ProtectedRoute requireFeature="heatmap"><Heatmaps /></ProtectedRoute>} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </OrganizationProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
      </ThemeProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
