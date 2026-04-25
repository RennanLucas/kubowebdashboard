import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface HeatmapCell {
  day: number; // 0=Sun..6=Sat
  hour: number; // 0..23
  count: number;
}

export interface ReferrerStat {
  domain: string;
  visitors: number;
  conversions: number;
  conversionRate: number;
}

interface HookResult {
  heatmap: HeatmapCell[];
  referrers: ReferrerStat[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

const extractDomain = (url: string | null) => {
  if (!url) return "(direto)";
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url.length > 40 ? url.slice(0, 40) + "…" : url;
  }
};

export const useHourlyHeatmap = (projectId?: string, days = 30): HookResult => {
  const [heatmap, setHeatmap] = useState<HeatmapCell[]>([]);
  const [referrers, setReferrers] = useState<ReferrerStat[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!projectId) return;
    let cancelled = false;
    setIsLoading(true);

    (async () => {
      const since = new Date();
      since.setDate(since.getDate() - days);
      const sinceIso = since.toISOString();

      // Pageviews for heatmap + referrers
      const { data: pvs } = await supabase
        .from("pageviews")
        .select("created_at, referrer, session_id")
        .eq("project_id", projectId)
        .gte("created_at", sinceIso)
        .limit(10000);

      // Conversion events for referrer conversion rate
      const { data: evs } = await supabase
        .from("events")
        .select("created_at, session_id")
        .eq("project_id", projectId)
        .gte("created_at", sinceIso)
        .in("event_type", ["whatsapp_click", "form_submit", "button_click"])
        .limit(5000);

      if (cancelled) return;

      // Build heatmap
      const cells = new Map<string, number>();
      (pvs ?? []).forEach((p) => {
        const d = new Date(p.created_at);
        const key = `${d.getDay()}-${d.getHours()}`;
        cells.set(key, (cells.get(key) ?? 0) + 1);
      });
      const out: HeatmapCell[] = [];
      for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
          out.push({ day, hour, count: cells.get(`${day}-${hour}`) ?? 0 });
        }
      }

      // Build referrers
      const refMap = new Map<string, { visitors: Set<string>; conversionSessions: Set<string> }>();
      (pvs ?? []).forEach((p) => {
        const dom = extractDomain(p.referrer);
        if (!refMap.has(dom)) refMap.set(dom, { visitors: new Set(), conversionSessions: new Set() });
        if (p.session_id) refMap.get(dom)!.visitors.add(p.session_id);
      });
      // Map session_id → referrer domain (first touch)
      const sessionToRef = new Map<string, string>();
      (pvs ?? []).forEach((p) => {
        if (p.session_id && !sessionToRef.has(p.session_id)) {
          sessionToRef.set(p.session_id, extractDomain(p.referrer));
        }
      });
      (evs ?? []).forEach((e) => {
        if (!e.session_id) return;
        const dom = sessionToRef.get(e.session_id);
        if (dom && refMap.has(dom)) {
          refMap.get(dom)!.conversionSessions.add(e.session_id);
        }
      });

      const refs: ReferrerStat[] = Array.from(refMap.entries())
        .map(([domain, v]) => {
          const visitors = v.visitors.size;
          const conversions = v.conversionSessions.size;
          return {
            domain,
            visitors,
            conversions,
            conversionRate: visitors > 0 ? (conversions / visitors) * 100 : 0,
          };
        })
        .filter((r) => r.visitors > 0)
        .sort((a, b) => b.visitors - a.visitors)
        .slice(0, 10);

      setHeatmap(out);
      setReferrers(refs);
      setIsLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [projectId, days]);

  return { heatmap, referrers, isLoading };
};
