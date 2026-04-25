import { DailySummaryCard } from "@/components/dashboard/DailySummaryCard";
import { HealthScoreCard } from "@/components/dashboard/HealthScoreCard";
import { ReturningVisitorsCard } from "@/components/dashboard/ReturningVisitorsCard";
import { CostPerLeadCard } from "@/components/dashboard/CostPerLeadCard";
import { GoalsProgressCard } from "@/components/dashboard/GoalsProgressCard";
import { CriticalAlertsCard } from "@/components/dashboard/CriticalAlertsCard";

interface Props {
  totalVisitors: number;
  totalLeads: number;
  totalValue: number;
  avgConversion: number;
  bounceRate: number;
  trafficChangePct: number;
  topSource?: { source: string; percentage: number };
  topPage?: { name: string; views: number };
  activeProjectId?: string;
  dateRange: number;
  monthlyAdSpend: number;
}

export const OverviewSection = ({
  totalVisitors,
  totalLeads,
  totalValue,
  avgConversion,
  bounceRate,
  trafficChangePct,
  topSource,
  topPage,
  activeProjectId,
  dateRange,
  monthlyAdSpend,
}: Props) => (
  <>
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <DailySummaryCard
        visitors={totalVisitors}
        leads={totalLeads}
        topSource={topSource}
        topPage={topPage}
        trafficChangePct={trafficChangePct}
        conversionRate={avgConversion}
      />
      <HealthScoreCard
        visitors={totalVisitors}
        conversionRate={avgConversion}
        bounceRate={bounceRate}
        trafficChangePct={trafficChangePct}
      />
      <ReturningVisitorsCard projectId={activeProjectId} days={dateRange} />
      <CostPerLeadCard monthlyAdSpend={monthlyAdSpend} leads={totalLeads} days={dateRange} />
    </div>

    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
      <GoalsProgressCard
        projectId={activeProjectId}
        visitors={totalVisitors}
        leads={totalLeads}
        revenue={totalValue}
      />
      <CriticalAlertsCard projectId={activeProjectId} />
    </div>
  </>
);
