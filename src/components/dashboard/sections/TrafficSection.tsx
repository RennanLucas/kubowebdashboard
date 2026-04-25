import VisitorsChart from "@/components/dashboard/VisitorsChart";
import TrafficSources from "@/components/dashboard/TrafficSources";
import { HourlyHeatmap } from "@/components/dashboard/HourlyHeatmap";
import { SuspiciousTrafficCard } from "@/components/dashboard/SuspiciousTrafficCard";
import { WidgetBoundary } from "@/components/dashboard/WidgetBoundary";
import type { HeatmapCell, ReferrerStat } from "@/hooks/useHourlyHeatmap";

interface Props {
  chartData: Array<{ date: string; visitors: number; leads: number; rawDate: string }>;
  prevSeries: number[];
  trafficSources: Array<{ source: string; visitors: number; percentage: number }>;
  heatmap: HeatmapCell[];
  referrers: ReferrerStat[];
  totalVisitors: number;
  activeProjectId?: string;
  dateRange: number;
  heatmapLoading: boolean;
  heatmapError: Error | null;
  refetchHeatmap: () => void;
}

export const TrafficSection = ({
  chartData,
  prevSeries,
  trafficSources,
  heatmap,
  referrers,
  totalVisitors,
  activeProjectId,
  dateRange,
  heatmapLoading,
  heatmapError,
  refetchHeatmap,
}: Props) => (
  <>
    <div className="grid grid-cols-1 gap-4 mb-6">
      <WidgetBoundary
        isLoading={heatmapLoading}
        error={heatmapError}
        onRetry={refetchHeatmap}
        title="Não foi possível analisar a qualidade do tráfego"
        skeletonHeight={120}
      >
        <SuspiciousTrafficCard referrers={referrers} totalVisitors={totalVisitors} />
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
  </>
);
