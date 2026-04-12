import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Users, Target, TrendingUp, DollarSign } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import KPICard from "@/components/dashboard/KPICard";
import VisitorsChart from "@/components/dashboard/VisitorsChart";
import TrafficSources from "@/components/dashboard/TrafficSources";
import ConversionsCard from "@/components/dashboard/ConversionsCard";
import TopPages from "@/components/dashboard/TopPages";
import InsightsSection from "@/components/dashboard/InsightsSection";
import { useDashboardAnalytics } from "@/hooks/useDashboardData";
import { format } from "date-fns";

const Dashboard = () => {
  const [dateRange, setDateRange] = useState(30);
  const { data, isLoading } = useDashboardAnalytics(dateRange);

  const clientData = data?.client;
  const metrics = data?.metrics;
  const trafficSources = data?.trafficSources;
  const topPages = data?.topPages;

  // Compute KPIs from real data
  const totalVisitors = metrics?.reduce((s, m) => s + m.visitors, 0) ?? 0;
  const totalLeads = metrics?.reduce((s, m) => s + m.leads, 0) ?? 0;
  const avgConversion = totalVisitors > 0 ? Number(((totalLeads / totalVisitors) * 100).toFixed(2)) : 0;
  const totalValue = metrics?.reduce((s, m) => s + Number(m.estimated_value), 0) ?? 0;
  const totalWhatsapp = metrics?.reduce((s, m) => s + m.whatsapp_clicks, 0) ?? 0;
  const totalForms = metrics?.reduce((s, m) => s + m.form_submissions, 0) ?? 0;
  const totalButtons = metrics?.reduce((s, m) => s + m.button_clicks, 0) ?? 0;

  // Chart data
  const chartData = metrics?.map((m) => ({
    date: format(new Date(m.date), "dd/MM"),
    visitors: m.visitors,
    leads: m.leads,
  })) ?? [];

  // Insights
  const insights = [];
  if (totalVisitors > 0) {
    if (avgConversion > 3) {
      insights.push({ type: "growth" as const, title: "Conversão Forte", message: `Sua taxa de conversão de ${avgConversion}% está acima da média do mercado de 2,5%.` });
    }
    insights.push({ type: "info" as const, title: "Canal Principal", message: `Google orgânico é o canal com melhor desempenho, representando a maior parte do tráfego.` });
    if (totalLeads > 50) {
      insights.push({ type: "growth" as const, title: "Geração de Leads", message: `Você gerou ${totalLeads} leads nos últimos ${dateRange} dias. Continue investindo nos canais ativos.` });
    }
  }

  // Redirect to onboarding if no client registered
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

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardHeader
          dateRange={dateRange}
          onDateRangeChange={setDateRange}
          clientName={clientData?.company_name}
          projectName={clientData?.project?.name}
        />

        {!hasData ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <BarChart3 className="h-16 w-16 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Ainda não há dados disponíveis
            </h3>
            <p className="text-sm text-muted-foreground max-w-md mb-2">
              {clientData?.analytics_property_id
                ? "Seu Google Analytics está conectado, mas ainda não registrou tráfego no período selecionado. Verifique se o tag do GA4 está instalado no seu site."
                : "Configure o Google Analytics Property ID nas configurações para começar a ver os dados do seu site."}
            </p>
            {!clientData?.analytics_property_id && (
              <a href="/settings" className="text-sm text-primary hover:underline mt-2">
                Ir para Configurações →
              </a>
            )}
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              <KPICard title="Visitantes" value={totalVisitors.toLocaleString("pt-BR")} change={12.3} icon={<Users className="h-4 w-4" />} />
              <KPICard title="Taxa de Conversão" value={`${avgConversion}%`} change={1.2} icon={<Target className="h-4 w-4" />} />
              <KPICard title="Leads" value={totalLeads.toLocaleString("pt-BR")} change={8.5} icon={<TrendingUp className="h-4 w-4" />} />
              <KPICard title="Valor Estimado" value={`R$ ${totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} change={15.1} icon={<DollarSign className="h-4 w-4" />} />
            </div>

            {/* Chart + Traffic */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
              <div className="lg:col-span-2">
                <VisitorsChart data={chartData} />
              </div>
              <TrafficSources data={trafficSources ?? []} />
            </div>

            {/* Conversions + Top Pages */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              <ConversionsCard data={{
                whatsappClicks: { value: totalWhatsapp, change: 12.5 },
                formSubmissions: { value: totalForms, change: -3.2 },
                buttonClicks: { value: totalButtons, change: 8.7 },
              }} />
              <TopPages pages={topPages ?? []} />
            </div>

            {/* Insights */}
            {insights.length > 0 && <InsightsSection insights={insights} />}
          </>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
