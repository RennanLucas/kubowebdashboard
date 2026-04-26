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
import { Building2, Globe, Rocket, DollarSign, ArrowLeft, Save, HelpCircle, CreditCard, ExternalLink, Calculator, Sparkles } from "lucide-react";
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

const LeadValueSuggester = ({ onApply }: { onApply: (value: string) => void }) => {
  const [open, setOpen] = useState(false);
  const [ticket, setTicket] = useState("");
  const [closeRate, setCloseRate] = useState("");

  const ticketNum = parseFloat(ticket.replace(",", "."));
  const rateNum = parseFloat(closeRate.replace(",", "."));
  const valid = !isNaN(ticketNum) && ticketNum > 0 && !isNaN(rateNum) && rateNum > 0 && rateNum <= 100;
  const suggested = valid ? (ticketNum * (rateNum / 100)) : 0;

  const handleApply = () => {
    if (!valid) return;
    onApply(suggested.toFixed(2));
    toast.success(`Valor sugerido aplicado: R$ ${suggested.toFixed(2)}`);
    setOpen(false);
    setTicket("");
    setCloseRate("");
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button type="button" variant="outline" size="sm" className="gap-1.5">
          <Sparkles className="h-3.5 w-3.5" />
          Sugerir valor
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" align="end" className="w-80 p-4 space-y-4">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground flex items-center gap-1.5">
            <Calculator className="h-4 w-4 text-primary" /> Calcular valor recomendado
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Informe seu ticket médio e a taxa de fechamento para descobrir quanto vale, em média, cada lead.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="suggest-ticket" className="text-xs">Ticket médio (R$)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">R$</span>
            <Input
              id="suggest-ticket"
              type="number"
              min="0"
              step="0.01"
              placeholder="500"
              value={ticket}
              onChange={(e) => setTicket(e.target.value)}
              className="h-9 pl-9 text-sm"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="suggest-rate" className="text-xs">Taxa de fechamento (%)</Label>
          <div className="relative">
            <Input
              id="suggest-rate"
              type="number"
              min="0"
              max="100"
              step="0.1"
              placeholder="5"
              value={closeRate}
              onChange={(e) => setCloseRate(e.target.value)}
              className="h-9 pr-8 text-sm"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">%</span>
          </div>
          <p className="text-[11px] text-muted-foreground">
            Ex.: fecha 1 a cada 20 leads = 5%
          </p>
        </div>
        <div className="rounded-md border border-border bg-muted/40 p-3 space-y-1">
          <p className="text-xs text-muted-foreground">Valor recomendado por lead:</p>
          <p className="text-lg font-semibold text-foreground">
            {valid ? `R$ ${suggested.toFixed(2)}` : "—"}
          </p>
          {valid && (
            <p className="text-[11px] text-muted-foreground">
              {ticketNum.toFixed(2)} × {rateNum}% = {suggested.toFixed(2)}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" className="flex-1" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button type="button" size="sm" className="flex-1" disabled={!valid} onClick={handleApply}>
            Aplicar
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Maximum sane lead value (R$ 1.000.000) — guards against typos / abuse
const MAX_LEAD_VALUE = 1_000_000;

/**
 * Parse a lead value string accepting both "," and "." as decimal separator.
 * Returns { value, error }. value is rounded to 2 decimal places.
 */
const parseLeadValue = (raw: string): { value: number | null; error: string | null } => {
  const trimmed = (raw ?? "").trim();
  if (!trimmed) return { value: null, error: "Informe um valor por lead" };

  // Reject anything that isn't digits, comma, dot or a leading minus
  if (!/^-?[\d.,]+$/.test(trimmed)) {
    return { value: null, error: "Use apenas números, vírgula ou ponto" };
  }

  // Normalize: remove thousands separators, accept comma as decimal
  // Strategy: keep only the LAST separator as the decimal point
  const lastComma = trimmed.lastIndexOf(",");
  const lastDot = trimmed.lastIndexOf(".");
  const decimalPos = Math.max(lastComma, lastDot);

  let normalized: string;
  if (decimalPos === -1) {
    normalized = trimmed;
  } else {
    const intPart = trimmed.slice(0, decimalPos).replace(/[.,]/g, "");
    const decPart = trimmed.slice(decimalPos + 1);
    normalized = `${intPart}.${decPart}`;
  }

  const num = Number(normalized);
  if (!Number.isFinite(num)) return { value: null, error: "Valor inválido" };
  if (num < 0) return { value: null, error: "O valor não pode ser negativo" };
  if (num > MAX_LEAD_VALUE) {
    return { value: null, error: `O valor máximo é R$ ${MAX_LEAD_VALUE.toLocaleString("pt-BR")}` };
  }

  // Limit to 2 decimal places
  const rounded = Math.round(num * 100) / 100;
  return { value: rounded, error: null };
};

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
              <HelpTip text="Quanto vale, em média, cada lead gerado pelo seu site. O dashboard multiplica esse valor pela quantidade de conversões para calcular o Valor Estimado." />
            </h2>
            <p className="text-sm text-muted-foreground">
              Diga ao sistema <span className="font-medium text-foreground">quanto vale, em média, um lead para o seu negócio</span>. Com isso, conseguimos transformar suas conversões em <span className="font-medium text-foreground">receita potencial</span> no dashboard.
            </p>

            <div className="rounded-lg border border-border bg-muted/40 p-4 space-y-3 text-sm">
              <div className="space-y-1">
                <p className="font-semibold text-foreground">O que é um lead?</p>
                <p className="text-muted-foreground leading-relaxed">
                  É qualquer pessoa que demonstrou interesse no seu site: clicou no botão do <span className="font-medium text-foreground">WhatsApp</span>, enviou um <span className="font-medium text-foreground">formulário</span> de contato ou clicou em um botão de <span className="font-medium text-foreground">contato/orçamento</span>. Cada uma dessas ações conta como <span className="font-medium text-foreground">1 lead</span>.
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-semibold text-foreground">Como o cálculo funciona?</p>
                <p className="text-muted-foreground leading-relaxed">
                  <span className="font-mono text-foreground">Valor Estimado = nº de leads × valor por lead</span>
                </p>
                <p className="text-muted-foreground leading-relaxed">
                  <span className="font-medium text-foreground">Exemplo:</span> R$ 25 por lead × 40 leads no mês = <span className="font-medium text-foreground">R$ 1.000,00</span> de receita potencial gerada pelo site.
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-semibold text-foreground">Como descobrir o valor ideal?</p>
                <p className="text-muted-foreground leading-relaxed">
                  Use a fórmula: <span className="font-mono text-foreground">ticket médio × taxa de fechamento</span>.
                  <br />
                  Ex.: vende um serviço de R$ 500 e fecha 1 a cada 20 leads (5%) → R$ 500 × 5% = <span className="font-medium text-foreground">R$ 25 por lead</span>.
                </p>
              </div>

              <div className="space-y-1">
                <p className="font-semibold text-foreground">Referências por tipo de negócio</p>
                <ul className="text-muted-foreground leading-relaxed list-disc pl-5 space-y-0.5">
                  <li>Advocacia / consultoria: <span className="font-medium text-foreground">R$ 200 – R$ 800</span></li>
                  <li>Imobiliária / construção: <span className="font-medium text-foreground">R$ 500 – R$ 2.000</span></li>
                  <li>Estética / saúde: <span className="font-medium text-foreground">R$ 80 – R$ 300</span></li>
                  <li>E-commerce / varejo: <span className="font-medium text-foreground">R$ 30 – R$ 100</span></li>
                  <li>Infoprodutos / cursos: <span className="font-medium text-foreground">R$ 20 – R$ 80</span></li>
                </ul>
                <p className="text-xs text-muted-foreground/80 italic pt-1">
                  São apenas referências. Ajuste com base no seu próprio histórico de vendas.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <Label htmlFor="leadValue" className="flex items-center gap-2">
                  Valor em R$
                  <HelpTip text="Use vírgula ou ponto para decimais (ex.: 50 ou 50.00). O valor mínimo é 0." />
                </Label>
                <LeadValueSuggester onApply={(value) => setForm((f) => ({ ...f, leadValue: value }))} />
              </div>
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

          {/* Metas Mensais */}
          {clientData?.projects?.[0]?.id && (
            <MonthlyGoalsCard projectId={clientData.projects[0].id} />
          )}

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
