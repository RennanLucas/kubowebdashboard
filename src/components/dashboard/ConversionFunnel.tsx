import { TrendingDown } from "lucide-react";
import { SectionCard } from "./SectionCard";

interface FunnelStep {
  label: string;
  value: number;
  color: string;
}

interface ConversionFunnelProps {
  visitors: number;
  engaged: number;
  clicks: number;
  conversions: number;
}

export function ConversionFunnel({ visitors, engaged, clicks, conversions }: ConversionFunnelProps) {
  const steps: FunnelStep[] = [
    { label: "Visitantes", value: visitors, color: "hsl(var(--chart-blue))" },
    { label: "Engajados", value: engaged, color: "hsl(var(--chart-purple))" },
    { label: "Cliques em CTA", value: clicks, color: "hsl(var(--chart-orange))" },
    { label: "Conversões", value: conversions, color: "hsl(var(--chart-green))" },
  ];

  const max = Math.max(visitors, 1);

  return (
    <SectionCard
      title="Funil de Conversão"
      subtitle="Jornada do visitante até a conversão"
      tooltip={
        <div className="space-y-1.5">
          <p>Mostra a jornada do visitante em 4 etapas:</p>
          <ul className="list-disc pl-3 space-y-0.5">
            <li><strong>Visitantes:</strong> total de pessoas que entraram</li>
            <li><strong>Engajados:</strong> visitantes que não saíram imediatamente (ficaram navegando)</li>
            <li><strong>Cliques em CTA:</strong> clicaram em botões ou WhatsApp</li>
            <li><strong>Conversões:</strong> completaram uma ação (lead)</li>
          </ul>
          <p className="pt-1">A queda entre etapas mostra onde você está perdendo público.</p>
        </div>
      }
    >

      <div className="space-y-4">
        {steps.map((step, i) => {
          const widthPct = max > 0 ? (step.value / max) * 100 : 0;
          const prev = i > 0 ? steps[i - 1].value : null;
          const dropOff = prev !== null && prev > 0 ? ((prev - step.value) / prev) * 100 : 0;
          const conversionPct = prev !== null && prev > 0 ? (step.value / prev) * 100 : 100;

          return (
            <div key={step.label} className="group">
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span
                    className="h-2 w-2 rounded-full shrink-0"
                    style={{ backgroundColor: step.color }}
                  />
                  <span className="text-xs font-medium text-foreground">{step.label}</span>
                </div>
                <div className="flex items-center gap-2 tabular-nums">
                  <span className="text-sm font-semibold text-foreground">
                    {step.value.toLocaleString("pt-BR")}
                  </span>
                  {i > 0 && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-muted text-muted-foreground font-medium">
                      {conversionPct.toFixed(1)}%
                    </span>
                  )}
                </div>
              </div>
              <div className="h-9 bg-muted/60 rounded-lg overflow-hidden relative">
                <div
                  className="h-full rounded-lg transition-all duration-700 ease-out opacity-90"
                  style={{
                    width: `${Math.max(widthPct, 2)}%`,
                    backgroundColor: step.color,
                  }}
                />
              </div>
              {i > 0 && dropOff > 0 && (
                <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground">
                  <TrendingDown className="h-2.5 w-2.5 text-destructive" />
                  <span>{dropOff.toFixed(1)}% perda em relação à etapa anterior</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-6 pt-4 border-t border-border">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-muted-foreground">Taxa final de conversão</span>
          <span className="text-xl font-semibold text-primary tabular-nums">
            {visitors > 0 ? ((conversions / visitors) * 100).toFixed(2) : "0.00"}%
          </span>
        </div>
      </div>
    </div>
  );
}
