import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useDashboardRealtime = (projectId?: string) => {
  const queryClient = useQueryClient();
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    if (!projectId) return;

    const handleUpdate = () => {
      setIsUpdating(true);
      queryClient.invalidateQueries({
        predicate: (query) => {
          const key = query.queryKey as any[];
          return key[0]?.toString().startsWith("dashboard-") && key.includes(projectId);
        },
      }).then(() => {
        setLastUpdate(new Date());
        setIsUpdating(false);
      });
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
    };
  }, [projectId, queryClient]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible" && projectId) {
        setIsUpdating(true);
        queryClient.invalidateQueries({
          predicate: (query) => {
            const key = query.queryKey as any[];
            return key[0]?.toString().startsWith("dashboard-") && key.includes(projectId);
          },
        }).then(() => {
          setLastUpdate(new Date());
          setIsUpdating(false);
        });
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [projectId, queryClient]);

  const triggerManualRefresh = async () => {
    if (!projectId) return;
    setIsUpdating(true);
    await queryClient.invalidateQueries({
      predicate: (query) => {
        const key = query.queryKey as any[];
        return key[0]?.toString().startsWith("dashboard-") && key.includes(projectId);
      },
    });
    setLastUpdate(new Date());
    setIsUpdating(false);
  };

  return { lastUpdate, isUpdating, triggerManualRefresh };
};
