import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Users, Target, TrendingUp, DollarSign, BarChart3, Eye } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import KPICard from "@/components/dashboard/KPICard";
import VisitorsChart from "@/components/dashboard/VisitorsChart";
import TrafficSources from "@/components/dashboard/TrafficSources";
import ConversionsCard from "@/components/dashboard/ConversionsCard";
import TopPages from "@/components/dashboard/TopPages";
import InsightsSection from "@/components/dashboard/InsightsSection";
import { useDashboardAnalytics } from "@/hooks/useDashboardData";
import { format } from "date-fns";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const [dateRange, setDateRange] = useState(30);
  const [selectedProjectId, setSelectedProjectId] = useState<string | undefined>();
  const { data, isLoading, error } = useDashboardAnalytics(dateRange, selectedProjectId);

  const clientData = data?.client;
  const metrics = data?.metrics;
  const trafficSources = data?.trafficSources;
  const topPages = data?.topPages;
  const comparison = data?.comparison;
  const conversions = data?.conversions;

  const totalVisitors = metrics?.reduce((s, m) => s + m.visitors, 0) ?? 0;
  const totalLeads = metrics?.reduce((s, m) => s + m.leads, 0) ?? 0;
  const avgConversion = totalVisitors > 0 ? Number(((totalLeads / totalVisitors) * 100).toFixed(2)) : 0;
  const totalValue = metrics?.reduce((s, m) => s + Number(m.estimated_value), 0) ?? 0;
  const totalWhatsapp = metrics?.reduce((s, m) => s + m.whatsapp_clicks, 0) ?? 0;
  const totalForms = metrics?.reduce((s, m) => s + m.form_submissions, 0) ?? 0;
  const totalButtons = metrics?.reduce((s, m) => s + m.button_clicks, 0) ?? 0;
  const totalViews = metrics?.reduce((s, m) => s + (m.visitors || 0), 0) ?? 0;

  const chartData = metrics?.map((m) => ({
    date: format(new Date(m.date), "dd/MM"),
    visitors: m.visitors,
    leads: m.leads,
  })) ?? [];

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

  if (!isLoading && !clientData) {
    return <Navigate to="/onboarding" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
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

  const currentProject = clientData?.projects?.find(p => p.id === (selectedProjectId || clientData?.project?.id));

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardHeader
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          clientName={clientData?.company_name}
          projectName={currentProject?.name || clientData?.project?.name}
          projects={clientData?.projects}
          selectedProjectId={selectedProjectId || clientData?.project?.id}
          onProjectChange={setSelectedProjectId}
          onExportPDF={hasData ? handleExportPDF : undefined}
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
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <KPICard title="Visitantes" value={totalVisitors.toLocaleString("pt-BR")} change={comparison?.visitors ?? null} icon={<Users className="h-4 w-4" />} />
              <KPICard title="Pageviews" value={totalViews.toLocaleString("pt-BR")} change={comparison?.views ?? null} icon={<Eye className="h-4 w-4" />} />
              <KPICard title="Leads" value={totalLeads.toLocaleString("pt-BR")} change={null} icon={<TrendingUp className="h-4 w-4" />} />
              <KPICard title="Valor Estimado" value={`R$ ${totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} change={null} icon={<DollarSign className="h-4 w-4" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <div className="lg:col-span-2">
                <VisitorsChart data={chartData} />
              </div>
              <TrafficSources data={trafficSources ?? []} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <ConversionsCard data={{
                whatsappClicks: { value: conversions?.whatsapp_clicks ?? totalWhatsapp, change: conversions?.changes.whatsapp ?? 0 },
                formSubmissions: { value: conversions?.form_submissions ?? totalForms, change: conversions?.changes.forms ?? 0 },
                buttonClicks: { value: conversions?.button_clicks ?? totalButtons, change: conversions?.changes.buttons ?? 0 },
                recentEvents: conversions?.recent ?? [],
              }} />
              <TopPages pages={topPages ?? []} />
            </div>

            {insights.length > 0 && <InsightsSection insights={insights} />}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
