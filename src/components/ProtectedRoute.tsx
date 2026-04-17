import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Navigate, useLocation } from "react-router-dom";

interface Props {
  children: React.ReactNode;
  requireSubscription?: boolean;
}

const ProtectedRoute = ({ children, requireSubscription = false }: Props) => {
  const { session, loading } = useAuth();
  const { isActive, loading: subLoading } = useSubscription();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const location = useLocation();

  if (loading || (requireSubscription && session && (subLoading || adminLoading))) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!session) return <Navigate to="/login" replace state={{ from: location }} />;

  if (requireSubscription && !isActive && !isAdmin) {
    return <Navigate to="/pricing" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
