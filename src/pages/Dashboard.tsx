import { useEffect, useMemo, useState } from "react";
import { Navigate } from "react-router-dom";
import { Users, TrendingUp, DollarSign, BarChart3, Eye, Percent } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import KPICard from "@/components/dashboard/KPICard";
import VisitorsChart from "@/components/dashboard/VisitorsChart";
import TrafficSources from "@/components/dashboard/TrafficSources";
import ConversionsCard from "@/components/dashboard/ConversionsCard";
import TopPages from "@/components/dashboard/TopPages";
import InsightsSection from "@/components/dashboard/InsightsSection";
import DevicesBrowsersCard from "@/components/dashboard/DevicesBrowsersCard";
import GeoCard from "@/components/dashboard/GeoCard";
import EngagementCard from "@/components/dashboard/EngagementCard";
import ActiveVisitorsCard from "@/components/dashboard/ActiveVisitorsCard";
import { ConversionFunnel } from "@/components/dashboard/ConversionFunnel";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";

import { HourlyHeatmap } from "@/components/dashboard/HourlyHeatmap";
import { TopReferrers } from "@/components/dashboard/TopReferrers";
import { SuspiciousTrafficCard } from "@/components/dashboard/SuspiciousTrafficCard";
import LiveFeedCard from "@/components/dashboard/LiveFeedCard";
import { UpgradeBanner } from "@/components/dashboard/UpgradeBanner";
import { HealthScoreCard } from "@/components/dashboard/HealthScoreCard";
import { ReturningVisitorsCard } from "@/components/dashboard/ReturningVisitorsCard";
import { CostPerLeadCard } from "@/components/dashboard/CostPerLeadCard";
import { DailySummaryCard } from "@/components/dashboard/DailySummaryCard";
import { GoalsProgressCard } from "@/components/dashboard/GoalsProgressCard";
import { CriticalAlertsCard } from "@/components/dashboard/CriticalAlertsCard";
import { WidgetBoundary } from "@/components/dashboard/WidgetBoundary";
import { AppLayout } from "@/components/layout/AppLayout";
import { useDashboardAnalytics } from "@/hooks/useDashboardData";
import { useHourlyHeatmap } from "@/hooks/useHourlyHeatmap";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { exportToCSV, exportToExcel } from "@/lib/export-utils";

const Dashboard = () => {
  const [dateRange, setDateRange] = useState(30);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();
  const { data, isLoading, error } = useDashboardAnalytics(dateRange, selectedProjectId);

  const [monthlyAdSpend, setMonthlyAdSpend] = useState(0);
  const clientData = data?.client;
  const metrics = data?.metrics;
  const trafficSources = data?.trafficSources;
  const topPages = data?.topPages;
  const comparison = data?.comparison;
  const conversions = data?.conversions;

  const activeProjectId = selectedProjectId || clientData?.project?.id;
  const { heatmap, referrers, isLoading: heatmapLoading, error: heatmapError, refetch: refetchHeatmap } = useHourlyHeatmap(activeProjectId, dateRange);

  useEffect(() => {
    if (!clientData?.id) return;
    let cancelled = false;
    supabase
      .from("clients")
      .select("monthly_ad_spend")
      .eq("id", clientData.id)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setMonthlyAdSpend(Number((data as any)?.monthly_ad_spend ?? 0));
      });
    return () => { cancelled = true; };
  }, [clientData?.id]);

  const totalVisitors = metrics?.reduce((s, m) => s + m.visitors, 0) ?? 0;
  const totalLeads = metrics?.reduce((s, m) => s + m.leads, 0) ?? 0;
  const avgConversion = totalVisitors > 0 ? Number(((totalLeads / totalVisitors) * 100).toFixed(2)) : 0;
  const totalValue = metrics?.reduce((s, m) => s + Number(m.estimated_value), 0) ?? 0;
  const totalWhatsapp = metrics?.reduce((s, m) => s + m.whatsapp_clicks, 0) ?? 0;
  const totalForms = metrics?.reduce((s, m) => s + m.form_submissions, 0) ?? 0;
  const totalButtons = metrics?.reduce((s, m) => s + m.button_clicks, 0) ?? 0;
  const totalViews = metrics?.reduce((s, m) => s + (m.visitors || 0), 0) ?? 0;

  const chartData = useMemo(() => {
    if (!metrics || metrics.length === 0) return [];
    const metricsMap = new Map(metrics.map((m) => [m.date, m]));
    const end = new Date();
    const start = new Date();
    start.setDate(start.getDate() - (dateRange - 1));
    const result: Array<{ date: string; visitors: number; leads: number; rawDate: string }> = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().split("T")[0];
      const m = metricsMap.get(key);
      result.push({
        date: format(new Date(key), "dd/MM"),
        rawDate: key,
        visitors: m?.visitors ?? 0,
        leads: m?.leads ?? 0,
      });
    }
    return result;
  }, [metrics, dateRange]);

  // Series for sparklines
  const visitorsSeries = chartData.map((d) => d.visitors);
  const leadsSeries = chartData.map((d) => d.leads);
  const valueSeries = useMemo(() => {
    if (!metrics) return [];
    const map = new Map(metrics.map((m) => [m.date, Number(m.estimated_value)]));
    return chartData.map((d) => map.get(d.rawDate) ?? 0);
  }, [metrics, chartData]);
  const conversionSeries = useMemo(() => {
    if (!metrics) return [];
    const map = new Map(metrics.map((m) => [m.date, m]));
    return chartData.map((d) => {
      const m = map.get(d.rawDate);
      if (!m || m.visitors === 0) return 0;
      return (m.leads / m.visitors) * 100;
    });
  }, [metrics, chartData]);

  const prevSeries = useMemo(() => {
    if (!comparison || !comparison.prevVisitors) return [] as number[];
    const totalCurrent = chartData.reduce((s, d) => s + d.visitors, 0);
    if (totalCurrent === 0) return chartData.map(() => Math.round(comparison.prevVisitors / Math.max(1, chartData.length)));
    return chartData.map((d) => Math.round((d.visitors / totalCurrent) * comparison.prevVisitors));
  }, [chartData, comparison]);

  const insights = [];
  if (totalVisitors > 0) {
    if (avgConversion > 3) {
      insights.push({ type: "growth" as const, title: "Conversão Forte", message: `Sua taxa de conversão de ${avgConversion}% está acima da média do mercado de 2,5%.` });
    }
    if (trafficSources && trafficSources.length > 0) {
      insights.push({ type: "info" as const, title: "Canal Principal", message: `${trafficSources[0].source} é o canal com melhor desempenho, representando ${trafficSources[0].percentage}% do tráfego.` });
    }
    if (comparison && comparison.visitors !== 0) {
      const dir = comparison.visitors > 0 ? "cresceu" : "caiu";
      insights.push({
        type: comparison.visitors > 0 ? "growth" as const : "warning" as const,
        title: "Comparação com Período Anterior",
        message: `O tráfego ${dir} ${Math.abs(comparison.visitors)}% comparado ao período anterior (${comparison.prevVisitors} visitantes).`,
      });
    }
  }

  if ((error as Error | null)?.message === "AUTH_EXPIRED") {
    return <Navigate to="/login" replace />;
  }

  if (!isLoading && !error && data && !clientData) {
    return <Navigate to="/onboarding" replace />;
  }

  if (isLoading) {
    return (
      <AppLayout>
        <DashboardSkeleton />
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="text-lg font-semibold text-foreground mb-2">Não foi possível carregar o Dashboard</h2>
            <p className="text-sm text-muted-foreground">Atualize a página em alguns instantes. Seus dados de acesso e onboarding foram preservados.</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  const hasData = totalVisitors > 0 || (trafficSources && trafficSources.length > 0);

  const handleExportPDF = async () => {
    toast.info("Gerando relatório PDF...");
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const pid = import.meta.env.VITE_SUPABASE_PROJECT_ID;
      let url = `https://${pid}.supabase.co/functions/v1/generate-report?days=${dateRange}`;
      if (selectedProjectId) url += `&project_id=${selectedProjectId}`;

      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
      });

      if (!response.ok) throw new Error("Erro ao gerar relatório");

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = downloadUrl;
      a.download = `relatorio-${clientData?.company_name || "kuboweb"}-${dateRange}d.html`;
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success("Relatório baixado! Abra o arquivo e use Ctrl+P para salvar como PDF.");
    } catch (error: any) {
      toast.error("Erro ao gerar relatório: " + error.message);
    }
  };

  const buildExportData = () => ({
    clientName: clientData?.company_name || "kuboweb",
    dateRange,
    metrics: metrics ?? [],
    trafficSources: trafficSources ?? [],
    topPages: topPages ?? [],
    devices: data?.devices ?? [],
    countries: data?.countries ?? [],
  });

  const handleExportCSV = () => {
    try {
      exportToCSV(buildExportData());
      toast.success("CSV baixado com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao gerar CSV: " + e.message);
    }
  };

  const handleExportExcel = () => {
    try {
      exportToExcel(buildExportData());
      toast.success("Planilha Excel baixada com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao gerar Excel: " + e.message);
    }
  };

  const currentProject = clientData?.projects?.find(p => p.id === (selectedProjectId || clientData?.project?.id));

  // Funnel stages
  const totalConversionsAll = totalWhatsapp + totalForms + totalButtons;
  const engagedVisitors = data?.engagement
    ? Math.round(totalVisitors * (1 - data.engagement.bounceRate / 100))
    : Math.round(totalVisitors * 0.6);

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <UpgradeBanner />
        <DashboardHeader
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          clientName={clientData?.company_name}
          projectName={currentProject?.name || clientData?.project?.name}
          projects={clientData?.projects}
          selectedProjectId={selectedProjectId || clientData?.project?.id}
          onProjectChange={setSelectedProjectId}
          onExportPDF={hasData ? handleExportPDF : undefined}
          onExportCSV={hasData ? handleExportCSV : undefined}
          onExportExcel={hasData ? handleExportExcel : undefined}
        />

        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BarChart3 className="h-16 w-16 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Ainda não há dados disponíveis
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mb-2">
              Instale o código de rastreamento no seu site para começar a ver os dados. Vá em Configurações para copiar o snippet.
            </p>
            <a href="/settings" className="text-sm text-primary hover:underline mt-2">
              Ir para Configurações →
            </a>
          </div>
        ) : (
          <>
            {/* KPIs + Active Visitors */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
              <KPICard title="Visitantes" value={totalVisitors.toLocaleString("pt-BR")} change={comparison?.visitors ?? null} icon={<Users className="h-4 w-4" />} sparkline={visitorsSeries} sparklineColor="hsl(var(--chart-blue))" tooltip="Número de pessoas únicas que acessaram seu site no período. Cada visitante é contado uma vez, mesmo que retorne." />
              <KPICard title="Pageviews" value={totalViews.toLocaleString("pt-BR")} change={comparison?.views ?? null} icon={<Eye className="h-4 w-4" />} sparkline={visitorsSeries} sparklineColor="hsl(var(--chart-purple))" tooltip="Total de páginas visualizadas. Inclui recargas e navegação entre páginas — um visitante pode gerar várias visualizações." />
              <KPICard title="Leads" value={totalLeads.toLocaleString("pt-BR")} change={comparison?.leads ?? null} icon={<TrendingUp className="h-4 w-4" />} sparkline={leadsSeries} sparklineColor="hsl(var(--chart-green))" tooltip="Visitantes que realizaram uma ação de conversão (clique no WhatsApp, envio de formulário ou clique em botão de contato)." />
              <KPICard title="Conversão" value={`${avgConversion}%`} change={comparison?.conversionRate ?? null} changeUnit="pp" icon={<Percent className="h-4 w-4" />} sparkline={conversionSeries} sparklineColor="hsl(var(--chart-orange))" tooltip="Percentual de visitantes que viraram leads. Calculado como Leads ÷ Visitantes × 100. Média de mercado: 1-3%." />
              <KPICard title="Valor Estimado" value={`R$ ${totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} change={comparison?.estimatedValue ?? null} icon={<DollarSign className="h-4 w-4" />} sparkline={valueSeries} sparklineColor="hsl(var(--chart-green))" tooltip="Valor potencial gerado pelos leads no período. Calculado multiplicando o número de leads pelo valor configurado por lead em Configurações." />
              <ActiveVisitorsCard count={data?.activeVisitors ?? 0} />
            </div>

            {/* Resumo + Score + Recorrentes + Custo por Lead */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <DailySummaryCard
                visitors={totalVisitors}
                leads={totalLeads}
                topSource={trafficSources?.[0] ? { source: trafficSources[0].source, percentage: trafficSources[0].percentage } : undefined}
                topPage={topPages?.[0] ? { name: topPages[0].name, views: topPages[0].views } : undefined}
                trafficChangePct={comparison?.visitors ?? 0}
                conversionRate={avgConversion}
              />
              <HealthScoreCard
                visitors={totalVisitors}
                conversionRate={avgConversion}
                bounceRate={data?.engagement?.bounceRate ?? 50}
                trafficChangePct={comparison?.visitors ?? 0}
              />
              <ReturningVisitorsCard projectId={activeProjectId} days={dateRange} />
              <CostPerLeadCard monthlyAdSpend={monthlyAdSpend} leads={totalLeads} days={dateRange} />
            </div>

            {/* Metas + Alertas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <GoalsProgressCard
                projectId={activeProjectId}
                visitors={totalVisitors}
                leads={totalLeads}
                revenue={totalValue}
              />
              <CriticalAlertsCard projectId={activeProjectId} />
            </div>

            {/* Qualidade do tráfego */}
            <div className="grid grid-cols-1 gap-4 mb-6">
              <WidgetBoundary
                isLoading={heatmapLoading}
                error={heatmapError}
                onRetry={refetchHeatmap}
                title="Não foi possível analisar a qualidade do tráfego"
                skeletonHeight={120}
              >
                <SuspiciousTrafficCard
                  referrers={referrers}
                  totalVisitors={totalVisitors}
                />
              </WidgetBoundary>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <div className="lg:col-span-2">
                <WidgetBoundary title="Não foi possível carregar o gráfico de visitantes" skeletonHeight={280}>
                  <VisitorsChart data={chartData} projectId={activeProjectId} prevSeries={prevSeries} dateRangeDays={dateRange} />
                </WidgetBoundary>
              </div>
              <WidgetBoundary title="Não foi possível carregar as origens de tráfego">
                <TrafficSources data={trafficSources ?? []} dateRangeDays={dateRange} />
              </WidgetBoundary>
            </div>

            {/* Heatmap */}
            <div className="grid grid-cols-1 gap-4 mb-6">
              <WidgetBoundary
                isLoading={heatmapLoading}
                error={heatmapError}
                onRetry={refetchHeatmap}
                title="Não foi possível carregar o heatmap"
                skeletonHeight={200}
              >
                <HourlyHeatmap data={heatmap} isLoading={false} />
              </WidgetBoundary>
            </div>

            {/* Funnel + Conversions */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <WidgetBoundary title="Funil indisponível">
                <ConversionFunnel
                  visitors={totalVisitors}
                  engaged={engagedVisitors}
                  clicks={totalButtons + totalWhatsapp}
                  conversions={totalConversionsAll || totalLeads}
                />
              </WidgetBoundary>
              <WidgetBoundary title="Não foi possível carregar conversões">
                <ConversionsCard data={{
                  whatsappClicks: { value: conversions?.whatsapp_clicks ?? totalWhatsapp, change: conversions?.changes.whatsapp ?? 0 },
                  formSubmissions: { value: conversions?.form_submissions ?? totalForms, change: conversions?.changes.forms ?? 0 },
                  buttonClicks: { value: conversions?.button_clicks ?? totalButtons, change: conversions?.changes.buttons ?? 0 },
                  recentEvents: conversions?.recent ?? [],
                }} />
              </WidgetBoundary>
            </div>

            {/* Top Pages + Top Referrers + Live Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <WidgetBoundary title="Não foi possível carregar páginas">
                <TopPages pages={topPages ?? []} />
              </WidgetBoundary>
              <WidgetBoundary
                isLoading={heatmapLoading}
                error={heatmapError}
                onRetry={refetchHeatmap}
                title="Não foi possível carregar referrers"
              >
                <TopReferrers data={referrers} isLoading={false} />
              </WidgetBoundary>
              <WidgetBoundary title="Feed ao vivo indisponível">
                <LiveFeedCard projectId={activeProjectId ?? null} compact />
              </WidgetBoundary>
            </div>

            {/* Engagement + Devices + Geo */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              {data?.engagement && (
                <EngagementCard data={data.engagement} />
              )}
              <DevicesBrowsersCard
                devices={data?.devices ?? []}
                browsers={data?.browsers ?? []}
                operatingSystems={data?.operatingSystems ?? []}
              />
              <GeoCard countries={data?.countries ?? []} cities={data?.cities ?? []} />
            </div>

            {insights.length > 0 && <InsightsSection insights={insights} />}
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Dashboard;
