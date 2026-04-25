import { Users, TrendingUp, DollarSign, Eye, Percent } from "lucide-react";
import KPICard from "@/components/dashboard/KPICard";
import ActiveVisitorsCard from "@/components/dashboard/ActiveVisitorsCard";

interface Props {
  totalVisitors: number;
  totalViews: number;
  totalLeads: number;
  avgConversion: number;
  totalValue: number;
  activeVisitors: number;
  comparison?: {
    visitors?: number | null;
    views?: number | null;
    leads?: number | null;
    conversionRate?: number | null;
    estimatedValue?: number | null;
    prevVisitors?: number;
    prevViews?: number;
    prevLeads?: number;
    prevConversionRate?: number;
    prevEstimatedValue?: number;
  } | null;
  visitorsSeries: number[];
  viewsSeries?: number[];
  leadsSeries: number[];
  valueSeries: number[];
  conversionSeries: number[];
}

const fmtNum = (n?: number) => (n ?? 0).toLocaleString("pt-BR");
const fmtCur = (n?: number) =>
  `R$ ${(n ?? 0).toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`;
const fmtPct = (n?: number) => `${(n ?? 0).toFixed(2)}%`;

export const KPIsSection = ({
  totalVisitors,
  totalViews,
  totalLeads,
  avgConversion,
  totalValue,
  activeVisitors,
  comparison,
  visitorsSeries,
  viewsSeries,
  leadsSeries,
  valueSeries,
  conversionSeries,
}: Props) => (
  <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
    <KPICard
      title="Visitantes"
      value={fmtNum(totalVisitors)}
      change={comparison?.visitors ?? null}
      previousValue={comparison?.prevVisitors !== undefined ? fmtNum(comparison.prevVisitors) : undefined}
      icon={<Users className="h-4 w-4" />}
      sparkline={visitorsSeries}
      sparklineColor="hsl(var(--chart-blue))"
      tooltip="Número de pessoas únicas que acessaram seu site no período. Cada visitante é contado uma vez, mesmo que retorne."
    />
    <KPICard
      title="Pageviews"
      value={fmtNum(totalViews)}
      change={comparison?.views ?? null}
      previousValue={comparison?.prevViews !== undefined ? fmtNum(comparison.prevViews) : undefined}
      icon={<Eye className="h-4 w-4" />}
      sparkline={viewsSeries ?? visitorsSeries}
      sparklineColor="hsl(var(--chart-purple))"
      tooltip="Total de páginas visualizadas. Inclui recargas e navegação entre páginas — um visitante pode gerar várias visualizações."
    />
    <KPICard
      title="Leads"
      value={fmtNum(totalLeads)}
      change={comparison?.leads ?? null}
      previousValue={comparison?.prevLeads !== undefined ? fmtNum(comparison.prevLeads) : undefined}
      icon={<TrendingUp className="h-4 w-4" />}
      sparkline={leadsSeries}
      sparklineColor="hsl(var(--chart-green))"
      tooltip="Visitantes que realizaram uma ação de conversão (clique no WhatsApp, envio de formulário ou clique em botão de contato)."
    />
    <KPICard
      title="Conversão"
      value={`${avgConversion}%`}
      change={comparison?.conversionRate ?? null}
      changeUnit="pp"
      previousValue={comparison?.prevConversionRate !== undefined ? fmtPct(comparison.prevConversionRate) : undefined}
      icon={<Percent className="h-4 w-4" />}
      sparkline={conversionSeries}
      sparklineColor="hsl(var(--chart-orange))"
      tooltip="Percentual de visitantes que viraram leads. Calculado como Leads ÷ Visitantes × 100. Média de mercado: 1-3%."
    />
    <KPICard
      title="Valor Estimado"
      value={fmtCur(totalValue)}
      change={comparison?.estimatedValue ?? null}
      previousValue={comparison?.prevEstimatedValue !== undefined ? fmtCur(comparison.prevEstimatedValue) : undefined}
      icon={<DollarSign className="h-4 w-4" />}
      sparkline={valueSeries}
      sparklineColor="hsl(var(--chart-green))"
      tooltip="Valor potencial gerado pelos leads no período. Calculado multiplicando o número de leads pelo valor configurado por lead em Configurações."
    />
    <ActiveVisitorsCard count={activeVisitors} />
  </div>
);
