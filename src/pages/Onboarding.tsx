import { Helmet } from "react-helmet-async";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { ArrowRight, Globe, Building2, Rocket, CheckCircle2, BarChart3, Zap } from "lucide-react";
import TrackingSnippet from "@/components/TrackingSnippet";
import logoKuboweb from "@/assets/logo-kuboweb.png";

interface ClientFormData {
  companyName: string;
  domain: string;
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

const steps = [
  { icon: Building2, label: "Empresa" },
  { icon: Globe, label: "Projeto" },
  { icon: Rocket, label: "Finalizar" },
];

const Onboarding = ({ editMode = false, existingClient }: OnboardingProps) => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [checkingExistingClient, setCheckingExistingClient] = useState(!editMode);
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ClientFormData>({
    companyName: "",
    domain: "",
    projectName: "",
  });

  useEffect(() => {
    if (existingClient) {
      setForm({
        companyName: existingClient.company_name,
        domain: existingClient.domain || "",
        projectName: existingClient.projects?.[0]?.name || "",
      });
    }
  }, [existingClient]);

  // Se não está em editMode e o usuário já tem cliente cadastrado, vai direto pro dashboard
  useEffect(() => {
    if (editMode) {
      setCheckingExistingClient(false);
      return;
    }

    if (authLoading) return;

    if (!user) {
      setCheckingExistingClient(false);
      return;
    }

    let cancelled = false;
    setCheckingExistingClient(true);
    (async () => {
      try {
        const { data } = await supabase
          .from("clients")
          .select("id")
          .eq("user_id", user.id)
          .limit(1)
          .maybeSingle();
        if (!cancelled && data) {
          navigate("/dashboard", { replace: true });
          return;
        }
      } finally {
        if (!cancelled) {
          setCheckingExistingClient(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, [authLoading, editMode, user, navigate]);

  const handleSubmit = async () => {
    if (!user) return;
    setLoading(true);

    try {
      if (editMode && existingClient) {
        const { error: clientError } = await supabase
          .from("clients")
          .update({
            company_name: form.companyName,
            domain: form.domain || null,
          })
          .eq("id", existingClient.id);

        if (clientError) throw clientError;

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
        const { data: client, error: clientError } = await supabase
          .from("clients")
          .insert({
            user_id: user.id,
            company_name: form.companyName,
            domain: form.domain || null,
          })
          .select()
          .single();

        if (clientError) throw clientError;

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

  const canAdvance = () => {
    if (step === 0) return form.companyName.trim().length > 0;
    if (step === 1) return true;
    return true;
  };

  const handleNext = () => {
    if (step < 2) {
      setStep(step + 1);
    } else {
      handleSubmit();
    }
  };

  if (authLoading || checkingExistingClient) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <Helmet>
        <title>Configurar conta — KUBOWEB</title>
        <meta name="description" content="Configure sua conta e comece a rastrear visitantes e leads no seu site." />
        <link rel="canonical" href="https://kubowebdashboard.lovable.app/onboarding" />
      </Helmet>
      {/* Left side - branding */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-primary to-primary/80 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-32 h-32 rounded-full bg-primary-foreground/20 blur-3xl" />
          <div className="absolute bottom-32 right-16 w-48 h-48 rounded-full bg-primary-foreground/15 blur-3xl" />
          <div className="absolute top-1/2 left-1/3 w-24 h-24 rounded-full bg-primary-foreground/10 blur-2xl" />
        </div>
        <div className="relative z-10 max-w-sm">
          <img
            src={logoKuboweb}
            alt="KUBOWEB"
            className="h-12 w-auto mb-5 brightness-0 invert"
          />
          <p className="text-primary-foreground/80 text-lg leading-relaxed mb-10">
            Configure seu projeto em poucos passos e comece a monitorar o desempenho do seu site.
          </p>
          <div className="space-y-5">
            {[
              { icon: BarChart3, text: "Dashboard com métricas em tempo real" },
              { icon: Zap, text: "Rastreamento automático de visitantes" },
              { icon: CheckCircle2, text: "Relatórios profissionais para clientes" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3 text-primary-foreground/90">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary-foreground/15 flex items-center justify-center">
                  <item.icon className="h-4 w-4" />
                </div>
                <span className="text-sm">{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right side - form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden mb-6 flex justify-center">
            <img src={logoKuboweb} alt="KUBOWEB" className="h-10 w-auto" />
          </div>

          {/* Step indicator */}
          <div className="flex items-center gap-2 mb-8">
            {steps.map((s, i) => (
              <div key={s.label} className="flex items-center gap-2">
                <div
                  className={`flex items-center justify-center w-9 h-9 rounded-full text-sm font-medium transition-all duration-300 ${
                    i < step
                      ? "bg-primary text-primary-foreground"
                      : i === step
                      ? "bg-primary text-primary-foreground ring-4 ring-primary/20"
                      : "bg-muted text-muted-foreground"
                  }`}
                >
                  {i < step ? (
                    <CheckCircle2 className="h-4 w-4" />
                  ) : (
                    <s.icon className="h-4 w-4" />
                  )}
                </div>
                {i < steps.length - 1 && (
                  <div className={`w-8 sm:w-12 h-0.5 rounded transition-colors duration-300 ${i < step ? "bg-primary" : "bg-border"}`} />
                )}
              </div>
            ))}
          </div>

          {/* Step content */}
          <div className="glass-card rounded-2xl p-6 sm:p-8 shadow-lg border border-border/50">
            {step === 0 && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-1">
                    {editMode ? "Dados da Empresa" : "Sobre sua empresa"}
                  </h2>
                  <p className="text-sm text-muted-foreground">Informe o nome da empresa que será exibido no dashboard.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyName" className="flex items-center gap-2 text-sm font-medium">
                    <Building2 className="h-4 w-4 text-primary" />
                    Nome da Empresa
                  </Label>
                  <Input
                    id="companyName"
                    placeholder="Ex: Minha Empresa Ltda"
                    value={form.companyName}
                    onChange={(e) => update("companyName", e.target.value)}
                    className="h-11"
                    autoFocus
                  />
                </div>
              </div>
            )}

            {step === 1 && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-1">
                    {editMode ? "Dados do Projeto" : "Configure seu projeto"}
                  </h2>
                  <p className="text-sm text-muted-foreground">Adicione o nome e o domínio do site que será monitorado.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="projectName" className="flex items-center gap-2 text-sm font-medium">
                    <Rocket className="h-4 w-4 text-primary" />
                    Nome do Projeto
                  </Label>
                  <Input
                    id="projectName"
                    placeholder="Ex: Site Principal"
                    value={form.projectName}
                    onChange={(e) => update("projectName", e.target.value)}
                    className="h-11"
                    autoFocus
                  />
                  <p className="text-xs text-muted-foreground">Opcional. Se vazio, usará o nome da empresa.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="domain" className="flex items-center gap-2 text-sm font-medium">
                    <Globe className="h-4 w-4 text-primary" />
                    Domínio do Site
                  </Label>
                  <Input
                    id="domain"
                    type="url"
                    placeholder="https://www.seusite.com.br"
                    value={form.domain}
                    onChange={(e) => update("domain", e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-5 animate-in fade-in duration-300">
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-1">Tudo pronto!</h2>
                  <p className="text-sm text-muted-foreground">Revise as informações antes de finalizar.</p>
                </div>
                <div className="bg-muted/50 rounded-xl p-4 space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Empresa</span>
                    <span className="font-medium text-foreground">{form.companyName}</span>
                  </div>
                  <div className="border-t border-border/50" />
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Projeto</span>
                    <span className="font-medium text-foreground">{form.projectName || form.companyName}</span>
                  </div>
                  {form.domain && (
                    <>
                      <div className="border-t border-border/50" />
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Domínio</span>
                        <span className="font-medium text-primary truncate ml-4">{form.domain}</span>
                      </div>
                    </>
                  )}
                </div>

                {editMode && existingClient?.projects?.[0]?.id && (
                  <TrackingSnippet projectId={existingClient.projects[0].id} />
                )}
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex gap-3 mt-6">
              {step > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 h-11"
                  onClick={() => setStep(step - 1)}
                >
                  Voltar
                </Button>
              )}
              <Button
                className="flex-1 h-11"
                onClick={handleNext}
                disabled={!canAdvance() || loading}
              >
                {loading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground" />
                ) : step === 2 ? (
                  <>
                    {editMode ? "Salvar Alterações" : "Criar Projeto"}
                    <CheckCircle2 className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  <>
                    Continuar
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </div>

            {editMode && (
              <Button type="button" variant="ghost" className="w-full mt-2" onClick={() => navigate("/dashboard")}>
                Cancelar
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;