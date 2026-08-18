import { Helmet } from "react-helmet-async";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Building2, Save } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import ProjectsManager from "@/components/settings/ProjectsManager";
import { SubscriptionTab } from "@/components/settings/SubscriptionTab";
import MembersList from "@/components/settings/MembersList";
import InvitesManager from "@/components/settings/InvitesManager";

export default function Settings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { activeOrganization, currentRole, loading: orgLoading, setOrganization } = useOrganization();
  const { subscription, isLoading: subLoading } = useSubscription();

  const [saving, setSaving] = useState(false);
  const [orgName, setOrgName] = useState("");

  useEffect(() => {
    if (activeOrganization) {
      setOrgName(activeOrganization.name);
    }
  }, [activeOrganization]);

  const handleSaveOrganization = async () => {
    if (!activeOrganization) return;
    if (currentRole !== "owner" && currentRole !== "admin") {
      toast.error("Sem permissão para editar a organização.");
      return;
    }

    setSaving(true);
    try {
      const { error } = await supabase
        .from("organizations")
        .update({ name: orgName })
        .eq("id", activeOrganization.id);
      
      if (error) throw error;
      toast.success("Organização atualizada com sucesso!");
      // Temporarily reload or invalidate to show new name in UI
      window.dispatchEvent(new CustomEvent("organization-changed", { detail: { current: activeOrganization.id } }));
    } catch (e: any) {
      toast.error(e.message || "Erro ao salvar.");
    } finally {
      setSaving(false);
    }
  };

  if (orgLoading || subLoading) {
    return (
      <AppLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Helmet>
        <title>Configurações — KUBOWEB</title>
        <meta name="description" content="Gerencie sua organização e assinatura." />
      </Helmet>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
          <p className="text-sm text-muted-foreground">Gerencie a organização e acessos.</p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList className="bg-muted/50 border border-border/50 p-1 rounded-lg">
            <TabsTrigger value="general" className="rounded-md">Geral</TabsTrigger>
            <TabsTrigger value="members" className="rounded-md">Membros</TabsTrigger>
            <TabsTrigger value="invites" className="rounded-md">Convites</TabsTrigger>
            <TabsTrigger value="billing" className="rounded-md">Assinatura</TabsTrigger>
          </TabsList>
          
          <TabsContent value="general" className="space-y-6 animate-in fade-in-50">
            <div className="glass-card rounded-xl p-6 space-y-4 shadow-sm border border-border/60">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                <Building2 className="h-4 w-4 text-primary" /> Dados da Organização
              </h2>
              <div className="space-y-4">
                <div className="space-y-2 max-w-sm">
                  <Label htmlFor="orgName">Nome da Empresa</Label>
                  <Input
                    id="orgName"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    disabled={currentRole === "viewer" || currentRole === "editor"}
                  />
                </div>
                {(currentRole === "owner" || currentRole === "admin") && (
                  <Button onClick={handleSaveOrganization} disabled={saving || !orgName.trim() || orgName === activeOrganization?.name}>
                    {saving ? "Salvando..." : <><Save className="mr-2 h-4 w-4" /> Salvar Alterações</>}
                  </Button>
                )}
              </div>
            </div>

            {/* Projetos da Organização */}
            {activeOrganization && <ProjectsManager organizationId={activeOrganization.id} />}
          </TabsContent>

          <TabsContent value="members" className="space-y-6 animate-in fade-in-50">
            {activeOrganization && <MembersList organizationId={activeOrganization.id} currentRole={currentRole!} />}
          </TabsContent>

          <TabsContent value="invites" className="space-y-6 animate-in fade-in-50">
            {activeOrganization && <InvitesManager organizationId={activeOrganization.id} currentRole={currentRole!} />}
          </TabsContent>

          <TabsContent value="billing" className="space-y-6 animate-in fade-in-50">
            <SubscriptionTab subscription={subscription} activeOrganization={activeOrganization} />
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
