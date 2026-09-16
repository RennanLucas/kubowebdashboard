import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface LiveVisitor {
  id: string;
  page_path: string;
  city: string | null;
  country: string | null;
  referrer: string | null;
  created_at: string;
}

const WINDOW_MS = 30 * 60 * 1000;
function recent(rows: LiveVisitor[], limit: number) {
  const now = Date.now();
  return [...new Map(rows.map(row => [row.id, row])).values()]
    .filter(row => {
      const time = Date.parse(row.created_at);
      return time >= now - WINDOW_MS && time <= now;
    })
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at))
    .slice(0, limit);
}

export const useLiveFeed = (projectId: string | null, limit = 20) => {
  const [state, setState] = useState<{ projectId: string | null; visitors: LiveVisitor[]; loading: boolean; error: string | null }>({
    projectId: null, visitors: [], loading: true, error: null,
  });
  const [attempt, setAttempt] = useState(0);
  const retry = useCallback(() => setAttempt(value => value + 1), []);

  useEffect(() => {
    setState({ projectId, visitors: [], loading: Boolean(projectId), error: null });
    if (!projectId) return;
    let mounted = true;
    let fetching = false;
    let streamFailed = false;
    const streamError = "A conexão ao vivo foi interrompida. Tentando reconectar; a lista é atualizada periodicamente.";
    const refresh = async () => {
      if (fetching) return;
      fetching = true;
      try {
        const { data, error } = await supabase.from("pageviews")
          .select("id, page_path, city, country, referrer, created_at")
          .eq("project_id", projectId)
          .gte("created_at", new Date(Date.now() - WINDOW_MS).toISOString())
          .order("created_at", { ascending: false }).limit(limit);
        if (error) throw error;
        if (mounted) setState(previous => ({ projectId, loading: false,
          error: streamFailed ? streamError : null,
          // Retain events received while the initial request was in flight.
          visitors: recent([...(data ?? []), ...previous.visitors], limit),
        }));
      } catch {
        if (mounted) setState(previous => ({ ...previous, loading: false,
          error: "Não foi possível atualizar as visitas. Os dados exibidos podem estar desatualizados.",
        }));
      } finally { fetching = false; }
    };
    const channel = supabase.channel(`pageviews-${projectId}-${Math.random().toString(36).slice(2)}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "pageviews", filter: `project_id=eq.${projectId}` }, payload => {
        if (mounted) setState(previous => ({ ...previous,
          visitors: recent([payload.new as LiveVisitor, ...previous.visitors], limit),
        }));
      }).subscribe(status => {
        if (!mounted) return;
        if (status === "SUBSCRIBED") {
          streamFailed = false;
          void refresh(); // Recover the gap after reconnecting.
        } else if (["CHANNEL_ERROR", "TIMED_OUT", "CLOSED"].includes(status)) {
          streamFailed = true;
          setState(previous => ({ ...previous, error: streamError }));
        }
      });
    void refresh();
    const prune = setInterval(() => {
      if (mounted) setState(previous => ({ ...previous, visitors: recent(previous.visitors, limit) }));
    }, 10000);
    const poll = setInterval(() => void refresh(), 60000);
    return () => {
      mounted = false;
      clearInterval(prune);
      clearInterval(poll);
      void supabase.removeChannel(channel);
    };
  }, [projectId, limit, attempt]);

  // Never render the preceding project's data, even before the effect runs.
  if (state.projectId !== projectId) return { visitors: [], loading: Boolean(projectId), error: null, retry };
  return { visitors: state.visitors, loading: state.loading, error: state.error, retry };
};
