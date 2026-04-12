import { TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  change: number | null;
  icon: React.ReactNode;
}

const KPICard = ({ title, value, change, icon }: KPICardProps) => {
  const hasChange = change !== null && change !== undefined;
  const isPositive = hasChange && change >= 0;

  return (
    <div className="glass-card p-5 transition-all duration-150 ease-in-out hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium text-muted-foreground tracking-wide">{title}</span>
        <div className="text-muted-foreground/50">{icon}</div>
      </div>
      <div className="text-2xl font-medium text-card-foreground mb-1">{value}</div>
      {hasChange ? (
        <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
          {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          <span>{isPositive ? "+" : ""}{change}%</span>
          <span className="text-muted-foreground ml-1">vs período anterior</span>
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">—</div>
      )}
    </div>
  );
};

export default KPICard;
