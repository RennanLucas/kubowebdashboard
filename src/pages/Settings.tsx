import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useClientData } from "@/hooks/useDashboardData";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Building2, Globe, Rocket, DollarSign, ArrowLeft, Save } from "lucide-react";
import TrackingSnippet from "@/components/TrackingSnippet";

const Settings = () => {
  const navigate = useNavigate();
  const { data: clientData, isLoading } = useClientData();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    companyName: "",
    domain: "",
    projectName: "",
    leadValue: "25",
  });

  useEffect(() => {
    if (clientData) {
      setForm({
        companyName: clientData.company_name || "",
        domain: clientData.domain || "",
        projectName: clientData.projects?.[0]?.name || "",
        leadValue: String((clientData as any).lead_value ?? 25),
      });
    }
  }, [clientData]);

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!clientData) return;

      const leadVal = parseFloat(form.leadValue);
      if (isNaN(leadVal) || leadVal < 0) {
        toast.error("Valor por lead inválido");
        setSaving(false);
        return;
      }

      const { error: clientError } = await supabase
        .from("clients")
        .update({
          company_name: form.companyName,
          domain: form.domain || null,
          lead_value: leadVal,
        } as any)
        .eq("id", clientData.id);

      if (clientError) throw clientError;

      if (clientData.projects?.[0]) {
        const { error: projectError } = await supabase
          .from("projects")
          .update({
            name: form.projectName || form.companyName,
            url: form.domain || null,
          })
          .eq("id", clientData.projects[0].id);

        if (projectError) throw projectError;
      }

      toast.success("Configurações salvas com sucesso!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Configurações</h1>
            <p className="text-sm text-muted-foreground">Gerencie os dados do seu projeto</p>
          </div>
        </div>

        <div className="space-y-6">
          {/* Empresa */}
          <div className="glass-card rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" /> Empresa
            </h2>
            <div className="space-y-2">
              <Label htmlFor="companyName">Nome da Empresa</Label>
              <Input
                id="companyName"
                value={form.companyName}
                onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))}
                className="h-11"
              />
            </div>
          </div>

          {/* Projeto */}
          <div className="glass-card rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <Rocket className="h-4 w-4 text-primary" /> Projeto
            </h2>
            <div className="space-y-2">
              <Label htmlFor="projectName">Nome do Projeto</Label>
              <Input
                id="projectName"
                value={form.projectName}
                onChange={(e) => setForm((f) => ({ ...f, projectName: e.target.value }))}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="domain" className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-primary" /> Domínio do Site
              </Label>
              <Input
                id="domain"
                type="url"
                placeholder="https://www.seusite.com.br"
                value={form.domain}
                onChange={(e) => setForm((f) => ({ ...f, domain: e.target.value }))}
                className="h-11"
              />
            </div>
          </div>

          {/* Valor por Lead */}
          <div className="glass-card rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <DollarSign className="h-4 w-4 text-primary" /> Valor por Lead
            </h2>
            <p className="text-sm text-muted-foreground">
              Defina quanto vale cada lead gerado (clique no WhatsApp ou envio de formulário). Esse valor é usado para calcular o "Valor Estimado" no dashboard.
            </p>
            <div className="space-y-2">
              <Label htmlFor="leadValue">Valor em R$</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                <Input
                  id="leadValue"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.leadValue}
                  onChange={(e) => setForm((f) => ({ ...f, leadValue: e.target.value }))}
                  className="h-11 pl-10"
                />
              </div>
            </div>
          </div>

          {/* Tracking Snippet */}
          {clientData?.projects?.[0]?.id && (
            <div className="glass-card rounded-xl p-6 space-y-4">
              <h2 className="text-base font-semibold text-foreground">Código de Rastreamento</h2>
              <TrackingSnippet projectId={clientData.projects[0].id} />
            </div>
          )}

          {/* Save */}
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1 h-11" onClick={() => navigate("/dashboard")}>
              Cancelar
            </Button>
            <Button className="flex-1 h-11" onClick={handleSave} disabled={saving || !form.companyName.trim()}>
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" /> Salvar
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
