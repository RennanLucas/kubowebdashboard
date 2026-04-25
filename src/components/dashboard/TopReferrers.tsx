import { ExternalLink } from "lucide-react";
import { SectionCard } from "@/components/dashboard/SectionCard";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { ReferrerStat } from "@/hooks/useHourlyHeatmap";

interface Props {
  data: ReferrerStat[];
  isLoading?: boolean;
}

export const TopReferrers = ({ data, isLoading }: Props) => {
  return (
    <SectionCard
      title="Top sites de origem"
      subtitle="Conversão por canal de aquisição"
      tooltip="Sites que mais enviam visitantes para você, com taxa de conversão por origem. Útil para identificar parcerias valiosas e priorizar canais de aquisição."
    >
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 rounded-md bg-muted/60 shimmer" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <EmptyState
          icon={<ExternalLink className="h-5 w-5" />}
          title="Sem dados de referência ainda"
          description="Mostraremos os sites assim que chegarem visitas."
        />
      ) : (
        <div className="space-y-1">
          <div className="grid grid-cols-12 text-[10px] uppercase tracking-wider text-muted-foreground pb-2 border-b border-border font-semibold">
            <div className="col-span-6">Origem</div>
            <div className="col-span-2 text-right">Visit.</div>
            <div className="col-span-2 text-right">Conv.</div>
            <div className="col-span-2 text-right">Taxa</div>
          </div>
          {data.map((r) => (
            <div
              key={r.domain}
              className="grid grid-cols-12 items-center text-xs py-2 px-1 -mx-1 rounded-md transition-colors duration-150 hover:bg-muted/40"
            >
              <div className="col-span-6 truncate text-foreground font-medium" title={r.domain}>
                {r.domain}
              </div>
              <div className="col-span-2 text-right text-muted-foreground tabular-nums">{r.visitors}</div>
              <div className="col-span-2 text-right text-muted-foreground tabular-nums">{r.conversions}</div>
              <div
                className={`col-span-2 text-right font-semibold tabular-nums ${
                  r.conversionRate >= 3
                    ? "text-[hsl(var(--success))]"
                    : r.conversionRate >= 1
                    ? "text-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {r.conversionRate.toFixed(1)}%
              </div>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
};
