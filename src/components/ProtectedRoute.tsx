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
  const { isActive, loading: subLoading, error: subscriptionError, refresh: refreshSubscription } = useSubscription(needsAccessCheck);
  const plan = usePlan(!!requireFeature);
  const { isAdmin, loading: adminLoading } = useIsAdmin(needsAccessCheck);
  const location = useLocation();

  if (
    loading ||
    (!isAdmin && session && needsAccessCheck && (subLoading || adminLoading || (!!requireFeature && plan.loading)))
  ) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace state={{ from: location }} />;

  if (!isAdmin && needsAccessCheck && subscriptionError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background px-4">
        <div className="max-w-md text-center space-y-4">
          <h1 className="text-xl font-semibold text-foreground">Não foi possível validar seu acesso</h1>
          <p className="text-sm text-muted-foreground">
            A conexão com o serviço foi interrompida. Nenhum plano foi alterado; tente novamente.
          </p>
          <button
            type="button"
            className="inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground"
            onClick={() => refreshSubscription()}
          >
            Tentar novamente
          </button>
        </div>
      </div>
    );
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireSubscription && !isActive && !isAdmin) {
    return <Navigate to="/pricing" replace />;
  }

  if (requireFeature && !plan.can(requireFeature) && (!isAdmin || plan.isPreview)) {
    return <Navigate to="/pricing" replace state={{ lockedFeature: requireFeature }} />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
