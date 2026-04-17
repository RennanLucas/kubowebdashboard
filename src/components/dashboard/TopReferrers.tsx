import { Card } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";
import { InfoTooltip } from "@/components/InfoTooltip";
import { ReferrerStat } from "@/hooks/useHourlyHeatmap";

interface Props {
  data: ReferrerStat[];
  isLoading?: boolean;
}

export const TopReferrers = ({ data, isLoading }: Props) => {
  return (
    <Card className="p-5">
      <div className="flex items-center gap-2 mb-4">
        <ExternalLink className="h-4 w-4 text-primary" />
        <h3 className="text-sm font-medium text-card-foreground">Top sites de origem</h3>
        <InfoTooltip content="Sites que mais enviam visitantes para você, com taxa de conversão por origem. Útil para identificar parcerias valiosas e priorizar canais de aquisição." />
      </div>

      {isLoading ? (
        <div className="text-xs text-muted-foreground py-6">Carregando...</div>
      ) : data.length === 0 ? (
        <div className="text-xs text-muted-foreground py-6">Sem dados de referência ainda.</div>
      ) : (
        <div className="space-y-2">
          <div className="grid grid-cols-12 text-[10px] uppercase tracking-wider text-muted-foreground pb-1 border-b border-border">
            <div className="col-span-6">Origem</div>
            <div className="col-span-2 text-right">Visit.</div>
            <div className="col-span-2 text-right">Conv.</div>
            <div className="col-span-2 text-right">Taxa</div>
          </div>
          {data.map((r) => (
            <div key={r.domain} className="grid grid-cols-12 items-center text-xs py-1">
              <div className="col-span-6 truncate text-foreground" title={r.domain}>
                {r.domain}
              </div>
              <div className="col-span-2 text-right text-muted-foreground">{r.visitors}</div>
              <div className="col-span-2 text-right text-muted-foreground">{r.conversions}</div>
              <div
                className={`col-span-2 text-right font-medium ${
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
    </Card>
  );
};
