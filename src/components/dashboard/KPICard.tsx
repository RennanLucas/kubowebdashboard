import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Sparklines, SparklinesLine } from "@/components/dashboard/Sparkline";
import { InfoTooltip } from "@/components/InfoTooltip";

interface KPICardProps {
  title: string;
  value: string;
  change: number | null;
  icon: React.ReactNode;
  changeUnit?: "%" | "pp";
  sparkline?: number[];
  sparklineColor?: string;
  tooltip?: React.ReactNode;
}

const KPICard = ({ title, value, change, icon, changeUnit = "%", sparkline, sparklineColor, tooltip }: KPICardProps) => {
  const hasChange = change !== null && change !== undefined && change !== 0;
  const isPositive = hasChange && change >= 0;

  return (
    <div className="glass-card glass-card-hover p-5 relative overflow-hidden group">
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground leading-tight">
            {title}
          </span>
          {tooltip && <InfoTooltip content={tooltip} />}
        </div>
        <div className="h-7 w-7 rounded-lg bg-muted/70 flex items-center justify-center text-muted-foreground transition-colors duration-200 group-hover:bg-primary/10 group-hover:text-primary shrink-0">
          {icon}
        </div>
      </div>

      <div className="text-[26px] leading-tight font-semibold text-card-foreground tracking-tight mb-2 tabular-nums">
        {value}
      </div>

      {hasChange ? (
        <div className="flex items-center gap-1.5">
          <span
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-semibold tabular-nums ${
              isPositive
                ? "bg-[hsl(var(--success))]/10 text-[hsl(var(--success))]"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {isPositive ? "+" : ""}
            {change}
            {changeUnit === "pp" ? " pp" : "%"}
          </span>
          <span className="text-[11px] text-muted-foreground">vs anterior</span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Minus className="h-3 w-3" />
          <span>sem variação</span>
        </div>
      )}

      {sparkline && sparkline.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-12 opacity-50 pointer-events-none transition-opacity duration-200 group-hover:opacity-80">
          <Sparklines data={sparkline}>
            <SparklinesLine color={sparklineColor || "hsl(var(--primary))"} />
          </Sparklines>
        </div>
      )}
    </div>
  );
};

export default KPICard;
