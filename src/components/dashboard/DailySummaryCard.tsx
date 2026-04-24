import { Sparkles } from "lucide-react";
import { InfoTooltip } from "@/components/InfoTooltip";

interface Props {
  visitors: number;
  leads: number;
  topSource?: { source: string; percentage: number };
  topPage?: { name: string; views: number };
  trafficChangePct?: number;
  conversionRate: number;
}

export const DailySummaryCard = ({
  visitors,
  leads,
  topSource,
  topPage,
  trafficChangePct,
  conversionRate,
}: Props) => {
  const buildSummary = () => {
    if (visitors === 0) {
      return "Nenhum visitante registrado no período. Verifique se o tracking está instalado corretamente.";
    }

    const parts: string[] = [];
    parts.push(
      `Você teve **${visitors.toLocaleString("pt-BR")}** visitantes no período, gerando **${leads}** ${leads === 1 ? "lead" : "leads"}.`,
    );

    if (typeof trafficChangePct === "number" && Math.abs(trafficChangePct) >= 5) {
      const dir = trafficChangePct > 0 ? "alta" : "queda";
      parts.push(`Tráfego em **${dir} de ${Math.abs(trafficChangePct)}%** vs período anterior.`);
    }

    if (topSource && topSource.percentage > 0) {
      parts.push(`Principal canal: **${topSource.source}** (${topSource.percentage}%).`);
    }

    if (topPage && topPage.views > 0) {
      parts.push(`Página em destaque: **${topPage.name}** com ${topPage.views.toLocaleString("pt-BR")} visualizações.`);
    }

    if (conversionRate > 0) {
      const evalStr = conversionRate >= 3 ? "acima da média de mercado" : conversionRate >= 1 ? "dentro da média" : "abaixo da média";
      parts.push(`Conversão de **${conversionRate}%** está ${evalStr}.`);
    }

    return parts.join(" ");
  };

  const summary = buildSummary();

  // Render markdown-style **bold**
  const renderText = (text: string) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return <strong key={i} className="text-foreground font-semibold">{part.slice(2, -2)}</strong>;
      }
      return <span key={i}>{part}</span>;
    });
  };

  return (
    <div className="glass-card p-5 sm:p-6 bg-gradient-to-br from-primary/5 to-transparent">
      <div className="mb-3 flex items-center gap-1.5">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="section-title">Resumo do Período</h3>
        <InfoTooltip content="Resumo automático em linguagem natural baseado nos dados do período selecionado." />
      </div>
      <p className="text-sm text-muted-foreground leading-relaxed">{renderText(summary)}</p>
    </div>
  );
};
