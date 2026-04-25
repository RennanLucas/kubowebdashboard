import { useEffect, useState } from "react";
import { AlertTriangle, AlertCircle, Info, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { SectionCard } from "./SectionCard";
import { EmptyState } from "./EmptyState";

interface Alert {
  id: string;
  title: string;
  message: string;
  severity: string;
  created_at: string;
}

interface Props {
  projectId?: string;
}

export const CriticalAlertsCard = ({ projectId }: Props) => {
  const [loading, setLoading] = useState(true);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    setLoading(true);

    supabase
      .from("alerts")
      .select("id, title, message, severity, created_at")
      .eq("project_id", projectId)
      .eq("read", false)
      .order("created_at", { ascending: false })
      .limit(3)
      .then(({ data }) => {
        if (cancelled) return;
        setAlerts(data ?? []);
        setLoading(false);
      });

    return () => { cancelled = true; };
  }, [projectId]);

  const iconFor = (severity: string) => {
    if (severity === "critical" || severity === "error") return <AlertCircle className="h-4 w-4 text-destructive shrink-0 mt-0.5" />;
    if (severity === "warning") return <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />;
    return <Info className="h-4 w-4 text-primary shrink-0 mt-0.5" />;
  };

  const formatRelative = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `${mins}min atrás`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h atrás`;
    return `${Math.floor(hrs / 24)}d atrás`;
  };

  return (
    <SectionCard
      title="Alertas Recentes"
      tooltip="Os 3 alertas mais recentes não lidos do projeto."
      actions={
        <Link to="/alerts" className="text-xs font-medium text-primary hover:underline">
          Ver todos
        </Link>
      }
    >
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-12 w-full" />)}
        </div>
      ) : alerts.length === 0 ? (
        <EmptyState
          icon={<Info className="h-4 w-4 text-[hsl(var(--success))]" />}
          title="Nenhum alerta crítico"
          description="Tudo funcionando como esperado."
          className="py-6"
        />
      ) : (
        <ul className="space-y-2.5">
          {alerts.map((alert) => (
            <li
              key={alert.id}
              className="flex items-start gap-2 rounded-md border border-border/60 bg-background p-2.5 hover:border-border transition-colors"
            >
              {iconFor(alert.severity)}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">{alert.title}</p>
                <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{alert.message}</p>
                <p className="text-[10px] text-muted-foreground/70 mt-1">{formatRelative(alert.created_at)}</p>
              </div>
            </li>
          ))}
          <li>
            <Link
              to="/alerts"
              className="flex items-center justify-center gap-1 text-xs font-medium text-primary hover:underline pt-1"
            >
              Ver todos os alertas <ArrowRight className="h-3 w-3" />
            </Link>
          </li>
        </ul>
      )}
    </SectionCard>
  );
};
