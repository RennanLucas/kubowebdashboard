/**
 * Which React Query entries belong to a given project's dashboard.
 *
 * useDashboardRealtime invalidates on three triggers (a realtime insert, the tab
 * becoming visible, a manual refresh) and every one of them needs the same
 * answer, so the rule lives here once instead of being spelled out three times.
 *
 * Correctness matters beyond tidiness: this predicate decides whose cached data
 * gets thrown away. Too narrow and a client stares at stale numbers; too wide
 * and every project's dashboard refetches on one project's traffic, multiplying
 * Edge Function calls per client.
 */

export const DASHBOARD_QUERY_PREFIX = "dashboard-";

/**
 * True when `key` is a dashboard query scoped to `projectId`.
 *
 * The real keys look like
 *   ["dashboard-overview", userId, orgId, days, projectId, source?, device?]
 * across five granular hooks (overview / pages / sources / devices / geo), so
 * the match is "first element starts with dashboard-" plus "projectId appears
 * somewhere in the key". The positional-agnostic `includes` is inherited from
 * the original hook and kept: the project id sits at different offsets as the
 * filter tail varies.
 */
export function isDashboardQueryForProject(
  key: readonly unknown[],
  projectId: string,
): boolean {
  const head = key[0];
  if (head === null || head === undefined) return false;
  return String(head).startsWith(DASHBOARD_QUERY_PREFIX) && key.includes(projectId);
}
