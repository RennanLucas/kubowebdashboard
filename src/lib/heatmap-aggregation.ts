/**
 * Pure aggregation for the hourly heatmap + referrer breakdown.
 *
 * Extracted from useHourlyHeatmap so the number-crunching the client sees can
 * be unit-tested without a live Supabase connection. The hook stays a thin
 * fetch-and-set shell around these functions.
 *
 * Note on time: buildHeatmap buckets by the viewer's LOCAL day/hour (via
 * Date#getDay / #getHours), matching the original hook — the dashboard shows
 * "when my visitors are active" in the account owner's own timezone.
 */

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

/** A pageview row as consumed by the aggregation (only the fields we read). */
export interface PageviewRow {
  created_at: string;
  referrer: string | null;
  session_id: string | null;
}

/** A conversion event row (pre-filtered to conversion event types upstream). */
export interface EventRow {
  session_id: string | null;
}

export const DIRECT_REFERRER = "(direto)";
const MAX_REFERRERS = 10;

/**
 * Reduce a referrer URL to a display domain:
 *  - null/empty -> "(direto)"
 *  - a valid URL -> its hostname without a leading "www."
 *  - anything unparseable -> the raw string, truncated to 40 chars with an ellipsis
 */
export function extractDomain(url: string | null | undefined): string {
  if (!url) return DIRECT_REFERRER;
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "");
  } catch {
    return url.length > 40 ? url.slice(0, 40) + "…" : url;
  }
}

/**
 * Build the full 7×24 grid (168 cells, always dense) of pageview counts,
 * bucketed by local weekday and hour. Rows with an unparseable created_at
 * contribute to whatever Date() yields, mirroring the original hook; callers
 * pass already-persisted timestamps so this is not a concern in practice.
 */
export function buildHeatmap(pageviews: readonly PageviewRow[]): HeatmapCell[] {
  const cells = new Map<string, number>();
  for (const p of pageviews) {
    const d = new Date(p.created_at);
    const key = `${d.getDay()}-${d.getHours()}`;
    cells.set(key, (cells.get(key) ?? 0) + 1);
  }
  const out: HeatmapCell[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      out.push({ day, hour, count: cells.get(`${day}-${hour}`) ?? 0 });
    }
  }
  return out;
}

/**
 * Per-referrer visitor and conversion breakdown.
 *
 * Visitors are counted as distinct session_ids seen on pageviews for a domain.
 * A session that browsed in from two different referrers counts as a visitor
 * under BOTH domains, so the per-domain visitor counts can sum to more than the
 * account's distinct sessions. Conversions, by contrast, are attributed to the
 * domain of the session's FIRST pageview only, so a conversion is credited
 * exactly once. This asymmetry is inherited from the original hook and is
 * preserved deliberately — see heatmap-aggregation.test.ts, which pins it.
 * Sessions without an id are ignored (they can't be de-duplicated or linked to
 * conversions).
 *
 * Returned sorted by visitors desc, dropping zero-visitor domains, capped at
 * the top 10 — the shape the UI renders.
 */
export function buildReferrerStats(
  pageviews: readonly PageviewRow[],
  events: readonly EventRow[],
): ReferrerStat[] {
  const refMap = new Map<string, { visitors: Set<string>; conversionSessions: Set<string> }>();
  const sessionToRef = new Map<string, string>();

  for (const p of pageviews) {
    const dom = extractDomain(p.referrer);
    if (!refMap.has(dom)) {
      refMap.set(dom, { visitors: new Set(), conversionSessions: new Set() });
    }
    if (p.session_id) {
      refMap.get(dom)!.visitors.add(p.session_id);
      // First pageview wins the session's referrer attribution.
      if (!sessionToRef.has(p.session_id)) sessionToRef.set(p.session_id, dom);
    }
  }

  for (const e of events) {
    if (!e.session_id) continue;
    const dom = sessionToRef.get(e.session_id);
    if (dom && refMap.has(dom)) {
      refMap.get(dom)!.conversionSessions.add(e.session_id);
    }
  }

  return Array.from(refMap.entries())
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
    .slice(0, MAX_REFERRERS);
}
