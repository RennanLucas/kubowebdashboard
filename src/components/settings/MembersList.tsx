import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Users, Shield, User, Eye, Edit3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { OrgRole } from "@/contexts/OrganizationContext";

interface MembersListProps {
  organizationId: string;
  currentRole: OrgRole;
}

interface Member {
  id: string; // The user_id
  email: string | null;
  role: OrgRole;
  joined_at: string;
}

export default function MembersList({ organizationId, currentRole }: MembersListProps) {
  const { data: members, isLoading } = useQuery({
    queryKey: ["members", organizationId],
    enabled: !!organizationId,
    queryFn: async (): Promise<Member[]> => {
      // We will need an edge function or RPC to get members' emails, 
      // but for now, let's fetch from organization_members.
      // Since auth.users is not accessible from the client, we might only get user_id unless we join with a public users table.
      // Let's assume we have a view or we can fetch what's available.
      // For now, let's just fetch the members and display user_id. (Or an edge function if available)
      const { data, error } = await supabase
        .from("organization_members")
        .select("user_id, role, created_at")
        .eq("organization_id", organizationId);
      
      if (error) throw error;
      
      return (data || []).map(m => ({
        id: m.user_id,
        email: `User ${m.user_id.substring(0, 8)}...`, // Placeholder since we can't read auth.users directly
        role: m.role as OrgRole,
        joined_at: m.created_at
      }));
    }
  });

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
      case "owner": return "Owner";
      case "admin": return "Admin";
      case "editor": return "Editor";
      case "viewer": return "Viewer";
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

      {isLoading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-12 bg-muted/50 rounded-lg"></div>
          <div className="h-12 bg-muted/50 rounded-lg"></div>
        </div>
      ) : (
        <div className="space-y-2">
          {members?.map(m => (
            <div key={m.id} className="flex items-center justify-between rounded-lg border border-border bg-muted/30 px-4 py-3">
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">{m.email}</span>
                <span className="text-xs text-muted-foreground font-mono">{m.id}</span>
              </div>
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="flex items-center gap-1.5 font-normal">
                  {getRoleIcon(m.role)}
                  {getRoleLabel(m.role)}
                </Badge>
                
                {/* Visual RBAC Enforcement */}
                {(currentRole === "owner" || (currentRole === "admin" && m.role !== "owner")) && (
                  <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                    Editar
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
