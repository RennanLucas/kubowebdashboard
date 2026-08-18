import { Card } from "@/components/ui/card";
import { AlertTriangle, Sparkles, Loader2 } from "lucide-react";

interface InsightsCardsProps {
  periodDays: number;
  hasHistoryForSelectedPeriod: boolean;
  analysisSource: "history" | "generated" | null;
  analysis: string;
  generating: boolean;
  historyLoading: boolean;
}

export function InsightsStatusCard({ periodDays, hasHistoryForSelectedPeriod, analysisSource }: Partial<InsightsCardsProps>) {
  return (
    <Card className="mb-6 p-4">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
        <div className="space-y-1 text-sm">
          <p className="font-medium text-foreground">
            {!hasHistoryForSelectedPeriod
              ? `Atualização com IA necessária para ${periodDays} dias`
              : analysisSource === "generated"
                ? `Análise de ${periodDays} dias atualizada com IA`
                : `Histórico de ${periodDays} dias carregado sem IA`}
          </p>
          <p className="text-muted-foreground">
            {!hasHistoryForSelectedPeriod
              ? "Ainda não existe uma versão salva para esse período. Se quiser visualizar esse recorte, gere uma nova análise manualmente."
              : analysisSource === "generated"
                ? "Você está vendo uma versão recém-atualizada. Só será necessário rodar IA de novo se quiser renovar os insights."
                : "Você está vendo uma versão já salva no histórico. Só use a atualização com IA se quiser gerar uma leitura nova dos dados."}
          </p>
        </div>
      </div>
    </Card>
  );
}

export function InsightsExplanationCard() {
  return (
    <Card className="mb-6 p-4 sm:p-6">
      <div className="space-y-4">
        <div>
          <h2 className="text-base font-semibold text-foreground">O que a IA analisa</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            A IA cruza os principais sinais do período para transformar números soltos em leitura de desempenho e oportunidades de ação.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            {
              title: "Tráfego",
              description: "Volume de visitantes, evolução no período e tendências de alta ou queda.",
              example: "Ex.: crescimento acima da média nos últimos dias ou perda de volume em relação ao período anterior.",
            },
            {
              title: "Conversões",
              description: "Leads, cliques em WhatsApp, formulários e CTAs com mais resposta.",
              example: "Ex.: qual caminho gera mais conversões e onde existe fricção no funil.",
            },
            {
              title: "Origem dos acessos",
              description: "Canais e fontes que mais trazem visitantes para o site.",
              example: "Ex.: dependência excessiva de um canal ou oportunidade em busca orgânica e social.",
            },
            {
              title: "Engajamento",
              description: "Comportamento dos visitantes nas páginas, rejeição e qualidade da navegação.",
              example: "Ex.: páginas com muito acesso, mas pouco avanço para conversão.",
            },
            {
              title: "Sazonalidade",
              description: "Padrões por dia da semana e horários com maior atenção.",
              example: "Ex.: melhores janelas para publicar, anunciar ou reforçar ofertas.",
            },
          ].map((item) => (
            <div key={item.title} className="rounded-lg border border-border bg-muted/20 p-4">
              <h3 className="text-sm font-medium text-foreground">{item.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{item.description}</p>
              <p className="mt-2 text-xs leading-relaxed text-muted-foreground">{item.example}</p>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

export function InsightsWarningCard({ periodDays, generating, historyLoading, hasHistoryForSelectedPeriod }: Partial<InsightsCardsProps>) {
  if (generating || historyLoading || hasHistoryForSelectedPeriod) return null;

  return (
    <Card className="mb-6 border-warning/30 bg-warning/5 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning" />
        <div className="space-y-1 text-sm">
          <p className="font-medium text-foreground">Nenhum histórico salvo para {periodDays} dias</p>
          <p className="text-muted-foreground">
            Se você quiser esse período, gere uma nova análise manualmente. Enquanto isso, não vamos consumir IA automaticamente.
          </p>
        </div>
      </div>
    </Card>
  );
}

export function InsightsEmptyStateCard({ analysis, generating, periodDays }: Partial<InsightsCardsProps>) {
  if (analysis || generating) return null;

  return (
    <Card className="p-6 sm:p-12 text-center border-dashed glass-card">
      <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
        <Sparkles className="h-8 w-8 text-primary" />
      </div>
      <h3 className="text-lg font-medium text-foreground mb-2">Pronto para gerar sua análise com IA</h3>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
        Ao clicar em "Gerar análise com IA", o sistema processa os dados dos últimos {periodDays} dias e entrega um relatório com resumo executivo, destaques, pontos de atenção e próximos passos.
      </p>
    </Card>
  );
}

export function InsightsGeneratingCard({ generating, periodDays }: Partial<InsightsCardsProps>) {
  if (!generating) return null;

  return (
    <Card className="p-6 sm:p-12 text-center glass-card relative overflow-hidden">
      <div className="absolute inset-0 bg-primary/5 animate-pulse" />
      <div className="relative z-10">
        <Loader2 className="h-10 w-10 text-primary animate-spin mx-auto mb-4" />
        <h3 className="text-lg font-medium text-foreground mb-2">Gerando análise com IA</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          A IA está lendo os dados dos últimos {periodDays} dias para montar o diagnóstico. Quando terminar, o relatório aparecerá nesta tela com os insights principais e a opção de ver os detalhes de cada recomendação.
        </p>
      </div>
    </Card>
  );
}
