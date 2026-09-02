// @vitest-environment node
// Pure aggregation — no DOM needed.
import { describe, it, expect } from "vitest";
import {
  buildHeatmap,
  buildReferrerStats,
  extractDomain,
  DIRECT_REFERRER,
  type EventRow,
  type PageviewRow,
} from "@/lib/heatmap-aggregation";

/**
 * These numbers are what the client reads off the dashboard, so the tests pin
 * the arithmetic rather than just the shape.
 *
 * Timezone note: buildHeatmap buckets by LOCAL weekday/hour. Tests build dates
 * with the local Date constructor and derive the expected bucket from that same
 * Date, so they hold in any TZ the suite happens to run in.
 */

/** A local wall-clock instant, plus the bucket buildHeatmap must file it under. */
const at = (y: number, m: number, d: number, h: number, min = 0) => {
  const date = new Date(y, m, d, h, min);
  return { iso: date.toISOString(), day: date.getDay(), hour: date.getHours() };
};

const pv = (over: Partial<PageviewRow> = {}): PageviewRow => ({
  created_at: at(2026, 7, 24, 10).iso,
  referrer: null,
  session_id: "s1",
  ...over,
});

const cellAt = (cells: ReturnType<typeof buildHeatmap>, day: number, hour: number) =>
  cells[day * 24 + hour];

describe("extractDomain", () => {
  it("labels a missing referrer as direct traffic", () => {
    expect(extractDomain(null)).toBe(DIRECT_REFERRER);
    expect(extractDomain(undefined)).toBe(DIRECT_REFERRER);
    expect(extractDomain("")).toBe(DIRECT_REFERRER);
  });

  it("reduces a URL to its hostname", () => {
    expect(extractDomain("https://google.com/search?q=x")).toBe("google.com");
    expect(extractDomain("http://example.com:8080/path")).toBe("example.com");
  });

  it("strips a leading www. but keeps other subdomains", () => {
    expect(extractDomain("https://www.instagram.com/p/1")).toBe("instagram.com");
    expect(extractDomain("https://l.instagram.com/x")).toBe("l.instagram.com");
    // Only a LEADING www. is stripped.
    expect(extractDomain("https://www.www.example.com")).toBe("www.example.com");
  });

  it("passes an unparseable referrer through untouched when it is short", () => {
    expect(extractDomain("android-app")).toBe("android-app");
  });

  it("truncates an unparseable referrer longer than 40 chars", () => {
    const long = "x".repeat(41);
    expect(extractDomain(long)).toBe("x".repeat(40) + "…");
    // Exactly 40 is left alone — the cut is strictly above 40.
    const exact = "y".repeat(40);
    expect(extractDomain(exact)).toBe(exact);
  });
});

describe("buildHeatmap", () => {
  it("always returns a dense 7x24 grid, day-major", () => {
    const cells = buildHeatmap([]);
    expect(cells).toHaveLength(168);
    expect(cells[0]).toEqual({ day: 0, hour: 0, count: 0 });
    expect(cells[24]).toEqual({ day: 1, hour: 0, count: 0 });
    expect(cells[167]).toEqual({ day: 6, hour: 23, count: 0 });
    expect(cells.every((c) => c.count === 0)).toBe(true);
  });

  it("files a pageview under its local weekday and hour", () => {
    const slot = at(2026, 7, 24, 14, 30);
    const cells = buildHeatmap([pv({ created_at: slot.iso })]);
    expect(cellAt(cells, slot.day, slot.hour).count).toBe(1);
    // Nothing else moved.
    expect(cells.reduce((sum, c) => sum + c.count, 0)).toBe(1);
  });

  it("accumulates pageviews sharing a bucket, ignoring the minute", () => {
    const a = at(2026, 7, 24, 9, 0);
    const b = at(2026, 7, 24, 9, 59);
    const cells = buildHeatmap([
      pv({ created_at: a.iso }),
      pv({ created_at: b.iso }),
      pv({ created_at: a.iso }),
    ]);
    expect(cellAt(cells, a.day, a.hour).count).toBe(3);
  });

  it("separates buckets across hours and days", () => {
    const mon9 = at(2026, 7, 24, 9);
    const mon10 = at(2026, 7, 24, 10);
    const tue9 = at(2026, 7, 25, 9);
    const cells = buildHeatmap([
      pv({ created_at: mon9.iso }),
      pv({ created_at: mon10.iso }),
      pv({ created_at: tue9.iso }),
    ]);
    expect(cellAt(cells, mon9.day, mon9.hour).count).toBe(1);
    expect(cellAt(cells, mon10.day, mon10.hour).count).toBe(1);
    expect(cellAt(cells, tue9.day, tue9.hour).count).toBe(1);
  });

  it("counts a pageview regardless of whether it carries a session", () => {
    const slot = at(2026, 7, 24, 8);
    const cells = buildHeatmap([
      pv({ created_at: slot.iso, session_id: null }),
      pv({ created_at: slot.iso, session_id: "s9" }),
    ]);
    expect(cellAt(cells, slot.day, slot.hour).count).toBe(2);
  });

  it("covers midnight and 23h boundaries", () => {
    const midnight = at(2026, 7, 24, 0, 1);
    const lateNight = at(2026, 7, 24, 23, 59);
    const cells = buildHeatmap([
      pv({ created_at: midnight.iso }),
      pv({ created_at: lateNight.iso }),
    ]);
    expect(cellAt(cells, midnight.day, midnight.hour).count).toBe(1);
    expect(cellAt(cells, lateNight.day, lateNight.hour).count).toBe(1);
  });
});

describe("buildReferrerStats", () => {
  const ev = (session_id: string | null): EventRow => ({ session_id });

  it("returns nothing for no pageviews", () => {
    expect(buildReferrerStats([], [])).toEqual([]);
  });

  it("counts distinct sessions as visitors, not raw pageviews", () => {
    const stats = buildReferrerStats(
      [
        pv({ referrer: "https://google.com/a", session_id: "s1" }),
        pv({ referrer: "https://google.com/b", session_id: "s1" }),
        pv({ referrer: "https://google.com/c", session_id: "s2" }),
      ],
      [],
    );
    expect(stats).toEqual([
      { domain: "google.com", visitors: 2, conversions: 0, conversionRate: 0 },
    ]);
  });

  it("groups by domain, not by full URL", () => {
    const stats = buildReferrerStats(
      [
        pv({ referrer: "https://www.google.com/search?q=1", session_id: "s1" }),
        pv({ referrer: "https://google.com/other", session_id: "s2" }),
      ],
      [],
    );
    expect(stats).toHaveLength(1);
    expect(stats[0]).toMatchObject({ domain: "google.com", visitors: 2 });
  });

  it("buckets referrer-less pageviews under direct traffic", () => {
    const stats = buildReferrerStats([pv({ referrer: null, session_id: "s1" })], []);
    expect(stats[0].domain).toBe(DIRECT_REFERRER);
  });

  it("credits a conversion to the referrer of the session", () => {
    const stats = buildReferrerStats(
      [pv({ referrer: "https://google.com", session_id: "s1" })],
      [ev("s1")],
    );
    expect(stats[0]).toEqual({
      domain: "google.com",
      visitors: 1,
      conversions: 1,
      conversionRate: 100,
    });
  });

  it("counts a converting session once even with several events", () => {
    const stats = buildReferrerStats(
      [pv({ referrer: "https://google.com", session_id: "s1" })],
      [ev("s1"), ev("s1"), ev("s1")],
    );
    expect(stats[0]).toMatchObject({ visitors: 1, conversions: 1, conversionRate: 100 });
  });

  it("computes conversionRate as a percentage of visitors", () => {
    const stats = buildReferrerStats(
      [
        pv({ referrer: "https://google.com", session_id: "s1" }),
        pv({ referrer: "https://google.com", session_id: "s2" }),
        pv({ referrer: "https://google.com", session_id: "s3" }),
        pv({ referrer: "https://google.com", session_id: "s4" }),
      ],
      [ev("s1")],
    );
    expect(stats[0]).toMatchObject({ visitors: 4, conversions: 1, conversionRate: 25 });
  });

  it("ignores events whose session never appeared in pageviews", () => {
    const stats = buildReferrerStats(
      [pv({ referrer: "https://google.com", session_id: "s1" })],
      [ev("ghost-session"), ev(null)],
    );
    expect(stats[0]).toMatchObject({ conversions: 0, conversionRate: 0 });
  });

  it("ignores pageviews with no session id, dropping domains left at zero visitors", () => {
    const stats = buildReferrerStats(
      [
        pv({ referrer: "https://nosession.com", session_id: null }),
        pv({ referrer: "https://real.com", session_id: "s1" }),
      ],
      [],
    );
    // nosession.com produced a bucket but no countable visitor, so it is dropped.
    expect(stats.map((s) => s.domain)).toEqual(["real.com"]);
  });

  it("sorts by visitors descending", () => {
    const stats = buildReferrerStats(
      [
        pv({ referrer: "https://small.com", session_id: "a1" }),
        pv({ referrer: "https://big.com", session_id: "b1" }),
        pv({ referrer: "https://big.com", session_id: "b2" }),
        pv({ referrer: "https://big.com", session_id: "b3" }),
        pv({ referrer: "https://mid.com", session_id: "c1" }),
        pv({ referrer: "https://mid.com", session_id: "c2" }),
      ],
      [],
    );
    expect(stats.map((s) => s.domain)).toEqual(["big.com", "mid.com", "small.com"]);
  });

  it("caps the result at the top 10 domains", () => {
    // 12 domains, each with a visitor count equal to its index so the order is known.
    const pageviews: PageviewRow[] = [];
    for (let d = 0; d < 12; d++) {
      for (let s = 0; s <= d; s++) {
        pageviews.push(pv({ referrer: `https://d${d}.com`, session_id: `d${d}-s${s}` }));
      }
    }
    const stats = buildReferrerStats(pageviews, []);
    expect(stats).toHaveLength(10);
    // The two smallest (d0 with 1 visitor, d1 with 2) fall off the end.
    expect(stats[0].domain).toBe("d11.com");
    expect(stats.map((s) => s.domain)).not.toContain("d0.com");
    expect(stats.map((s) => s.domain)).not.toContain("d1.com");
  });

  it("attributes a conversion to the FIRST referrer of a multi-referrer session", () => {
    // Same session arriving from two sources: it counts as a visitor under both
    // (documented asymmetry), but the conversion lands only on the first.
    const stats = buildReferrerStats(
      [
        pv({ referrer: "https://first.com", session_id: "s1" }),
        pv({ referrer: "https://second.com", session_id: "s1" }),
      ],
      [ev("s1")],
    );
    const first = stats.find((s) => s.domain === "first.com")!;
    const second = stats.find((s) => s.domain === "second.com")!;
    expect(first).toMatchObject({ visitors: 1, conversions: 1, conversionRate: 100 });
    expect(second).toMatchObject({ visitors: 1, conversions: 0, conversionRate: 0 });
  });

  it("never reports a conversionRate above 100%", () => {
    const stats = buildReferrerStats(
      [
        pv({ referrer: "https://google.com", session_id: "s1" }),
        pv({ referrer: "https://google.com", session_id: "s2" }),
      ],
      [ev("s1"), ev("s1"), ev("s2"), ev("s2")],
    );
    expect(stats[0].conversionRate).toBe(100);
    expect(stats[0].conversions).toBeLessThanOrEqual(stats[0].visitors);
  });
});
