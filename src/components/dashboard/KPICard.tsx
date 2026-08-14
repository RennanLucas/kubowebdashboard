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
  previousValue?: string;
}

const KPICard = ({ title, value, change, icon, changeUnit = "%", sparkline, sparklineColor, tooltip, previousValue }: KPICardProps) => {
  const hasChange = change !== null && change !== undefined && change !== 0;
  const isPositive = hasChange && change >= 0;

  return (
    <div className={`animated-border-gradient glass-card glass-card-hover p-5 relative overflow-hidden group min-h-[180px] ${sparkline && sparkline.length > 1 ? "pb-12" : ""}`}>
      <div className="absolute inset-0 bg-noise opacity-[0.02] pointer-events-none" />
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-1 min-w-0 flex-1">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground leading-tight">
            {title}
          </span>
          {tooltip && <InfoTooltip content={tooltip} />}
        </div>
        <div className={`h-7 w-7 rounded-lg flex items-center justify-center transition-colors duration-200 shrink-0 ${hasChange ? (isPositive ? 'bg-success/10 text-success group-hover:bg-success/20' : 'bg-destructive/10 text-destructive group-hover:bg-destructive/20') : 'bg-muted/70 text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary'}`}>
          {icon}
        </div>
      </div>

      <div className="relative inline-block mb-2">
        <div className="absolute -inset-2 bg-primary/20 blur-xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
        <div className="text-[26px] leading-tight font-semibold text-card-foreground tracking-tight tabular-nums relative z-10">
          {value}
        </div>
      </div>

      {hasChange ? (
        <div className="flex items-center gap-1.5 flex-wrap">
          <span
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[11px] font-semibold tabular-nums ${
              isPositive
                ? "bg-success/10 text-success"
                : "bg-destructive/10 text-destructive"
            }`}
          >
            {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {isPositive ? "+" : ""}
            {change}
            {changeUnit === "pp" ? " pp" : "%"}
          </span>
          <span className="text-[11px] text-muted-foreground tabular-nums">
            {previousValue ? <>vs <span className="font-medium text-foreground/80">{previousValue}</span></> : "vs anterior"}
          </span>
        </div>
      ) : (
        <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
          <Minus className="h-3 w-3" />
          <span>{previousValue ? <>vs <span className="font-medium text-foreground/80 tabular-nums">{previousValue}</span></> : "sem variação"}</span>
        </div>
      )}

      {sparkline && sparkline.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-10 opacity-30 pointer-events-none transition-opacity duration-200 group-hover:opacity-60">
          <Sparklines data={sparkline}>
            <SparklinesLine color={sparklineColor || "hsl(var(--primary))"} />
          </Sparklines>
        </div>
      )}
    </div>
  );
};

export default KPICard;
