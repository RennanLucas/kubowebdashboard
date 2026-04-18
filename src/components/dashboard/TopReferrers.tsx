import { ExternalLink } from "lucide-react";
import { InfoTooltip } from "@/components/InfoTooltip";
import { ReferrerStat } from "@/hooks/useHourlyHeatmap";

interface Props {
  data: ReferrerStat[];
  isLoading?: boolean;
}

export const TopReferrers = ({ data, isLoading }: Props) => {
  return (
    <div className="glass-card p-5 sm:p-6">
      <div className="mb-4">
        <div className="flex items-center gap-1.5">
          <h3 className="section-title">Top sites de origem</h3>
          <InfoTooltip content="Sites que mais enviam visitantes para você, com taxa de conversão por origem. Útil para identificar parcerias valiosas e priorizar canais de aquisição." />
        </div>
        <p className="section-subtitle">Conversão por canal de aquisição</p>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-9 rounded-md bg-muted/60 shimmer" />
          ))}
        </div>
      ) : data.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <div className="h-12 w-12 rounded-full bg-muted/70 flex items-center justify-center mb-3">
            <ExternalLink className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium text-foreground">Sem dados de referência ainda</p>
          <p className="text-xs text-muted-foreground mt-1">Mostraremos os sites assim que chegarem visitas.</p>
        </div>
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
    </div>
  );
};
