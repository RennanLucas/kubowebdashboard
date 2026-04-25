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
  } | null;
  visitorsSeries: number[];
  leadsSeries: number[];
  valueSeries: number[];
  conversionSeries: number[];
}

export const KPIsSection = ({
  totalVisitors,
  totalViews,
  totalLeads,
  avgConversion,
  totalValue,
  activeVisitors,
  comparison,
  visitorsSeries,
  leadsSeries,
  valueSeries,
  conversionSeries,
}: Props) => (
  <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
    <KPICard
      title="Visitantes"
      value={totalVisitors.toLocaleString("pt-BR")}
      change={comparison?.visitors ?? null}
      icon={<Users className="h-4 w-4" />}
      sparkline={visitorsSeries}
      sparklineColor="hsl(var(--chart-blue))"
      tooltip="Número de pessoas únicas que acessaram seu site no período. Cada visitante é contado uma vez, mesmo que retorne."
    />
    <KPICard
      title="Pageviews"
      value={totalViews.toLocaleString("pt-BR")}
      change={comparison?.views ?? null}
      icon={<Eye className="h-4 w-4" />}
      sparkline={visitorsSeries}
      sparklineColor="hsl(var(--chart-purple))"
      tooltip="Total de páginas visualizadas. Inclui recargas e navegação entre páginas — um visitante pode gerar várias visualizações."
    />
    <KPICard
      title="Leads"
      value={totalLeads.toLocaleString("pt-BR")}
      change={comparison?.leads ?? null}
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
      icon={<Percent className="h-4 w-4" />}
      sparkline={conversionSeries}
      sparklineColor="hsl(var(--chart-orange))"
      tooltip="Percentual de visitantes que viraram leads. Calculado como Leads ÷ Visitantes × 100. Média de mercado: 1-3%."
    />
    <KPICard
      title="Valor Estimado"
      value={`R$ ${totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`}
      change={comparison?.estimatedValue ?? null}
      icon={<DollarSign className="h-4 w-4" />}
      sparkline={valueSeries}
      sparklineColor="hsl(var(--chart-green))"
      tooltip="Valor potencial gerado pelos leads no período. Calculado multiplicando o número de leads pelo valor configurado por lead em Configurações."
    />
    <ActiveVisitorsCard count={activeVisitors} />
  </div>
);
