import { useEffect, useState } from "react";
import { Target } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionCard } from "./SectionCard";

interface Goal {
  visitors_target: number;
  leads_target: number;
  revenue_target: number;
}

interface Props {
  projectId?: string;
  visitors: number;
  leads: number;
  revenue: number;
}

export const GoalsProgressCard = ({ projectId, visitors, leads, revenue }: Props) => {
  const [loading, setLoading] = useState(true);
  const [goal, setGoal] = useState<Goal | null>(null);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    setLoading(true);

    const monthStart = new Date();
    monthStart.setDate(1);
    const monthKey = monthStart.toISOString().slice(0, 10);

    supabase
      .from("goals")
      .select("visitors_target, leads_target, revenue_target")
      .eq("project_id", projectId)
      .eq("month", monthKey)
      .maybeSingle()
      .then(({ data }) => {
        if (cancelled) return;
        setGoal(data ?? null);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [projectId]);

  const items = goal
    ? [
        { label: "Visitantes", current: visitors, target: goal.visitors_target, format: (v: number) => v.toLocaleString("pt-BR") },
        { label: "Leads", current: leads, target: goal.leads_target, format: (v: number) => v.toLocaleString("pt-BR") },
        { label: "Receita", current: revenue, target: Number(goal.revenue_target), format: (v: number) => `R$ ${v.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` },
      ].filter((it) => it.target > 0)
    : [];

  return (
    <SectionCard
      icon={<Target className="h-4 w-4 text-primary" />}
      title="Metas do Mês"
      tooltip="Progresso vs metas mensais configuradas em Configurações."
    >
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : items.length === 0 ? (
        <div className="space-y-2">
          <p className="text-sm text-muted-foreground">Nenhuma meta definida para este mês.</p>
          <Link to="/settings" className="text-xs font-medium text-primary hover:underline">
            Definir metas →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const pct = Math.min(100, Math.round((item.current / item.target) * 100));
            const colorClass =
              pct >= 100 ? "bg-success"
              : pct >= 70 ? "bg-chart-blue"
              : pct >= 40 ? "bg-warning"
              : "bg-destructive";
            const textColorClass = colorClass.replace("bg-", "text-");

            return (
              <div key={item.label} className="space-y-1">
                <div className="flex items-baseline justify-between gap-2 text-xs">
                  <span className="font-medium text-foreground">{item.label}</span>
                  <span className="tabular-nums text-muted-foreground">
                    <span className="text-foreground font-semibold">{item.format(item.current)}</span> / {item.format(item.target)}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${colorClass}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <p className={`text-[10px] tabular-nums ${textColorClass}`}>{pct}% atingido</p>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
};
