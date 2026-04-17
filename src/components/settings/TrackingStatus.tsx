import { useEffect, useState } from "react";
import { CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Props {
  projectId: string;
}

const TrackingStatus = ({ projectId }: Props) => {
  const [lastSeen, setLastSeen] = useState<Date | null>(null);
  const [loading, setLoading] = useState(true);
  const [tick, setTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    const fetchLast = async () => {
      const { data } = await supabase
        .from("pageviews")
        .select("created_at")
        .eq("project_id", projectId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;
      setLastSeen(data?.created_at ? new Date(data.created_at) : null);
      setLoading(false);
    };

    fetchLast();
    const poll = setInterval(fetchLast, 30000); // refetch every 30s
    const clock = setInterval(() => setTick((t) => t + 1), 60000); // refresh "x ago" label

    return () => {
      cancelled = true;
      clearInterval(poll);
      clearInterval(clock);
    };
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Verificando status do rastreamento...
      </div>
    );
  }

  const now = Date.now();
  const minutesAgo = lastSeen ? (now - lastSeen.getTime()) / 60000 : Infinity;
  const isActive = minutesAgo <= 60; // active if pageview within last hour
  const isStale = minutesAgo > 60 && minutesAgo <= 60 * 24; // warning between 1h–24h

  let bg = "bg-destructive/10 border-destructive/30 text-destructive";
  let Icon = AlertTriangle;
  let title = "⚠️ Sem dados recentes";
  let detail = lastSeen
    ? `Última visita registrada ${formatDistanceToNow(lastSeen, { locale: ptBR, addSuffix: true })}.`
    : "Nenhuma visita registrada ainda. Verifique se o código abaixo está instalado no seu site.";

  if (isActive) {
    bg = "bg-green-500/10 border-green-500/30 text-green-700 dark:text-green-400";
    Icon = CheckCircle2;
    title = "✅ Rastreamento ativo";
    detail = `Última visita ${formatDistanceToNow(lastSeen!, { locale: ptBR, addSuffix: true })}.`;
  } else if (isStale) {
    bg = "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400";
    Icon = AlertTriangle;
    title = "⚠️ Sem dados recentes";
    detail = `Última visita ${formatDistanceToNow(lastSeen!, { locale: ptBR, addSuffix: true })}. Confira se o código continua no site.`;
  }

  // tick is intentionally referenced to re-render the relative time label
  void tick;

  return (
    <div className={`flex items-start gap-3 rounded-lg border px-3 py-2.5 text-sm ${bg}`}>
      <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
      <div className="space-y-0.5">
        <p className="font-medium leading-tight">{title}</p>
        <p className="text-xs opacity-90 leading-snug">{detail}</p>
      </div>
    </div>
  );
};

export default TrackingStatus;
