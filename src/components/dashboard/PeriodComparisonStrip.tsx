import { TrendingUp, TrendingDown, Minus, ArrowRight } from "lucide-react";
import { InfoTooltip } from "@/components/InfoTooltip";

interface ComparisonItem {
  label: string;
  current: number;
  previous: number;
  format?: (v: number) => string;
  unit?: string;
}

interface Props {
  dateRange: number;
  items: ComparisonItem[];
}

const fmtDefault = (v: number) => v.toLocaleString("pt-BR");

const periodLabel = (days: number) => {
  if (days === 7) return { current: "Últimos 7 dias", previous: "7 dias anteriores" };
  if (days === 30) return { current: "Últimos 30 dias", previous: "30 dias anteriores" };
  if (days === 90) return { current: "Últimos 90 dias", previous: "90 dias anteriores" };
  return { current: `Últimos ${days} dias`, previous: `${days} dias anteriores` };
};

export const PeriodComparisonStrip = ({ dateRange, items }: Props) => {
  const labels = periodLabel(dateRange);

  return (
    <div className="glass-card p-4 sm:p-5 mb-6">
      <div className="flex items-center justify-between gap-3 mb-3 flex-wrap">
        <div className="flex items-center gap-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Comparação de período
          </h3>
          <InfoTooltip content="Comparação direta dos principais indicadores entre o período selecionado e o intervalo equivalente imediatamente anterior. A variação é calculada como (atual − anterior) ÷ anterior × 100." />
        </div>
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            <span className="font-medium text-foreground">{labels.current}</span>
          </span>
          <ArrowRight className="h-3 w-3 opacity-50" />
          <span className="inline-flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40" />
            {labels.previous}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {items.map((item) => {
          const fmt = item.format ?? fmtDefault;
          const diff = item.current - item.previous;
          const pct = item.previous > 0 ? (diff / item.previous) * 100 : (item.current > 0 ? 100 : 0);
          const rounded = Math.round(pct * 10) / 10;
          const dir = rounded > 0 ? "up" : rounded < 0 ? "down" : "flat";

          const dirStyle = dir === "up"
            ? { bg: "bg-success/10", text: "text-success", icon: <TrendingUp className="h-3 w-3" /> }
            : dir === "down"
            ? { bg: "bg-destructive/10", text: "text-destructive", icon: <TrendingDown className="h-3 w-3" /> }
            : { bg: "bg-muted", text: "text-muted-foreground", icon: <Minus className="h-3 w-3" /> };

          return (
            <div key={item.label} className="rounded-lg border border-border/60 bg-background/40 p-3">
              <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground mb-1.5">
                {item.label}
              </p>
              <div className="flex items-baseline gap-2 flex-wrap">
                <span className="text-base font-semibold text-foreground tabular-nums">
                  {fmt(item.current)}{item.unit ?? ""}
                </span>
                <span className="text-[11px] text-muted-foreground tabular-nums">
                  vs {fmt(item.previous)}{item.unit ?? ""}
                </span>
              </div>
              <span
                className={`inline-flex items-center gap-0.5 mt-2 px-1.5 py-0.5 rounded-md text-[11px] font-semibold tabular-nums ${dirStyle.bg} ${dirStyle.text}`}
              >
                {dirStyle.icon}
                {rounded > 0 ? "+" : ""}{rounded}%
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
