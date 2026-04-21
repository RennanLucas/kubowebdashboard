import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Navigate, useLocation } from "react-router-dom";

interface Props {
  children: React.ReactNode;
  requireSubscription?: boolean;
  requireAdmin?: boolean;
}

const ProtectedRoute = ({ children, requireSubscription = false, requireAdmin = false }: Props) => {
  const { session, loading } = useAuth();
  const needsAccessCheck = requireAdmin || requireSubscription;
  const { isActive, loading: subLoading } = useSubscription(needsAccessCheck);
  const { isAdmin, loading: adminLoading } = useIsAdmin(needsAccessCheck);
  const location = useLocation();

  if (loading || (needsAccessCheck && session && (subLoading || adminLoading))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace state={{ from: location }} />;

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireSubscription && !isActive && !isAdmin) {
    return <Navigate to="/pricing" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
