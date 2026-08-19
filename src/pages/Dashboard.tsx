import { Helmet } from "react-helmet-async";
import { useEffect, useMemo, useState } from "react";
import { usePlan } from "@/hooks/usePlan";
import { useQueryClient } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { BarChart3 } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import { DashboardSkeleton } from "@/components/dashboard/DashboardSkeleton";
import { UpgradeBanner } from "@/components/dashboard/UpgradeBanner";
import { AppLayout } from "@/components/layout/AppLayout";
import { KPIsSection } from "@/components/dashboard/sections/KPIsSection";
import { OverviewSection } from "@/components/dashboard/sections/OverviewSection";
import { TrafficSection } from "@/components/dashboard/sections/TrafficSection";
import { ConversionsSection } from "@/components/dashboard/sections/ConversionsSection";
import { TopPagesSection } from "@/components/dashboard/sections/TopPagesSection";
import { InsightsSection } from "@/components/dashboard/sections/InsightsSection";
import { PeriodComparisonStrip } from "@/components/dashboard/PeriodComparisonStrip";
import { AnnotationsHistoryCard } from "@/components/dashboard/AnnotationsHistoryCard";
import { DashboardFiltersProvider, useDashboardFilters } from "@/contexts/DashboardFiltersContext";
import { useDashboardAnalytics } from "@/hooks/useDashboardData";
import { useAllUserProjects } from "@/hooks/useAllUserProjects";
import { useSelectedProject } from "@/hooks/useSelectedProject";
import { useHourlyHeatmap } from "@/hooks/useHourlyHeatmap";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { exportToCSV, exportToExcel } from "@/lib/export-utils";

interface DashboardContentProps {
  selectedProjectId?: string;
  setSelectedProjectId: (id: string) => void;
}

const DashboardContent = ({ selectedProjectId, setSelectedProjectId }: DashboardContentProps) => {
  const plan = usePlan();
  const [dateRange, setDateRange] = useState(plan.maxHistoryDays >= 30 ? 30 : plan.maxHistoryDays);
  const queryClient = useQueryClient();
  const { source, device } = useDashboardFilters();
  const { data, isLoading, error } = useDashboardAnalytics(dateRange, selectedProjectId, { source, device });
  const { data: allProjects, isLoading: allProjectsLoading } = useAllUserProjects();

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
    if (allProjectsLoading || !allProjects) return;
    
    // Se o usuário não tem nenhum projeto, limpe o localStorage
    if (allProjects.length === 0) {
      if (selectedProjectId) setSelectedProjectId("");
      return;
    }

    // Se tem projetos mas não há nada selecionado, seleciona o primeiro
    if (!selectedProjectId) {
      setSelectedProjectId(allProjects[0].id);
      return;
    }

    // Se o ID selecionado (stale) não pertencer à lista atual (nova conta), fallback
    const exists = allProjects.some((p) => p.id === selectedProjectId);
    if (!exists) {
      setSelectedProjectId(allProjects[0].id);
    }
  }, [allProjects, allProjectsLoading, selectedProjectId, setSelectedProjectId]);

  // Persist the resolved active project so other surfaces (topbar switcher,
  // next page load) restore the same choice.
  useEffect(() => {
    if (activeProjectId && !selectedProjectId) {
      setSelectedProjectId(activeProjectId);
    }
  }, [activeProjectId, selectedProjectId, setSelectedProjectId]);

  // When the active project changes, refresh all project-scoped widgets.
  useEffect(() => {
    if (!activeProjectId) return;
    const scopedKeys = ["heatmap", "annotations", "alerts", "ai-insights", "live-feed", "goals", "client-projects"];
    queryClient.invalidateQueries({
      predicate: (q) => Array.isArray(q.queryKey) && scopedKeys.includes(q.queryKey[0] as string),
    });
  }, [activeProjectId, queryClient]);

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

  const totalVisitors = data?.summary?.totalVisitors ?? (metrics?.reduce((s, m) => s + m.visitors, 0) ?? 0);
  const totalLeads = data?.summary?.totalLeads ?? (metrics?.reduce((s, m) => s + m.leads, 0) ?? 0);
  const avgConversion = totalVisitors > 0 ? Number(((totalLeads / totalVisitors) * 100).toFixed(2)) : 0;
  const totalValue = metrics?.reduce((s, m) => s + Number(m.estimated_value), 0) ?? 0;
  const totalWhatsapp = metrics?.reduce((s, m) => s + m.whatsapp_clicks, 0) ?? 0;
  const totalForms = metrics?.reduce((s, m) => s + m.form_submissions, 0) ?? 0;
  const totalButtons = metrics?.reduce((s, m) => s + m.button_clicks, 0) ?? 0;
  const totalViews = data?.summary?.totalViews ?? (metrics?.reduce((s, m) => s + (m.views ?? m.visitors ?? 0), 0) ?? 0);

  const chartData = useMemo(() => {
    if (!metrics || metrics.length === 0) return [];
    const metricsMap = new Map(metrics.map((m) => [m.date, m]));
    const result: Array<{ date: string; visitors: number; views: number; leads: number; rawDate: string }> = [];
    const today = new Date();
    for (let i = dateRange - 1; i >= 0; i--) {
      const d = new Date(today.getTime() - i * 86400000);
      const key = d.toISOString().split("T")[0];
      const m = metricsMap.get(key);
      const parts = key.split("-");
      const formattedDate = parts.length === 3 ? `${parts[2]}/${parts[1]}` : key;
      result.push({
        date: formattedDate,
        rawDate: key,
        visitors: m?.visitors ?? 0,
        views: m?.views ?? m?.visitors ?? 0,
        leads: m?.leads ?? 0,
      });
    }
    return result;
  }, [metrics, dateRange]);

  const visitorsSeries = chartData.map((d) => d.visitors);
  const viewsSeries = chartData.map((d) => d.views);
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

  const insights = useMemo(() => {
    const out: Array<{ type: "growth" | "drop" | "info" | "warning"; title: string; message: string }> = [];
    if (totalVisitors > 0) {
      if (avgConversion > 3) {
        out.push({ type: "growth", title: "Conversão Forte", message: `Sua taxa de conversão de ${avgConversion}% está acima da média do mercado de 2,5%.` });
      }
      if (trafficSources && trafficSources.length > 0) {
        out.push({ type: "info", title: "Canal Principal", message: `${trafficSources[0].source} é o canal com melhor desempenho, representando ${trafficSources[0].percentage}% do tráfego.` });
      }
      if (comparison && comparison.visitors !== 0) {
        const dir = comparison.visitors > 0 ? "cresceu" : "caiu";
        out.push({
          type: comparison.visitors > 0 ? "growth" : "warning",
          title: "Comparação com Período Anterior",
          message: `O tráfego ${dir} ${Math.abs(comparison.visitors)}% comparado ao período anterior (${comparison.prevVisitors} visitantes).`,
        });
      }
    }
    return out;
  }, [totalVisitors, avgConversion, trafficSources, comparison]);

  if ((error as Error | null)?.message === "AUTH_EXPIRED") {
    return <Navigate to="/login" replace />;
  }

  // Se a query de todos os projetos terminou de carregar e está vazia, força onboarding imediatamente
  if (!allProjectsLoading && allProjects && allProjects.length === 0) {
    return <Navigate to="/onboarding" replace />;
  }

  if (isLoading || allProjectsLoading) {
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
    if (!plan.can("pdf_report")) {
      toast.error("Relatórios em PDF estão disponíveis nos planos Pro e Pro+.");
      return;
    }
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
    if (!plan.can("csv_export")) {
      toast.error("A exportação de dados está disponível nos planos Pro e Pro+.");
      return;
    }
    try {
      exportToCSV(buildExportData());
      toast.success("CSV baixado com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao gerar CSV: " + e.message);
    }
  };

  const handleExportExcel = () => {
    if (!plan.can("csv_export")) {
      toast.error("A exportação de dados está disponível nos planos Pro e Pro+.");
      return;
    }
    try {
      exportToExcel(buildExportData());
      toast.success("Planilha Excel baixada com sucesso!");
    } catch (e: any) {
      toast.error("Erro ao gerar Excel: " + e.message);
    }
  };

  const effectiveProjectId = selectedProjectId || clientData?.project?.id;
  const currentProjectFromAll = allProjects?.find(p => p.id === effectiveProjectId);
  const currentProject = currentProjectFromAll
    ?? clientData?.projects?.find(p => p.id === effectiveProjectId);
  const headerProjects = (allProjects && allProjects.length > 0)
    ? allProjects.map(p => ({ id: p.id, name: p.name, url: p.url, clientName: p.clientName }))
    : clientData?.projects;

  const totalConversionsAll = totalWhatsapp + totalForms + totalButtons;
  const engagedVisitors = data?.engagement && data?.summary?.totalSessions
    ? Math.min(totalVisitors, Math.round(data.summary.totalSessions * (1 - data.engagement.bounceRate / 100)))
    : (totalVisitors > 0 ? Math.round(totalVisitors * 0.4) : 0); // fallback

  return (
    <AppLayout>
      <Helmet>
        <title>Dashboard — KUBOWEB</title>
        <meta name="description" content="Acompanhe visitantes, leads e métricas do seu site em tempo real." />
        <link rel="canonical" href="https://kubowebdashboard.lovable.app/dashboard" />
      </Helmet>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <UpgradeBanner />
        <DashboardHeader
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          clientName={clientData?.company_name}
          projectName={currentProject?.name || clientData?.project?.name}
          projects={headerProjects}
          selectedProjectId={effectiveProjectId}
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
            <PeriodComparisonStrip
              dateRange={dateRange}
              items={[
                { label: "Visitantes", current: totalVisitors, previous: comparison?.prevVisitors ?? 0 },
                { label: "Leads", current: totalLeads, previous: comparison?.prevLeads ?? 0 },
                {
                  label: "Conversão",
                  current: avgConversion,
                  previous: comparison?.prevConversionRate ?? 0,
                  format: (v) => v.toFixed(2),
                  unit: "%",
                },
                {
                  label: "Valor estimado",
                  current: totalValue,
                  previous: comparison?.prevEstimatedValue ?? 0,
                  format: (v) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`,
                },
              ]}
            />

            <KPIsSection
              totalVisitors={totalVisitors}
              totalViews={totalViews}
              totalLeads={totalLeads}
              avgConversion={avgConversion}
              totalValue={totalValue}
              activeVisitors={data?.activeVisitors ?? 0}
              comparison={comparison}
              visitorsSeries={visitorsSeries}
              viewsSeries={viewsSeries}
              leadsSeries={leadsSeries}
              valueSeries={valueSeries}
              conversionSeries={conversionSeries}
            />

            <OverviewSection
              totalVisitors={totalVisitors}
              totalLeads={totalLeads}
              totalValue={totalValue}
              avgConversion={avgConversion}
              bounceRate={data?.engagement?.bounceRate ?? 0}
              trafficChangePct={comparison?.visitors ?? 0}
              topSource={trafficSources?.[0] ? { source: trafficSources[0].source, percentage: trafficSources[0].percentage } : undefined}
              topPage={topPages?.[0] ? { name: topPages[0].name, views: topPages[0].views } : undefined}
              activeProjectId={activeProjectId}
              dateRange={dateRange}
              monthlyAdSpend={monthlyAdSpend}
            />

            <TrafficSection
              chartData={chartData}
              prevSeries={prevSeries}
              trafficSources={trafficSources ?? []}
              heatmap={heatmap}
              referrers={referrers}
              totalVisitors={totalVisitors}
              activeProjectId={activeProjectId}
              dateRange={dateRange}
              heatmapLoading={heatmapLoading}
              heatmapError={heatmapError}
              refetchHeatmap={refetchHeatmap}
            />

            <ConversionsSection
              totalVisitors={totalVisitors}
              engagedVisitors={engagedVisitors}
              totalButtons={totalButtons}
              totalWhatsapp={totalWhatsapp}
              totalForms={totalForms}
              totalLeads={totalLeads}
              totalConversionsAll={totalConversionsAll}
              conversions={conversions}
            />

            <TopPagesSection
              topPages={topPages ?? []}
              referrers={referrers}
              activeProjectId={activeProjectId}
              heatmapLoading={heatmapLoading}
              heatmapError={heatmapError}
              refetchHeatmap={refetchHeatmap}
            />

            <div className="grid grid-cols-1 gap-4 mb-6">
              <AnnotationsHistoryCard
                projectId={activeProjectId}
                projectName={currentProject?.name || clientData?.project?.name}
                dateRangeDays={dateRange}
              />
            </div>

            <InsightsSection
              engagement={data?.engagement}
              devices={data?.devices ?? []}
              browsers={data?.browsers ?? []}
              operatingSystems={data?.operatingSystems ?? []}
              countries={data?.countries ?? []}
              cities={data?.cities ?? []}
              insights={insights}
            />
          </>
        )}
      </div>
    </AppLayout>
  );
};

const Dashboard = () => {
  const { selectedProjectId, setSelectedProjectId } = useSelectedProject();

  return (
    <DashboardFiltersProvider projectId={selectedProjectId}>
      <DashboardContent
        selectedProjectId={selectedProjectId}
        setSelectedProjectId={setSelectedProjectId}
      />
    </DashboardFiltersProvider>
  );
};

export default Dashboard;
