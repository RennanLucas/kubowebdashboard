import { useState, useMemo } from "react";
import { Users, Target, TrendingUp, DollarSign } from "lucide-react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import KPICard from "@/components/dashboard/KPICard";
import VisitorsChart from "@/components/dashboard/VisitorsChart";
import TrafficSources from "@/components/dashboard/TrafficSources";
import ConversionsCard from "@/components/dashboard/ConversionsCard";
import TopPages from "@/components/dashboard/TopPages";
import InsightsSection from "@/components/dashboard/InsightsSection";
import { generateDailyMetrics, getKPIs, getTrafficSources, getConversions, getTopPages, getInsights } from "@/lib/mock-data";

const Dashboard = () => {
  const [dateRange, setDateRange] = useState(30);

  const chartData = useMemo(() => generateDailyMetrics(dateRange), [dateRange]);
  const kpis = useMemo(() => getKPIs(dateRange), [dateRange]);
  const trafficSources = getTrafficSources();
  const conversions = getConversions();
  const topPages = getTopPages();
  const insights = useMemo(() => getInsights(dateRange), [dateRange]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <DashboardHeader dateRange={dateRange} onDateRangeChange={setDateRange} />

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <KPICard title="Visitors" value={kpis.visitors.value.toLocaleString()} change={kpis.visitors.change} icon={<Users className="h-4 w-4" />} />
          <KPICard title="Conversion Rate" value={`${kpis.conversionRate.value}%`} change={kpis.conversionRate.change} icon={<Target className="h-4 w-4" />} />
          <KPICard title="Leads" value={kpis.leads.value.toLocaleString()} change={kpis.leads.change} icon={<TrendingUp className="h-4 w-4" />} />
          <KPICard title="Est. Value" value={`$${kpis.estimatedValue.value.toLocaleString()}`} change={kpis.estimatedValue.change} icon={<DollarSign className="h-4 w-4" />} />
        </div>

        {/* Chart + Traffic */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          <div className="lg:col-span-2">
            <VisitorsChart data={chartData} />
          </div>
          <TrafficSources data={trafficSources} />
        </div>

        {/* Conversions + Top Pages */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <ConversionsCard data={conversions} />
          <TopPages pages={topPages} />
        </div>

        {/* Insights */}
        <InsightsSection insights={insights} />
      </div>
    </div>
  );
};

export default Dashboard;
