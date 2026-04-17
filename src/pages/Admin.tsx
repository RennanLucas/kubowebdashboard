import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Loader2, Shield, ShieldOff, ArrowLeft, RefreshCw } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

interface AdminUser {
  id: string;
  email: string;
  full_name: string | null;
  created_at: string;
  last_sign_in_at: string | null;
  roles: string[];
  subscription: {
    status: string;
    current_period_end: string | null;
    trial_end: string | null;
    cancel_at_period_end: boolean;
    environment: string;
  } | null;
}

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const fetchUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("admin-list-users", {
      body: { action: "list" },
    });
    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Falha ao carregar usuários");
    } else {
      setUsers(data.users || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (isAdmin) fetchUsers();
  }, [isAdmin]);

  if (authLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const togglePromote = async (target: AdminUser) => {
    const isTargetAdmin = target.roles.includes("admin");
    setBusyId(target.id);
    const { data, error } = await supabase.functions.invoke("admin-list-users", {
      body: { action: isTargetAdmin ? "demote" : "promote", userId: target.id },
    });
    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Falha ao atualizar role");
    } else {
      toast.success(isTargetAdmin ? "Admin removido" : "Promovido a admin");
      await fetchUsers();
    }
    setBusyId(null);
  };

  const filtered = users.filter((u) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.email || "").toLowerCase().includes(q) || (u.full_name || "").toLowerCase().includes(q);
  });

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.roles.includes("admin")).length,
    active: users.filter((u) => {
      const s = u.subscription;
      if (!s) return false;
      if (!["active", "trialing"].includes(s.status)) return false;
      return !s.current_period_end || new Date(s.current_period_end) > new Date();
    }).length,
    trialing: users.filter((u) => u.subscription?.status === "trialing").length,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/dashboard"><ArrowLeft className="h-4 w-4 mr-1" />Dashboard</Link>
            </Button>
            <h1 className="text-2xl font-semibold text-foreground">Admin</h1>
          </div>
          <Button variant="outline" size="sm" onClick={fetchUsers} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <StatCard label="Usuários" value={stats.total} />
          <StatCard label="Admins" value={stats.admins} />
          <StatCard label="Ativos" value={stats.active} />
          <StatCard label="Em trial" value={stats.trialing} />
        </div>

        <div className="mb-4">
          <Input
            placeholder="Buscar por email ou nome..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="max-w-sm"
          />
        </div>

        <Card className="overflow-hidden">
          {loading ? (
            <div className="p-12 flex justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground text-sm">Nenhum usuário encontrado</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr className="text-left">
                    <th className="px-4 py-3 font-medium text-muted-foreground">Usuário</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Assinatura</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Cadastro</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground">Último login</th>
                    <th className="px-4 py-3 font-medium text-muted-foreground text-right">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((u) => {
                    const isTargetAdmin = u.roles.includes("admin");
                    const isSelf = u.id === user.id;
                    const sub = u.subscription;
                    return (
                      <tr key={u.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                        <td className="px-4 py-3">
                          <div className="font-medium text-foreground">{u.full_name || u.email}</div>
                          <div className="text-xs text-muted-foreground flex items-center gap-2">
                            {u.email}
                            {isTargetAdmin && <Badge variant="secondary" className="text-[10px]">admin</Badge>}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          {sub ? (
                            <div>
                              <Badge variant={subVariant(sub.status)}>{sub.status}</Badge>
                              {sub.cancel_at_period_end && <div className="text-xs text-muted-foreground mt-1">cancela no fim do período</div>}
                              {sub.current_period_end && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  até {new Date(sub.current_period_end).toLocaleDateString("pt-BR")}
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {new Date(u.created_at).toLocaleDateString("pt-BR")}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">
                          {u.last_sign_in_at ? new Date(u.last_sign_in_at).toLocaleDateString("pt-BR") : "nunca"}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <Button
                            size="sm"
                            variant={isTargetAdmin ? "outline" : "secondary"}
                            disabled={busyId === u.id || isSelf}
                            onClick={() => togglePromote(u)}
                            title={isSelf ? "Você não pode alterar sua própria role" : ""}
                          >
                            {busyId === u.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : isTargetAdmin ? (
                              <><ShieldOff className="h-3 w-3 mr-1" />Remover admin</>
                            ) : (
                              <><Shield className="h-3 w-3 mr-1" />Tornar admin</>
                            )}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-4">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="text-2xl font-semibold text-foreground mt-1">{value}</div>
    </Card>
  );
}

function subVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (["active", "trialing"].includes(status)) return "default";
  if (status === "canceled") return "outline";
  if (["past_due", "unpaid", "incomplete"].includes(status)) return "destructive";
  return "secondary";
}
