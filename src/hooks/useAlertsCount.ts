import { useDashboardAnalytics } from "@/hooks/useDashboardData";
import { useGoals } from "@/hooks/useGoals";
import { useHourlyHeatmap } from "@/hooks/useHourlyHeatmap";

/**
 * Returns the number of *attention-worthy* alerts (critical + warning).
 * Mirrors the rules in src/pages/Alerts.tsx without rendering UI.
 */
export const useAlertsCount = () => {
  const { data, isLoading } = useDashboardAnalytics(30);
  const projectId = data?.client?.project?.id;
  const { goals } = useGoals(projectId);
  const { heatmap } = useHourlyHeatmap(projectId, 30);

  if (isLoading || !data) return { count: 0, criticalCount: 0 };

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
  // goals near (info-but-actionable) are not counted; only success goals omitted
  if (goals.visitors > 0 && totalVisitors < goals.visitors && totalVisitors >= goals.visitors * 0.8) {
    // near miss: count as soft alert
    count++;
  }
  // peak hour is informational, skip

  void heatmap; // kept to ensure hook deps are stable
  return { count, criticalCount };
};
