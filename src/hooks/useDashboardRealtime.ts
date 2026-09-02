import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isDashboardQueryForProject } from "@/lib/dashboard-query-keys";

/** Realtime inserts are batched into one refetch per this window. */
export const REALTIME_THROTTLE_MS = 15000;

export const useDashboardRealtime = (projectId?: string) => {
  const queryClient = useQueryClient();
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isUpdating, setIsUpdating] = useState(false);

  const invalidateDashboard = useCallback(async () => {
    if (!projectId) return;
    setIsUpdating(true);
    await queryClient.invalidateQueries({
      predicate: (query) => isDashboardQueryForProject(query.queryKey, projectId),
    });
    setLastUpdate(new Date());
    setIsUpdating(false);
  }, [projectId, queryClient]);

  useEffect(() => {
    if (!projectId) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    let pendingUpdate = false;

    // Throttle: the first insert schedules a refetch, and every insert arriving
    // during the window folds into it. A busy site would otherwise hammer the
    // Edge Functions with one refetch per pageview.
    const handleUpdate = () => {
      if (pendingUpdate) return;
      pendingUpdate = true;
      timeoutId = setTimeout(() => {
        invalidateDashboard().finally(() => {
          pendingUpdate = false;
        });
      }, REALTIME_THROTTLE_MS);
    };

    const pageviewsChannel = supabase
      .channel(`realtime:pageviews:${projectId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "pageviews", filter: `project_id=eq.${projectId}` },
        handleUpdate
      )
      .subscribe();

    const eventsChannel = supabase
      .channel(`realtime:events:${projectId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "events", filter: `project_id=eq.${projectId}` },
        handleUpdate
      )
      .subscribe();

    return () => {
      supabase.removeChannel(pageviewsChannel);
      supabase.removeChannel(eventsChannel);
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [projectId, invalidateDashboard]);

  useEffect(() => {
    // Coming back to the tab should show current numbers, not whatever was on
    // screen when the user left.
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") invalidateDashboard();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [invalidateDashboard]);

  return { lastUpdate, isUpdating, triggerManualRefresh: invalidateDashboard };
};
