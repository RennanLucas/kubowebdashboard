import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  buildHeatmap,
  buildReferrerStats,
  type HeatmapCell,
  type ReferrerStat,
} from "@/lib/heatmap-aggregation";

export type { HeatmapCell, ReferrerStat };

interface HookResult {
  heatmap: HeatmapCell[];
  referrers: ReferrerStat[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export const useHourlyHeatmap = (projectId?: string, days = 30): HookResult => {
  const [heatmap, setHeatmap] = useState<HeatmapCell[]>([]);
  const [referrers, setReferrers] = useState<ReferrerStat[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    (async () => {
      try {
        const since = new Date();
        since.setDate(since.getDate() - days);
        const sinceIso = since.toISOString();

        const { data: pvs, error: pvErr } = await supabase
          .from("pageviews")
          .select("created_at, referrer, session_id")
          .eq("project_id", projectId)
          .gte("created_at", sinceIso)
          .limit(10000);
        if (pvErr) throw pvErr;

        const { data: evs, error: evErr } = await supabase
          .from("events")
          .select("created_at, session_id")
          .eq("project_id", projectId)
          .gte("created_at", sinceIso)
          .in("event_type", ["whatsapp_click", "form_submit", "button_click"])
          .limit(5000);
        if (evErr) throw evErr;

        if (cancelled) return;

        setHeatmap(buildHeatmap(pvs ?? []));
        setReferrers(buildReferrerStats(pvs ?? [], evs ?? []));
        setIsLoading(false);
      } catch (e: any) {
        if (cancelled) return;
        setError(e instanceof Error ? e : new Error(String(e?.message ?? e)));
        setIsLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId, days, reloadKey]);

  return { heatmap, referrers, isLoading, error, refetch: () => setReloadKey((k) => k + 1) };
};
