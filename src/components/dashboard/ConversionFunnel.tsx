import { memo } from "react";
import { TrendingDown } from "lucide-react";
import { SectionCard } from "./SectionCard";

interface FunnelStep {
  label: string;
  value: number;
  dotClass: string;
  barClass: string;
}

interface ConversionFunnelProps {
  visitors: number;
  engaged: number;
  clicks: number;
  conversions: number;
}

export const ConversionFunnel = memo(function ConversionFunnel({ visitors, engaged, clicks, conversions }: ConversionFunnelProps) {
  const steps: FunnelStep[] = [
    { label: "Visitantes", value: visitors, dotClass: "bg-chart-blue", barClass: "bg-gradient-to-r from-chart-blue to-chart-blue/60" },
    { label: "Engajados", value: engaged, dotClass: "bg-chart-purple", barClass: "bg-gradient-to-r from-chart-purple to-chart-purple/60" },
    { label: "Cliques em CTA", value: clicks, dotClass: "bg-chart-orange", barClass: "bg-gradient-to-r from-chart-orange to-chart-orange/60" },
    { label: "Conversões", value: conversions, dotClass: "bg-chart-green", barClass: "bg-gradient-to-r from-chart-green to-chart-green/60" },
  ];

  const max = Math.max(visitors, 1);

  return (
    <SectionCard
      title="Funil de Conversão"
      subtitle="Jornada do visitante até a conversão"
      tooltip="Acompanhe a perda de visitantes em cada etapa chave da jornada, desde o primeiro acesso até o momento do contato ou conversão."
    >
      <div className="space-y-5 mt-2">
        {steps.map((step, i) => {
          const width = Math.max((step.value / max) * 100, 2);
          const dropOff = i > 0 ? ((steps[i - 1].value - step.value) / Math.max(steps[i - 1].value, 1)) * 100 : 0;

          return (
            <div key={step.label} className="relative group">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <div className="flex items-center gap-1.5 font-medium text-foreground">
                  <span className={`h-2 w-2 rounded-full ${step.dotClass}`} />
                  {step.label}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground tabular-nums">{step.value.toLocaleString("pt-BR")}</span>
                  <span className="text-muted-foreground w-12 text-right">
                    {((step.value / max) * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="h-6 w-full rounded-md bg-muted/30 overflow-hidden">
                <div
                  className={`h-full rounded-md transition-all duration-500 ease-out ${step.barClass}`}
                  style={{ width: `${width}%` }}
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
    </SectionCard>
  );
});
