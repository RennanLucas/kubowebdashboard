import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useClientData } from "@/hooks/useDashboardData";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { toast } from "sonner";
import { Building2, Globe, Rocket, DollarSign, ArrowLeft, Save, HelpCircle, CreditCard, ExternalLink } from "lucide-react";
import TrackingSnippet from "@/components/TrackingSnippet";
import ProjectsManager from "@/components/settings/ProjectsManager";
import TrackingStatus from "@/components/settings/TrackingStatus";
import MonthlyGoalsCard from "@/components/settings/MonthlyGoalsCard";
import { useSubscription } from "@/hooks/useSubscription";


const HelpTip = ({ text }: { text: string }) => (
  <Popover>
    <PopoverTrigger asChild>
      <button
        type="button"
        aria-label="Ajuda"
        className="inline-flex text-muted-foreground hover:text-foreground transition-colors touch-manipulation"
      >
        <HelpCircle className="h-3.5 w-3.5" />
      </button>
    </PopoverTrigger>
    <PopoverContent side="top" className="max-w-xs text-xs leading-relaxed p-3">
      {text}
    </PopoverContent>
  </Popover>
);

const Settings = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: clientData, isLoading } = useClientData();
  const [saving, setSaving] = useState(false);
  const { subscription, isActive } = useSubscription();
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

      const { data: updated, error: clientError } = await supabase
        .from("clients")
        .update({
          company_name: form.companyName,
          domain: form.domain || null,
          lead_value: leadVal,
        } as any)
        .eq("id", clientData.id)
        .select("id, company_name, domain, lead_value");

      if (clientError) {
        console.error("Erro ao atualizar cliente:", clientError);
        throw clientError;
      }
      if (!updated || updated.length === 0) {
        throw new Error("Não foi possível salvar. Verifique suas permissões.");
      }
      console.log("Cliente atualizado:", updated[0]);

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

      await queryClient.invalidateQueries({ queryKey: ["dashboard-analytics"] });
      await queryClient.refetchQueries({ queryKey: ["dashboard-analytics"] });

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
              <Label htmlFor="companyName" className="flex items-center gap-2">
                Nome da Empresa
                <HelpTip text="Nome da sua empresa ou marca. Aparece no topo do dashboard e nos relatórios exportados." />
              </Label>
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
              <Label htmlFor="projectName" className="flex items-center gap-2">
                Nome do Projeto
                <HelpTip text="Identifica o site monitorado. Útil quando você gerencia mais de um projeto na mesma conta." />
              </Label>
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
                <HelpTip text="Endereço completo do site rastreado (ex.: https://www.seusite.com.br). Usado para validar os pageviews recebidos pelo código de rastreamento." />
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
              <HelpTip text="Quanto vale, em média, cada lead gerado pelo seu site. O dashboard multiplica esse valor pela quantidade de conversões (cliques no WhatsApp + envios de formulário) para calcular o Valor Estimado." />
            </h2>
            <p className="text-sm text-muted-foreground">
              Defina quanto vale cada lead gerado (clique no WhatsApp ou envio de formulário). Esse valor é usado para calcular o "Valor Estimado" no dashboard.
            </p>
            <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-2 text-sm">
              <p className="font-medium text-foreground">Como funciona?</p>
              <p className="text-muted-foreground leading-relaxed">
                Cada conversão do seu site (clique no WhatsApp, envio de formulário ou clique em botão de contato) é contada como <span className="font-medium text-foreground">1 lead</span>. O dashboard multiplica a quantidade de leads pelo valor definido aqui para mostrar o <span className="font-medium text-foreground">"Valor Estimado"</span> gerado pelo site.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground">Exemplo:</span> R$ 25 por lead × 40 conversões no mês = <span className="font-medium text-foreground">R$ 1.000,00</span> de valor estimado.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                <span className="font-medium text-foreground">Dica:</span> use o seu ticket médio multiplicado pela taxa de fechamento de leads (ex.: ticket de R$ 500 × 5% de fechamento = R$ 25 por lead).
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="leadValue" className="flex items-center gap-2">
                Valor em R$
                <HelpTip text="Use vírgula ou ponto para decimais (ex.: 50 ou 50.00). O valor mínimo é 0." />
              </Label>
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

          {/* Meus Projetos */}
          {clientData?.id && <ProjectsManager clientId={clientData.id} />}

          {/* Tracking Snippet */}
          {clientData?.projects?.[0]?.id && (
            <div className="glass-card rounded-xl p-6 space-y-4">
              <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
                Código de Rastreamento
                <HelpTip text="Cole este código no <head> do seu site para começar a coletar visitas, fontes de tráfego e conversões automaticamente." />
              </h2>
              <TrackingStatus projectId={clientData.projects[0].id} />
              <TrackingSnippet projectId={clientData.projects[0].id} />
            </div>
          )}

          {/* Assinatura */}
          <div className="glass-card rounded-xl p-6 space-y-4">
            <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-primary" /> Assinatura
            </h2>
            {subscription ? (
              <>
                <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-1 text-sm">
                  <p className="text-foreground">
                    Status:{" "}
                    <span className="font-medium capitalize">
                      {subscription.status === "trialing"
                        ? "Em período de teste"
                        : subscription.status === "active"
                          ? "Ativa"
                          : subscription.status === "canceled"
                            ? "Cancelada"
                            : subscription.status}
                    </span>
                  </p>
                  {subscription.trial_end && subscription.status === "trialing" && (
                    <p className="text-muted-foreground">
                      Trial termina em{" "}
                      {new Date(subscription.trial_end).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                  {subscription.current_period_end && (
                    <p className="text-muted-foreground">
                      {subscription.cancel_at_period_end ? "Acesso até" : "Próxima cobrança"}:{" "}
                      {new Date(subscription.current_period_end).toLocaleDateString("pt-BR")}
                    </p>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  Para cancelar a assinatura, atualizar o cartão ou ver suas faturas, acesse sua conta no Mercado Pago em <strong>Minhas assinaturas</strong>.
                </p>
                <Button
                  variant="outline"
                  className="w-full h-11"
                  asChild
                >
                  <a
                    href="https://www.mercadopago.com.br/subscriptions"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    Gerenciar no Mercado Pago
                  </a>
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  Você ainda não tem uma assinatura ativa.
                </p>
                <Button variant="outline" className="w-full h-11" onClick={() => navigate("/pricing")}>
                  Ver planos
                </Button>
              </>
            )}
          </div>

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
