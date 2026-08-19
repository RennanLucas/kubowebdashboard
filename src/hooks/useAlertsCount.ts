import { usePersistedAlerts } from "@/hooks/usePersistedAlerts";

/**
 * Returns attention-worthy alerts shown on the bell badge.
 * Optimized: Only counts unread persisted alerts to avoid fetching
 * massive amounts of analytics data (30 days of overview, heatmap, pages)
 * globally on every page load.
 */
export const useAlertsCount = () => {
  // Use global active project id to fetch alerts without breaking hook dependencies
  const projectId = typeof window !== "undefined" ? window.localStorage.getItem("dashboard:last-project-id") || undefined : undefined;
  const { alerts: persisted } = usePersistedAlerts(projectId);

  const unreadPersisted = persisted.filter((a) => !a.read);
  const unreadPersistedCount = unreadPersisted.length;
  const unreadPersistedCritical = unreadPersisted.filter((a) => a.severity === "critical").length;

  return { count: unreadPersistedCount, criticalCount: unreadPersistedCritical };
};
