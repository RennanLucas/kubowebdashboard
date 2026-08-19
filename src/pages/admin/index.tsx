import { Routes, Route, Navigate, Link } from "react-router-dom";
import AdminUsers from "../Admin";
import { AdminFeedback } from "./AdminFeedback";
import { AdminRoadmap } from "./AdminRoadmap";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Loader2, ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function AdminRouter() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background gap-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="text-muted-foreground font-medium">Verificando permissões...</p>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background p-4 text-center">
        <ShieldOff className="h-12 w-12 text-destructive mb-4" />
        <h1 className="text-2xl font-bold mb-2">Acesso Negado</h1>
        <p className="text-muted-foreground max-w-md">
          Você não possui permissão para acessar esta área.
        </p>
        <Button asChild className="mt-6" variant="outline">
          <Link to="/dashboard">Voltar ao Dashboard</Link>
        </Button>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<AdminUsers />} />
      <Route path="/feedback" element={<AdminFeedback />} />
      <Route path="/roadmap" element={<AdminRoadmap />} />
      <Route path="*" element={<Navigate to="/admin" replace />} />
    </Routes>
  );
}
