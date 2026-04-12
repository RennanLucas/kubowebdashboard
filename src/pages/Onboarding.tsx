import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowRight, Globe, BarChart3, Building2 } from "lucide-react";
import TrackingSnippet from "@/components/TrackingSnippet";

interface ClientFormData {
  companyName: string;
  domain: string;
  analyticsPropertyId: string;
  projectName: string;
}

interface OnboardingProps {
  editMode?: boolean;
  existingClient?: {
    id: string;
    company_name: string;
    domain: string | null;
    analytics_property_id: string | null;
    projects: Array<{ id: string; name: string; url: string | null }>;
  };
}

const Onboarding = ({ editMode = false, existingClient }: OnboardingProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState<ClientFormData>({
    companyName: "",
    domain: "",
    analyticsPropertyId: "",
    projectName: "",
  });

  useEffect(() => {
    if (existingClient) {
      setForm({
        companyName: existingClient.company_name,
        domain: existingClient.domain || "",
        analyticsPropertyId: existingClient.analytics_property_id || "",
        projectName: existingClient.projects?.[0]?.name || "",
      });
    }
  }, [existingClient]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      if (editMode && existingClient) {
        // Update existing client
        const { error: clientError } = await supabase
          .from("clients")
          .update({
            company_name: form.companyName,
            domain: form.domain || null,
            analytics_property_id: form.analyticsPropertyId || null,
          })
          .eq("id", existingClient.id);

        if (clientError) throw clientError;

        // Update project if exists
        if (existingClient.projects?.[0]) {
          const { error: projectError } = await supabase
            .from("projects")
            .update({
              name: form.projectName || form.companyName,
              url: form.domain || null,
            })
            .eq("id", existingClient.projects[0].id);

          if (projectError) throw projectError;
        }

        toast.success("Dados atualizados com sucesso!");
        navigate("/dashboard");
      } else {
        // Create new client
        const { data: client, error: clientError } = await supabase
          .from("clients")
          .insert({
            user_id: user.id,
            company_name: form.companyName,
            domain: form.domain || null,
            analytics_property_id: form.analyticsPropertyId || null,
          })
          .select()
          .single();

        if (clientError) throw clientError;

        // Create default project
        const { error: projectError } = await supabase
          .from("projects")
          .insert({
            client_id: client.id,
            name: form.projectName || form.companyName,
            url: form.domain || null,
          });

        if (projectError) throw projectError;

        toast.success("Projeto registrado com sucesso!");
        navigate("/dashboard");
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const update = (field: keyof ClientFormData, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        <div className="text-center mb-8">
          <h1 className="text-xl font-bold text-foreground mb-1">KUBOWEB</h1>
          <h2 className="text-2xl font-semibold text-foreground mt-4">
            {editMode ? "Editar Projeto" : "Configurar seu Projeto"}
          </h2>
          <p className="text-muted-foreground mt-2">
            {editMode
              ? "Atualize as informações do seu projeto"
              : "Cadastre seu site para começar a acompanhar o desempenho"}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card rounded-xl p-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="companyName" className="flex items-center gap-2">
              <Building2 className="h-4 w-4 text-muted-foreground" />
              Nome da Empresa
            </Label>
            <Input
              id="companyName"
              placeholder="Ex: Minha Empresa"
              value={form.companyName}
              onChange={(e) => update("companyName", e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="projectName" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Nome do Projeto
            </Label>
            <Input
              id="projectName"
              placeholder="Ex: Site Principal"
              value={form.projectName}
              onChange={(e) => update("projectName", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">Opcional. Se vazio, usará o nome da empresa.</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="domain" className="flex items-center gap-2">
              <Globe className="h-4 w-4 text-muted-foreground" />
              Domínio do Site
            </Label>
            <Input
              id="domain"
              type="url"
              placeholder="https://www.seusite.com.br"
              value={form.domain}
              onChange={(e) => update("domain", e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="analyticsId" className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              Google Analytics Property ID <span className="text-xs text-muted-foreground">(opcional)</span>
            </Label>
            <Input
              id="analyticsId"
              placeholder="Ex: 123456789"
              value={form.analyticsPropertyId}
              onChange={(e) => update("analyticsPropertyId", e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Opcional. Se preenchido, usaremos dados do GA4. Caso contrário, use nosso tracking próprio abaixo.
            </p>
          </div>

          {form.analyticsPropertyId && (
            <div className="rounded-lg border border-border bg-muted/50 p-4 space-y-2">
              <p className="text-sm font-medium text-foreground">⚠️ Passo para GA4</p>
              <p className="text-xs text-muted-foreground">
                Adicione nosso email como <strong>Leitor</strong> na propriedade GA4:
              </p>
              <code className="block text-xs bg-background px-2 py-1 rounded border border-border select-all break-all">
                kuboweb-analytics-service@tidy-access-478016-a7.iam.gserviceaccount.com
              </code>
            </div>
          )}

          {editMode && existingClient?.projects?.[0]?.id && (
            <TrackingSnippet projectId={existingClient.projects[0].id} />
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
            ) : (
              <>
                {editMode ? "Salvar Alterações" : "Registrar Projeto"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>

          {editMode && (
            <Button type="button" variant="ghost" className="w-full" onClick={() => navigate("/dashboard")}>
              Cancelar
            </Button>
          )}
        </form>
      </div>
    </div>
  );
};

export default Onboarding;
