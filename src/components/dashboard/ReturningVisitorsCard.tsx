import { useEffect, useState } from "react";
import { Repeat } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionCard } from "./SectionCard";

interface Props {
  projectId?: string;
  days: number;
}

export const ReturningVisitorsCard = ({ projectId, days }: Props) => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ returning: 0, total: 0, percentage: 0 });

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    setLoading(true);

    const fetchData = async () => {
      const since = new Date();
      since.setDate(since.getDate() - days);

      const { data, error } = await supabase
        .from("pageviews")
        .select("session_id, created_at")
        .eq("project_id", projectId)
        .gte("created_at", since.toISOString())
        .not("session_id", "is", null)
        .limit(10000);

      if (cancelled) return;
      if (error || !data) {
        setStats({ returning: 0, total: 0, percentage: 0 });
        setLoading(false);
        return;
      }

      const sessionVisits = new Map<string, number>();
      for (const row of data) {
        if (!row.session_id) continue;
        sessionVisits.set(row.session_id, (sessionVisits.get(row.session_id) ?? 0) + 1);
      }
      const total = sessionVisits.size;
      const returning = Array.from(sessionVisits.values()).filter((v) => v > 1).length;
      const percentage = total > 0 ? Math.round((returning / total) * 100) : 0;

      setStats({ returning, total, percentage });
      setLoading(false);
    };

    fetchData();
    return () => { cancelled = true; };
  }, [projectId, days]);

  return (
    <SectionCard
      title="Visitantes Recorrentes"
      tooltip={
        <div className="space-y-1 text-xs">
          <p>Percentual de sessões que voltaram ao site no período.</p>
          <p>Acima de 30% indica boa retenção e marca em construção.</p>
        </div>
      }
    >
      {loading ? (
        <div className="space-y-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-end gap-2">
            <Repeat className="h-5 w-5 text-primary mb-1" />
            <span className="text-3xl font-bold text-foreground tabular-nums">{stats.percentage}%</span>
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="font-semibold text-foreground tabular-nums">{stats.returning.toLocaleString("pt-BR")}</span> de{" "}
            <span className="font-semibold text-foreground tabular-nums">{stats.total.toLocaleString("pt-BR")}</span> sessões retornaram
          </p>
          <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
            <div
              className="h-full bg-primary transition-all duration-500"
              style={{ width: `${stats.percentage}%` }}
            />
          </div>
        </div>
      )}
    </SectionCard>
  );
};
