import { TrendingUp, TrendingDown } from "lucide-react";

interface KPICardProps {
  title: string;
  value: string;
  change: number;
  icon: React.ReactNode;
}

const KPICard = ({ title, value, change, icon }: KPICardProps) => {
  const isPositive = change >= 0;

  return (
    <div className="glass-card rounded-xl p-5 transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-muted-foreground">{title}</span>
        <div className="text-muted-foreground/60">{icon}</div>
      </div>
      <div className="text-2xl font-semibold text-card-foreground mb-1">{value}</div>
      <div className={`flex items-center gap-1 text-xs font-medium ${isPositive ? "text-[hsl(var(--success))]" : "text-destructive"}`}>
        {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
        <span>{isPositive ? "+" : ""}{change}%</span>
        <span className="text-muted-foreground ml-1">vs período anterior</span>
      </div>
    </div>
  );
};

export default KPICard;
