import TopPages from "@/components/dashboard/TopPages";
import { TopReferrers } from "@/components/dashboard/TopReferrers";
import LiveFeedCard from "@/components/dashboard/LiveFeedCard";
import { WidgetBoundary } from "@/components/dashboard/WidgetBoundary";
import type { ReferrerStat } from "@/hooks/useHourlyHeatmap";

interface Props {
  topPages: any[];
  referrers: ReferrerStat[];
  activeProjectId?: string;
  heatmapLoading: boolean;
  heatmapError: Error | null;
  refetchHeatmap: () => void;
}

export const TopPagesSection = ({
  topPages,
  referrers,
  activeProjectId,
  heatmapLoading,
  heatmapError,
  refetchHeatmap,
}: Props) => (
  <>
    <div className="mb-2.5">
      <p className="text-[11px] text-muted-foreground uppercase tracking-wider font-semibold">Páginas & Referências</p>
      <p className="text-xs text-muted-foreground/70 mt-0.5">Páginas com maior volume de acessos e origens de tráfego externo</p>
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6 stagger-children">
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
  </div>
  </>
);
