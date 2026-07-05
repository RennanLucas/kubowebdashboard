import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface PersistedAlert {
  id: string;
  type: string;
  severity: "success" | "warning" | "info" | "critical";
  title: string;
  message: string;
  read: boolean;
  created_at: string;
  metadata: Record<string, unknown>;
}

export const usePersistedAlerts = (projectId: string | null | undefined) => {
  const [alerts, setAlerts] = useState<PersistedAlert[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!projectId) {
      setAlerts([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data } = await supabase
      .from("alerts")
      .select("*")
      .eq("project_id", projectId)
      .order("created_at", { ascending: false })
      .limit(50);
    setAlerts((data ?? []) as PersistedAlert[]);
    setLoading(false);
  };

  useEffect(() => {
    load();
    if (!projectId) return;
    const channel = supabase
      .channel(`alerts-persisted-${projectId}-${Math.random().toString(36).slice(2, 8)}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "alerts", filter: `project_id=eq.${projectId}` },
        (payload) => setAlerts((prev) => [payload.new as PersistedAlert, ...prev])
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const markAsRead = async (id: string) => {
    await supabase.from("alerts").update({ read: true }).eq("id", id);
    setAlerts((prev) => prev.map((a) => (a.id === id ? { ...a, read: true } : a)));
  };

  const dismiss = async (id: string) => {
    await supabase.from("alerts").delete().eq("id", id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const markAllRead = async () => {
    if (!projectId) return;
    await supabase.from("alerts").update({ read: true }).eq("project_id", projectId).eq("read", false);
    setAlerts((prev) => prev.map((a) => ({ ...a, read: true })));
  };

  const dismissAll = async () => {
    if (!projectId) return;
    const { error } = await supabase.from("alerts").delete().eq("project_id", projectId);
    if (error) throw error;
    setAlerts([]);
  };

  return { alerts, loading, markAsRead, dismiss, markAllRead, dismissAll, reload: load };
};
