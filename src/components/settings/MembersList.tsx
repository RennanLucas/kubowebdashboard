import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Users, Shield, User, Eye, Edit3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { OrgRole } from "@/contexts/OrganizationContext";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { toast } from "sonner";

interface MembersListProps {
  organizationId: string;
  currentRole: OrgRole;
}

interface Member {
  id: string; // The user_id
  email: string | null;
  full_name: string | null;
  role: OrgRole;
  joined_at: string;
}

export default function MembersList({ organizationId, currentRole }: MembersListProps) {
  const { user } = useAuth();
  const [saving, setSaving] = useState(false);
  const { data: members, isLoading, error, refetch } = useQuery({
    queryKey: ["members", organizationId],
    enabled: !!organizationId,
    queryFn: async (): Promise<Member[]> => {
      const { data, error } = await supabase.rpc("list_organization_members", { p_organization_id: organizationId });
      if (error) throw error;
      return (data || []).map(m => ({
        id: m.user_id,
        email: m.email,
        full_name: m.full_name,
        role: m.role as OrgRole,
        joined_at: m.created_at,
      }));
    }
  });
  const changeRole = async (id: string, role: OrgRole) => {
    if (saving || id === user?.id) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.from("organization_members").update({ role })
        .eq("organization_id", organizationId).eq("user_id", id).select("user_id").single();
      if (error || !data) throw new Error("Não foi possível alterar a permissão. Verifique seu acesso.");
      await refetch();
      toast.success("Permissão atualizada");
    } catch (e) { toast.error(e instanceof Error ? e.message : "Falha ao atualizar permissão"); }
    finally { setSaving(false); }
  };

  const getRoleIcon = (role: OrgRole) => {
    switch (role) {
      case "owner": return <Shield className="h-3 w-3 text-red-500" />;
      case "admin": return <Shield className="h-3 w-3 text-orange-500" />;
      case "editor": return <Edit3 className="h-3 w-3 text-blue-500" />;
      case "viewer": return <Eye className="h-3 w-3 text-green-500" />;
      default: return <User className="h-3 w-3 text-gray-500" />;
    }
  };

  const getRoleLabel = (role: OrgRole) => {
    switch (role) {
      case "owner": return "Proprietário";
      case "admin": return "Administrador";
      case "editor": return "Editor";
      case "viewer": return "Visualizador";
      default: return role;
    }
  };

  return (
    <div className="glass-card rounded-xl p-6 space-y-4 shadow-sm border border-border/60">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
          <Users className="h-4 w-4 text-primary" /> Membros da Equipe
        </h2>
      </div>
      
      <p className="text-sm text-muted-foreground">
        Gerencie quem tem acesso aos projetos e dados desta organização.
      </p>

      {error ? <p role="alert">Não foi possível carregar os membros. <Button onClick={() => refetch()}>Tentar novamente</Button></p> : isLoading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-12 bg-muted/50 rounded-lg"></div>
          <div className="h-12 bg-muted/50 rounded-lg"></div>
        </div>
      ) : (
        <div className="space-y-2">
          {members?.map(m => (
            <div key={m.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{m.full_name || m.email || "Membro sem perfil cadastrado"}</span>
                <span className="text-xs text-muted-foreground">{m.email || "E-mail indisponível"}{m.id === user?.id ? " · Você" : ""}</span>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="flex items-center gap-1.5 font-normal">
                  {getRoleIcon(m.role)}
                  {getRoleLabel(m.role)}
                </Badge>
                
                {/* Visual RBAC Enforcement */}
                {m.id !== user?.id && m.role !== "owner" && (currentRole === "owner" || (currentRole === "admin" && m.role !== "admin")) && (
                  <select aria-label={`Permissão de ${m.email || "membro"}`} value={m.role} disabled={saving}
                    className="rounded-md border bg-background p-2 text-sm"
                    onChange={e => changeRole(m.id, e.target.value as OrgRole)}>
                    <option value="viewer">Visualizador</option>
                    <option value="editor">Editor</option>
                    {currentRole === "owner" && <option value="admin">Administrador</option>}
                  </select>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
