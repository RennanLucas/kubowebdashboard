import { DollarSign, Settings as SettingsIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { InfoTooltip } from "@/components/InfoTooltip";

interface Props {
  monthlyAdSpend: number;
  leads: number;
  days: number;
}

export const CostPerLeadCard = ({ monthlyAdSpend, leads, days }: Props) => {
  // Pro-rate the ad spend to the selected period
  const periodSpend = (monthlyAdSpend / 30) * days;
  const cpl = leads > 0 ? periodSpend / leads : 0;

  const hasSpend = monthlyAdSpend > 0;
  const benchmark = cpl <= 50 ? "Excelente" : cpl <= 150 ? "Saudável" : "Alto";
  const benchColor = cpl <= 50 ? "hsl(var(--success))" : cpl <= 150 ? "hsl(var(--chart-blue))" : "hsl(var(--destructive))";

  return (
    <div className="glass-card p-5 sm:p-6">
      <div className="mb-3 flex items-center gap-1.5">
        <h3 className="section-title">Custo por Lead</h3>
        <InfoTooltip content={
          <div className="space-y-1 text-xs">
            <p>Quanto você está pagando por cada lead gerado.</p>
            <p>Calculado: investimento mensal proporcional ao período ÷ leads.</p>
          </div>
        } />
      </div>

      {!hasSpend ? (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Configure seu investimento mensal em anúncios para acompanhar o custo por lead.
          </p>
          <Link
            to="/settings"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <SettingsIcon className="h-3.5 w-3.5" />
            Configurar agora
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-end gap-2">
            <DollarSign className="h-5 w-5 text-primary mb-1" />
            <span className="text-3xl font-bold text-foreground tabular-nums">
              {leads > 0 ? cpl.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "—"}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Investimento no período:{" "}
            <span className="font-semibold text-foreground tabular-nums">
              R$ {periodSpend.toLocaleString("pt-BR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </p>
          {leads > 0 && (
            <span
              className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold"
              style={{ backgroundColor: `${benchColor}1a`, color: benchColor }}
            >
              {benchmark}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
