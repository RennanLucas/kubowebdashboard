// @vitest-environment node
import { describe, expect, it } from "vitest";
import { insertIdempotently } from "../../supabase/functions/track/_persist";
import { analyticsPeriod } from "../../supabase/functions/_shared/analytics-period";
import { checkoutReturnUrl, isTrustedOrigin } from "../../supabase/functions/_shared/origins";
import { filterSource } from "../../supabase/functions/_shared/analytics-source";

describe("tracking retries with partial unique indexes", () => {
  it("preserves new rows in mixed and internally duplicated batches", async () => {
    const stored = new Set(["old"]);
    const insert = async (rows: string[]) => {
      if (rows.some((r) => stored.has(r)) || new Set(rows).size !== rows.length) {
        return { error: { code: "23505", message: 'duplicate key value violates unique constraint "idx_events_event_id"' } };
      }
      rows.forEach((r) => stored.add(r));
      return { error: null };
    };
    expect(await insertIdempotently(["old", "new", "new", "second"], insert, "idx_events_event_id")).toBe(2);
    expect([...stored]).toEqual(["old", "new", "second"]);
    expect(await insertIdempotently(["new"], insert, "idx_events_event_id")).toBe(0);
  });
  it.each([
    { code: "23505", message: 'duplicate key value violates unique constraint "other_index"' },
    { code: "42P10", message: "no unique constraint" },
    { code: "42501", message: "permission denied" },
  ])("does not hide other database errors: $code", async (error) => {
    await expect(insertIdempotently([1], async () => ({ error }), "idx_pageviews_event_id")).rejects.toEqual(error);
  });
});

describe("calendar intervals and plan age limits", () => {
  const now = new Date("2026-09-12T23:45:00Z");
  it("keeps the full previous month and its equal-width comparison", () => {
    const p = analyticsPeriod(new URLSearchParams({ start: "2026-08-01", end: "2026-08-31" }), 31, 365, now);
    expect(p).toEqual({ start: "2026-08-01", end: "2026-08-31", days: 31, previousStart: "2026-07-01", previousEnd: "2026-07-31", comparisonAvailable: true });
  });
  it("rejects a one-day selection older than the Free window", () => {
    expect(() => analyticsPeriod(new URLSearchParams({ start: "2026-08-01", end: "2026-08-01" }), 1, 7, now)).toThrow("HISTORY_LIMIT_EXCEEDED");
  });
  it("does not expose an extra comparison week to Free users", () => {
    const p = analyticsPeriod(new URLSearchParams(), 7, 7, now);
    expect(p.start).toBe("2026-09-06");
    expect(p.previousStart).toBe("2026-09-06");
    expect(p.previousEnd).toBe("2026-09-05");
    expect(p.comparisonAvailable).toBe(false);
  });
  it.each([
    { start: "2026-02-30", end: "2026-03-01" },
    { start: "2026-09-11", end: "2026-09-10" },
    { start: "2026-09-11", end: "2026-09-13" },
    { start: "2026-09-11" },
  ])("rejects invalid periods %j", (params) => {
    expect(() => analyticsPeriod(new URLSearchParams(params), 7, 365, now)).toThrow("INVALID_PERIOD");
  });
});

describe("trusted preview and checkout origins", () => {
  const preview = "https://kubowebdashboard-git-codex-insights-57aad1-rennanlucas-projects.vercel.app";
  it("allows this team's preview and its checkout return", () => {
    expect(isTrustedOrigin(preview)).toBe(true);
    expect(checkoutReturnUrl(preview + "/checkout/return?untrusted=1")).toBe(preview + "/checkout/return");
  });
  it.each([
    "https://kubowebdashboard-attacker.vercel.app",
    "https://kubowebdashboard.lovable.app",
    "https://kubowebdashboard.evil.example",
    "https://kubowebdashboard-a-rennanlucas-projects.vercel.app.evil.example",
    "javascript:alert(1)",
    "https://user:pass@kubowebdashboard.vercel.app",
    "http://kubowebdashboard.vercel.app",
  ])("rejects %s", (origin) => {
    expect(isTrustedOrigin(origin)).toBe(false);
    expect(checkoutReturnUrl(origin + "/checkout/return")).toBe("https://kubowebdashboard.vercel.app/checkout/return");
  });
});

describe("consistent channel groups", () => {
  it("uses all search and social sources, not just Google or Instagram", () => {
    const calls: unknown[] = [];
    const q = { in: (c: string, v: string[]) => { calls.push(v); return q; }, ilike: () => q, not: () => q };
    filterSource(q, "organic"); filterSource(q, "social");
    expect(calls[0]).toContain("Bing");
    expect(calls[1]).toContain("X (Twitter)");
    expect(calls[1]).toContain("Facebook");
  });
});
