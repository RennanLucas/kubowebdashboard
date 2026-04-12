import { TrendingUp, TrendingDown, Info } from "lucide-react";

interface Insight {
  type: "growth" | "drop" | "info";
  title: string;
  message: string;
}

const iconMap = {
  growth: <TrendingUp className="h-4 w-4 text-[hsl(var(--success))]" />,
  drop: <TrendingDown className="h-4 w-4 text-destructive" />,
  info: <Info className="h-4 w-4 text-primary" />,
};

const bgMap = {
  growth: "bg-[hsl(var(--success))]/5 border-[hsl(var(--success))]/15",
  drop: "bg-destructive/5 border-destructive/15",
  info: "bg-primary/5 border-primary/15",
};

const InsightsSection = ({ insights }: { insights: Insight[] }) => (
  <div className="glass-card p-5">
    <h3 className="text-sm font-medium text-card-foreground mb-4">Insights</h3>
    <div className="space-y-3">
      {insights.map((insight, i) => (
        <div key={i} className={`flex items-start gap-3 p-3 rounded-lg border ${bgMap[insight.type]} transition-colors duration-150`}>
          <div className="mt-0.5">{iconMap[insight.type]}</div>
          <div>
            <p className="text-sm font-medium text-card-foreground">{insight.title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{insight.message}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default InsightsSection;
