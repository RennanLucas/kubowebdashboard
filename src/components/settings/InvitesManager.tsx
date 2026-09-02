import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Mail, Plus, Trash2, ShieldAlert } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { OrgRole } from "@/contexts/OrganizationContext";

interface InvitesManagerProps {
  organizationId: string;
  currentRole: OrgRole;
}

interface Invite {
  id: string;
  email: string;
  role: string;
  created_at: string;
  expires_at: string;
}

export default function InvitesManager({ organizationId, currentRole }: InvitesManagerProps) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<OrgRole>("viewer");

  const { data: invites, isLoading, refetch } = useQuery({
    queryKey: ["invites", organizationId],
    enabled: !!organizationId,
    queryFn: async (): Promise<Invite[]> => {
      // Filtra por status: o card se chama "Convites Pendentes", mas a query
      // trazia também os aceitos/revogados/expirados (que agora persistem para
      // auditoria em vez de serem deletados no accept).
      const { data, error } = await supabase
        .from("organization_invites")
        .select("id, email, role, created_at, expires_at")
        .eq("organization_id", organizationId)
        .eq("status", "pending")
        .gt("expires_at", new Date().toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data ?? [];
    }
  });

  const handleInvite = async () => {
    if (!email.trim() || !email.includes("@")) {
      toast.error("Informe um e-mail válido");
      return;
    }

    setSaving(true);
    try {
      // Call Edge Function to create invite with secure token generation
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error("Não autenticado");

      const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
      const res = await fetch(`${SUPABASE_URL}/functions/v1/create-invite`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${session.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          organizationId,
          email: email.trim().toLowerCase(),
          role
        })
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Erro ao criar convite");

      toast.success(`Convite enviado para ${email}`);
      setEmail("");
      setRole("viewer");
      setOpen(false);
      await refetch();
    } catch (e: any) {
      toast.error(e.message || "Erro ao enviar convite");
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async (inviteId: string) => {
    try {
      const { error } = await supabase
        .from("organization_invites")
        .delete()
        .eq("id", inviteId);
        
      if (error) throw error;
      toast.success("Convite revogado com sucesso");
      await refetch();
    } catch (e: any) {
      toast.error(e.message || "Erro ao revogar convite");
    }
  };

  const canManageInvites = currentRole === "owner" || currentRole === "admin";

  return (
    <div className="glass-card rounded-xl p-6 space-y-4 shadow-sm border border-border/60">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Mail className="h-4 w-4 text-primary" /> Convites Pendentes
        </h2>
        {canManageInvites && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-2">
                <Plus className="h-4 w-4" /> Convidar Membro
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Enviar Convite</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="space-y-2">
                  <Label htmlFor="invite-email">E-mail do usuário</Label>
                  <Input
                    id="invite-email"
                    type="email"
                    placeholder="usuario@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nível de acesso</Label>
                  <Select value={role} onValueChange={(val: OrgRole) => setRole(val)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {currentRole === "owner" && <SelectItem value="admin">Administrador</SelectItem>}
                      <SelectItem value="editor">Editor</SelectItem>
                      <SelectItem value="viewer">Visualizador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancelar</Button>
                <Button onClick={handleInvite} disabled={saving}>
                  {saving ? "Enviando..." : "Enviar convite"}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!canManageInvites && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/40 p-3 rounded-lg border border-border/50">
          <ShieldAlert className="h-4 w-4 text-orange-400" />
          Apenas Administradores ou Owners podem enviar convites.
        </div>
      )}

      {isLoading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-12 bg-muted/50 rounded-lg"></div>
        </div>
      ) : invites && invites.length > 0 ? (
        <div className="space-y-2 mt-4">
          {invites.map(invite => (
            <div key={invite.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{invite.email}</span>
                <span className="text-xs text-muted-foreground capitalize">Role: {invite.role}</span>
              </div>
              {canManageInvites && (
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-destructive" onClick={() => handleRevoke(invite.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground italic mt-4">Nenhum convite pendente.</p>
      )}
    </div>
  );
}
