import { useDashboardAnalytics } from "@/hooks/useDashboardData";
import { useGoals } from "@/hooks/useGoals";
import { useHourlyHeatmap } from "@/hooks/useHourlyHeatmap";
import { usePersistedAlerts } from "@/hooks/usePersistedAlerts";

/**
 * Returns attention-worthy alerts shown on the bell badge.
 * Combines:
 *  - Computed (rule-based) alerts derived from analytics — same rules as Alerts.tsx.
 *  - Unread persisted alerts for the active project (matches the "novos" badge).
 */
export const useAlertsCount = () => {
  const { data, isLoading } = useDashboardAnalytics(30);
  const projectId = data?.client?.project?.id;
  const { goals } = useGoals(projectId);
  const { heatmap } = useHourlyHeatmap(projectId, 30);
  const { alerts: persisted } = usePersistedAlerts(projectId);

  const unreadPersisted = persisted.filter((a) => !a.read);
  const unreadPersistedCount = unreadPersisted.length;
  const unreadPersistedCritical = unreadPersisted.filter((a) => a.severity === "critical").length;

  if (isLoading || !data) {
    return { count: unreadPersistedCount, criticalCount: unreadPersistedCritical };
  }

  let count = 0;
  let criticalCount = 0;

  const totalVisitors = data.metrics?.reduce((s, m) => s + m.visitors, 0) ?? 0;
  const totalLeads = data.metrics?.reduce((s, m) => s + m.leads, 0) ?? 0;
  const conversionRate = totalVisitors > 0 ? (totalLeads / totalVisitors) * 100 : 0;
  const cmp = data.comparison;

  if (cmp && cmp.visitors <= -20) {
    count++;
    criticalCount++;
  }
  if (conversionRate > 0 && conversionRate < 1 && totalVisitors > 50) count++;
  if (totalVisitors === 0) count++;
  if (data.engagement && data.engagement.bounceRate > 70) count++;
  if (data.trafficSources?.[0]?.percentage > 80) count++;
  if (goals.visitors > 0 && totalVisitors < goals.visitors && totalVisitors >= goals.visitors * 0.8) {
    count++;
  }

  void heatmap;

  return {
    count: count + unreadPersistedCount,
    criticalCount: criticalCount + unreadPersistedCritical,
  };
};
