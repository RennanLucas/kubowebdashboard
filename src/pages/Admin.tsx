import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { Loader2, Shield, ShieldOff, ArrowLeft, RefreshCw, Gift, Ban } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

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
    stripe_subscription_id?: string | null;
  } | null;
}

export default function Admin() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  
  // Dialog States
  const [grantDialogState, setGrantDialogState] = useState<{ open: boolean; target: AdminUser | null; days: string }>({ open: false, target: null, days: "365" });
  const [revokeDialogState, setRevokeDialogState] = useState<{ open: boolean; target: AdminUser | null }>({ open: false, target: null });

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

  const grantSubscription = async () => {
    const { target, days: daysStr } = grantDialogState;
    if (!target) return;
    const days = parseInt(daysStr, 10);
    if (!Number.isFinite(days) || days < 1) {
      toast.error("Informe um número de dias válido");
      return;
    }
    setGrantDialogState({ open: false, target: null, days: "365" });
    setBusyId(target.id);
    const { data, error } = await supabase.functions.invoke("admin-list-users", {
      body: { action: "grant_subscription", userId: target.id, days, environment: "sandbox" },
    });
    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Falha ao conceder assinatura");
    } else {
      toast.success(`Assinatura concedida por ${days} dias`);
      await fetchUsers();
    }
    setBusyId(null);
  };

  const revokeSubscription = async () => {
    const { target } = revokeDialogState;
    if (!target) return;
    setRevokeDialogState({ open: false, target: null });
    setBusyId(target.id);
    const { data, error } = await supabase.functions.invoke("admin-list-users", {
      body: { action: "revoke_subscription", userId: target.id, environment: "sandbox" },
    });
    if (error || data?.error) {
      toast.error(data?.error || error?.message || "Falha ao revogar assinatura");
    } else {
      toast.success("Assinatura manual revogada");
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
      <Helmet>
        <title>Admin — KUBOWEB</title>
        <meta name="description" content="Painel administrativo da plataforma KUBOWEB." />
        <link rel="canonical" href="https://kubowebdashboard.lovable.app/admin" />
      </Helmet>
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
            className="max-w-sm glass-card focus-ring"
          />
        </div>

        <Card className="overflow-hidden glass-card border-border/50">
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
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            {sub?.stripe_subscription_id?.startsWith("manual_") ? (
                              <Button
                                size="sm"
                                variant="outline"
                                disabled={busyId === u.id}
                                onClick={() => setRevokeDialogState({ open: true, target: u })}
                              >
                                <Ban className="h-3 w-3 mr-1" />Revogar
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                variant="secondary"
                                disabled={busyId === u.id}
                                onClick={() => setGrantDialogState({ open: true, target: u, days: "365" })}
                              >
                                <Gift className="h-3 w-3 mr-1" />Conceder
                              </Button>
                            )}
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
                          </div>
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

      <Dialog open={grantDialogState.open} onOpenChange={(open) => setGrantDialogState(s => ({ ...s, open }))}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Conceder Assinatura Manual</DialogTitle>
            <DialogDescription>
              Quantos dias de acesso você deseja conceder para <b>{grantDialogState.target?.email}</b>?
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="days">Dias de acesso</Label>
            <Input
              id="days"
              type="number"
              value={grantDialogState.days}
              onChange={(e) => setGrantDialogState(s => ({ ...s, days: e.target.value }))}
              className="mt-2 focus-ring"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setGrantDialogState(s => ({ ...s, open: false }))}>Cancelar</Button>
            <Button onClick={grantSubscription} className="gradient-primary text-primary-foreground">Conceder</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={revokeDialogState.open} onOpenChange={(open) => setRevokeDialogState(s => ({ ...s, open }))}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revogar Assinatura</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja revogar a assinatura manual de <b>{revokeDialogState.target?.email}</b>? Eles perderão o acesso imediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={revokeSubscription} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Revogar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-5 glass-card border-border/50">
      <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">{label}</div>
      <div className="text-3xl font-bold text-foreground mt-2">{value}</div>
    </Card>
  );
}

function subVariant(status: string): "default" | "secondary" | "destructive" | "outline" {
  if (["active", "trialing"].includes(status)) return "default";
  if (status === "canceled") return "outline";
  if (["past_due", "unpaid", "incomplete"].includes(status)) return "destructive";
  return "secondary";
}
