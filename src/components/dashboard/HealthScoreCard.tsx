import { Activity } from "lucide-react";
import { SectionCard } from "./SectionCard";

interface Props {
  visitors: number;
  conversionRate: number;
  bounceRate: number;
  trafficChangePct: number;
}

export const HealthScoreCard = ({ visitors, conversionRate, bounceRate, trafficChangePct }: Props) => {
  const trafficScore = Math.max(0, Math.min(100, 50 + trafficChangePct));
  const conversionScore = Math.max(0, Math.min(100, (conversionRate / 5) * 100));
  const engagementScore = Math.max(0, Math.min(100, 100 - bounceRate));
  const volumeBoost = visitors > 100 ? 0 : -10;

  const score = Math.max(0, Math.min(100, Math.round(
    trafficScore * 0.3 + conversionScore * 0.4 + engagementScore * 0.3 + volumeBoost,
  )));

  const status =
    score >= 75 ? { label: "Excelente", colorClass: "text-success", ringClass: "stroke-success" }
    : score >= 50 ? { label: "Bom", colorClass: "text-chart-blue", ringClass: "stroke-chart-blue" }
    : score >= 30 ? { label: "Atenção", colorClass: "text-warning", ringClass: "stroke-warning" }
    : { label: "Crítico", colorClass: "text-destructive", ringClass: "stroke-destructive" };

  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (score / 100) * circumference;

  return (
    <SectionCard
      title="Score de Saúde"
      tooltip={
        <div className="space-y-1 text-xs">
          <p>Indicador único combinando tráfego, conversão e engajamento.</p>
          <p><strong>≥75:</strong> Excelente · <strong>50-74:</strong> Bom · <strong>30-49:</strong> Atenção · <strong>&lt;30:</strong> Crítico</p>
        </div>
      }
    >
      <div className="flex items-center gap-4">
        <div className="relative shrink-0">
          <svg width="96" height="96" viewBox="0 0 96 96" className="-rotate-90">
            <circle cx="48" cy="48" r={radius} className="fill-none stroke-muted" strokeWidth="8" />
            <circle
              cx="48" cy="48" r={radius}
              className={`fill-none ${status.ringClass} transition-all duration-1000 ease-out`}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Activity className={`h-3.5 w-3.5 mb-0.5 ${status.colorClass}`} />
            <span className={`text-2xl font-bold tabular-nums tracking-tight ${status.colorClass}`}>{score}</span>
          </div>
        </div>

        <div className="flex-1 min-w-0 space-y-2">
          <p className={`text-sm font-semibold ${status.colorClass}`}>{status.label}</p>
          <ul className="space-y-1 text-xs text-muted-foreground">
            <li className="flex justify-between gap-2"><span>Tráfego</span><span className="tabular-nums font-medium text-foreground">{Math.round(trafficScore)}</span></li>
            <li className="flex justify-between gap-2"><span>Conversão</span><span className="tabular-nums font-medium text-foreground">{Math.round(conversionScore)}</span></li>
            <li className="flex justify-between gap-2"><span>Engajamento</span><span className="tabular-nums font-medium text-foreground">{Math.round(engagementScore)}</span></li>
          </ul>
        </div>
      </div>
    </SectionCard>
  );
};
