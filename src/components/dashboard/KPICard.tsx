import { TrendingUp, TrendingDown } from "lucide-react";
import { Sparklines, SparklinesLine } from "@/components/dashboard/Sparkline";

interface KPICardProps {
  title: string;
  value: string;
  change: number | null;
  icon: React.ReactNode;
  changeUnit?: "%" | "pp";
  sparkline?: number[];
  sparklineColor?: string;
}

const KPICard = ({ title, value, change, icon, changeUnit = "%", sparkline, sparklineColor }: KPICardProps) => {
  const hasChange = change !== null && change !== undefined && change !== 0;
  const isPositive = hasChange && change >= 0;

  return (
    <div className="glass-card p-5 transition-all duration-150 ease-in-out hover:shadow-md relative overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground tracking-wide">{title}</span>
        <div className="text-muted-foreground/50">{icon}</div>
      </div>
      <div className="text-2xl font-medium text-card-foreground mb-1">{value}</div>
      {hasChange ? (
        <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          <span>{isPositive ? "+" : ""}{change}{changeUnit === "pp" ? " pp" : "%"}</span>
          <span className="text-muted-foreground ml-1">vs anterior</span>
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">—</div>
      )}
      {sparkline && sparkline.length > 1 && (
        <div className="absolute bottom-0 left-0 right-0 h-10 opacity-60 pointer-events-none">
          <Sparklines data={sparkline}>
            <SparklinesLine color={sparklineColor || "hsl(var(--primary))"} />
          </Sparklines>
        </div>
      )}
    </div>
  );
};

export default KPICard;
