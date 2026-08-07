import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LiveVisitor {
  id: string;
  page_path: string;
  city: string | null;
  country: string | null;
  referrer: string | null;
  created_at: string;
}

export const useLiveFeed = (projectId: string | null, limit = 20) => {
  const [visitors, setVisitors] = useState<LiveVisitor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!projectId) {
      setVisitors([]);
      setLoading(false);
      return;
    }

    let mounted = true;

    // Initial load: last 30 minutes
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    supabase
      .from("pageviews")
      .select("id, page_path, city, country, referrer, created_at")
      .eq("project_id", projectId)
      .gte("created_at", thirtyMinAgo)
      .order("created_at", { ascending: false })
      .limit(limit)
      .then(({ data }) => {
        if (mounted && data) setVisitors(data as LiveVisitor[]);
        if (mounted) setLoading(false);
      });

    // Realtime subscription
    const channel = supabase
      .channel(`pageviews-${projectId}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "pageviews",
          filter: `project_id=eq.${projectId}`,
        },
        (payload) => {
          if (!mounted) return;
          const row = payload.new as LiveVisitor;
          setVisitors((prev) => [row, ...prev].slice(0, limit));
        }
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [projectId, limit]);

  return { visitors, loading };
};
