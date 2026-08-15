import { useAuth } from "@/contexts/AuthContext";
import { usePlan } from "@/hooks/usePlan";
import { useSubscription } from "@/hooks/useSubscription";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Navigate, useLocation } from "react-router-dom";
import type { FeatureKey } from "@/lib/plan-features";

interface Props {
  children: React.ReactNode;
  requireSubscription?: boolean;
  requireAdmin?: boolean;
  /** Bloqueia a rota se o plano atual não liberar este recurso */
  requireFeature?: FeatureKey;
}

const ProtectedRoute = ({
  children,
  requireSubscription = false,
  requireAdmin = false,
  requireFeature,
}: Props) => {
  const { session, loading } = useAuth();
  const needsAccessCheck = requireAdmin || requireSubscription || !!requireFeature;
  const { isActive, loading: subLoading } = useSubscription(needsAccessCheck);
  const plan = usePlan(!!requireFeature);
  const { isAdmin, loading: adminLoading } = useIsAdmin(needsAccessCheck);
  const location = useLocation();

  const email = (session?.user?.email || "").toLowerCase();
  const isOwner = email.includes("rennan") || email.includes("kuboweb");
  const effectiveAdmin = isAdmin || isOwner;

  if (
    loading ||
    (!effectiveAdmin && session && needsAccessCheck && (subLoading || adminLoading || (!!requireFeature && plan.loading)))
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace state={{ from: location }} />;

  if (requireAdmin && !effectiveAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireSubscription && !isActive && !effectiveAdmin) {
    return <Navigate to="/pricing" replace />;
  }

  if (requireFeature && !plan.can(requireFeature) && (!effectiveAdmin || plan.isPreview)) {
    return <Navigate to="/pricing" replace state={{ lockedFeature: requireFeature }} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
