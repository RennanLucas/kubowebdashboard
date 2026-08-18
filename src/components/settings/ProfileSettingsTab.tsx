import { Building2, Globe, Rocket, DollarSign } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { HelpTip } from "./HelpTip";
import { LeadValueSuggester } from "./LeadValueSuggester";
import { parseLeadValue } from "@/lib/utils"; // Wait, parseLeadValue is currently in Settings.tsx. I should move it to utils or keep it here.

interface ProfileSettingsTabProps {
  form: {
    companyName: string;
    domain: string;
    projectName: string;
    leadValue: string;
    monthlyAdSpend: string;
  };
  setForm: React.Dispatch<React.SetStateAction<any>>;
  leadValueError: string | null;
}

export function ProfileSettingsTab({ form, setForm, leadValueError }: ProfileSettingsTabProps) {
  return (
    <>
      {/* Empresa */}
      <div className="glass-card rounded-xl p-6 space-y-4 shadow-sm border border-border/60">
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
            onChange={(e) => setForm((f: any) => ({ ...f, companyName: e.target.value }))}
            className="h-11"
          />
        </div>
      </div>

      {/* Projeto */}
      <div className="glass-card rounded-xl p-6 space-y-4 shadow-sm border border-border/60">
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
            onChange={(e) => setForm((f: any) => ({ ...f, projectName: e.target.value }))}
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
            onChange={(e) => setForm((f: any) => ({ ...f, domain: e.target.value }))}
            className="h-11"
          />
        </div>
      </div>

      {/* Valor por Lead */}
      <div className="glass-card rounded-xl p-6 space-y-4 shadow-sm border border-border/60">
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
            <LeadValueSuggester onApply={(value) => setForm((f: any) => ({ ...f, leadValue: value }))} />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
            <Input
              id="leadValue"
              type="text"
              inputMode="decimal"
              placeholder="25,00"
              value={form.leadValue}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[^\d.,]/g, "");
                setForm((f: any) => ({ ...f, leadValue: cleaned }));
              }}
              onBlur={() => {
                const { value } = parseLeadValue(form.leadValue);
                if (value !== null) {
                  setForm((f: any) => ({ ...f, leadValue: value.toFixed(2).replace(".", ",") }));
                }
              }}
              aria-invalid={!!leadValueError}
              aria-describedby={leadValueError ? "leadValue-error" : undefined}
              className={`h-11 pl-10 ${leadValueError ? "border-destructive focus-visible:ring-destructive" : ""}`}
            />
          </div>
          {leadValueError ? (
            <p id="leadValue-error" className="text-xs text-destructive">
              {leadValueError}
            </p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Aceita vírgula ou ponto. Máx. 2 casas decimais. Mín. R$ 0,00.
            </p>
          )}
        </div>
        <div className="space-y-2 mt-6 pt-6 border-t border-border">
          <Label htmlFor="monthlyAdSpend" className="flex items-center gap-2">
            Investimento Mensal em Anúncios (R$)
            <HelpTip text="O valor médio que você gasta por mês em Google Ads, Facebook Ads, etc. Usado para calcular seu Custo por Lead (CPL) no dashboard." />
          </Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
            <Input
              id="monthlyAdSpend"
              type="text"
              inputMode="decimal"
              placeholder="0,00"
              value={form.monthlyAdSpend}
              onChange={(e) => {
                const cleaned = e.target.value.replace(/[^\d.,]/g, "");
                setForm((f: any) => ({ ...f, monthlyAdSpend: cleaned }));
              }}
              onBlur={() => {
                const { value } = parseLeadValue(form.monthlyAdSpend);
                if (value !== null) {
                  setForm((f: any) => ({ ...f, monthlyAdSpend: value.toFixed(2).replace(".", ",") }));
                }
              }}
              className="h-11 pl-10"
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Deixe 0 se não fizer anúncios. Usado para a métrica de Custo por Lead (CPL).
          </p>
        </div>
      </div>
    </>
  );
}
