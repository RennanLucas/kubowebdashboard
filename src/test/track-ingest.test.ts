// @vitest-environment node
import { describe, it, expect } from "vitest";
// Import the REAL extracted edge-function logic (no URL imports in _ingest.ts,
// so Vitest loads it directly). Tests fail if the tracking source drifts.
import {
  checkRateLimit,
  createRateLimitState,
  getIP,
  getCountryFromHeaders,
  buildRowsFromEvents,
  IP_MAX_PER_WINDOW,
  PROJECT_MAX_PER_WINDOW,
  RATE_LIMIT_WINDOW_MS,
  type TrackEvent,
} from "../../supabase/functions/track/_ingest.ts";

function reqWith(headers: Record<string, string>): Request {
  return new Request("https://track.example/collect", { method: "POST", headers });
}

describe("getIP", () => {
  it("reads the first entry of x-forwarded-for, trimmed", () => {
    expect(getIP(reqWith({ "x-forwarded-for": "203.0.113.9, 10.0.0.1, 70.1.2.3" }))).toBe("203.0.113.9");
  });

  it("trims surrounding whitespace on the forwarded IP", () => {
    expect(getIP(reqWith({ "x-forwarded-for": "  198.51.100.7  , 10.0.0.1" }))).toBe("198.51.100.7");
  });

  it("falls back to x-real-ip when x-forwarded-for is absent", () => {
    expect(getIP(reqWith({ "x-real-ip": "192.0.2.44" }))).toBe("192.0.2.44");
  });

  it("falls back to cf-connecting-ip when the others are absent", () => {
    expect(getIP(reqWith({ "cf-connecting-ip": "192.0.2.55" }))).toBe("192.0.2.55");
  });

  it("returns null when no IP header is present", () => {
    expect(getIP(reqWith({}))).toBeNull();
  });
});

describe("getCountryFromHeaders", () => {
  it("returns the uppercased cf-ipcountry", () => {
    expect(getCountryFromHeaders(reqWith({ "cf-ipcountry": "br" }))).toBe("BR");
  });

  it("prefers cf-ipcountry over the later candidates", () => {
    expect(
      getCountryFromHeaders(reqWith({ "cf-ipcountry": "us", "x-country": "de" })),
    ).toBe("US");
  });

  it("skips the placeholder 'XX' and uses the next valid candidate", () => {
    expect(
      getCountryFromHeaders(reqWith({ "cf-ipcountry": "XX", "x-country": "pt" })),
    ).toBe("PT");
  });

  it("skips the Tor placeholder 'T1'", () => {
    expect(
      getCountryFromHeaders(reqWith({ "cf-ipcountry": "T1", "x-vercel-ip-country": "fr" })),
    ).toBe("FR");
  });

  it("reads x-vercel-ip-country when it is the only header", () => {
    expect(getCountryFromHeaders(reqWith({ "x-vercel-ip-country": "es" }))).toBe("ES");
  });

  it("returns null when no usable country header is present", () => {
    expect(getCountryFromHeaders(reqWith({ "cf-ipcountry": "XX" }))).toBeNull();
    expect(getCountryFromHeaders(reqWith({}))).toBeNull();
  });
});

describe("checkRateLimit", () => {
  it("exposes the production thresholds (drift guard)", () => {
    expect(IP_MAX_PER_WINDOW).toBe(100);
    expect(PROJECT_MAX_PER_WINDOW).toBe(1000);
    expect(RATE_LIMIT_WINDOW_MS).toBe(60000);
  });

  it("allows the first request", () => {
    const state = createRateLimitState();
    expect(checkRateLimit("1.1.1.1", ["proj-abcdefghij"], state)).toEqual({ allowed: true });
  });

  it("allows exactly IP_MAX_PER_WINDOW requests then rejects the next by IP", () => {
    const state = createRateLimitState();
    for (let i = 0; i < IP_MAX_PER_WINDOW; i++) {
      expect(checkRateLimit("9.9.9.9", [], state).allowed).toBe(true);
    }
    expect(checkRateLimit("9.9.9.9", [], state)).toEqual({
      allowed: false,
      reason: "IP_RATE_LIMITED",
    });
  });

  it("tracks each IP in an independent bucket", () => {
    const state = createRateLimitState();
    for (let i = 0; i < IP_MAX_PER_WINDOW; i++) checkRateLimit("8.8.8.8", [], state);
    // 8.8.8.8 is now saturated, but a different IP starts fresh.
    expect(checkRateLimit("8.8.8.8", [], state).allowed).toBe(false);
    expect(checkRateLimit("7.7.7.7", [], state).allowed).toBe(true);
  });

  it("skips the IP check when ip is null but still limits by project", () => {
    const state = createRateLimitState();
    for (let i = 0; i < PROJECT_MAX_PER_WINDOW; i++) {
      expect(checkRateLimit(null, ["proj-1"], state).allowed).toBe(true);
    }
    expect(checkRateLimit(null, ["proj-1"], state)).toEqual({
      allowed: false,
      reason: "PROJECT_RATE_LIMITED",
    });
  });

  it("resets a bucket once its window has expired", () => {
    const state = createRateLimitState();
    // Saturate, then force the bucket's window into the past.
    for (let i = 0; i < IP_MAX_PER_WINDOW + 1; i++) checkRateLimit("5.5.5.5", [], state);
    expect(checkRateLimit("5.5.5.5", [], state).allowed).toBe(false);
    state.ipLimits.get("5.5.5.5")!.expiresAt = 0;
    expect(checkRateLimit("5.5.5.5", [], state).allowed).toBe(true);
  });
});

describe("buildRowsFromEvents", () => {
  const ctx = { userAgent: "UA/1.0", country: "BR", city: "Recife" };

  function pageview(overrides: Partial<TrackEvent> = {}): TrackEvent {
    return { type: "pageview", pid: "proj-1", path: "/home", ...overrides };
  }
  function event(overrides: Partial<TrackEvent> = {}): TrackEvent {
    return { type: "event", pid: "proj-1", path: "/home", event_type: "click", ...overrides };
  }

  it("builds a pageview row carrying request context", () => {
    const { pageviewsToInsert, eventsToInsert } = buildRowsFromEvents(
      [pageview({ ref: "https://google.com", sid: "s-1" })],
      new Set(["proj-1"]),
      ctx,
    );
    expect(eventsToInsert).toHaveLength(0);
    expect(pageviewsToInsert).toEqual([
      {
        project_id: "proj-1",
        page_path: "/home",
        referrer: "https://google.com",
        user_agent: "UA/1.0",
        country: "BR",
        city: "Recife",
        session_id: "s-1",
      },
    ]);
  });

  it("builds an event row and does not extract UTMs for events", () => {
    const { eventsToInsert, pageviewsToInsert } = buildRowsFromEvents(
      [event({ event_label: "cta", sid: "s-2", metadata: { utm_source: "ads", extra: 1 } })],
      new Set(["proj-1"]),
      ctx,
    );
    expect(pageviewsToInsert).toHaveLength(0);
    expect(eventsToInsert).toEqual([
      {
        project_id: "proj-1",
        event_type: "click",
        event_label: "cta",
        page_path: "/home",
        session_id: "s-2",
        metadata: { utm_source: "ads", extra: 1 },
      },
    ]);
  });

  it("skips an 'event' with no event_type entirely", () => {
    const { eventsToInsert, pageviewsToInsert } = buildRowsFromEvents(
      [{ type: "event", pid: "proj-1", path: "/x" }],
      new Set(["proj-1"]),
      ctx,
    );
    expect(eventsToInsert).toHaveLength(0);
    expect(pageviewsToInsert).toHaveLength(0);
  });

  it("drops events whose pid is not in the active set", () => {
    const { pageviewsToInsert } = buildRowsFromEvents(
      [pageview({ pid: "active" }), pageview({ pid: "inactive" })],
      new Set(["active"]),
      ctx,
    );
    expect(pageviewsToInsert).toHaveLength(1);
    expect(pageviewsToInsert[0].project_id).toBe("active");
  });

  it("extracts all five UTM params from pageview metadata as strings", () => {
    const { pageviewsToInsert } = buildRowsFromEvents(
      [
        pageview({
          metadata: {
            utm_source: "newsletter",
            utm_medium: "email",
            utm_campaign: "launch",
            utm_term: "analytics",
            utm_content: "hero",
          },
        }),
      ],
      new Set(["proj-1"]),
      ctx,
    );
    expect(pageviewsToInsert[0]).toMatchObject({
      utm_source: "newsletter",
      utm_medium: "email",
      utm_campaign: "launch",
      utm_term: "analytics",
      utm_content: "hero",
    });
  });

  it("coerces non-string UTM values via String()", () => {
    const { pageviewsToInsert } = buildRowsFromEvents(
      [pageview({ metadata: { utm_source: 42, utm_campaign: true } })],
      new Set(["proj-1"]),
      ctx,
    );
    expect(pageviewsToInsert[0].utm_source).toBe("42");
    expect(pageviewsToInsert[0].utm_campaign).toBe("true");
  });

  it("omits UTM keys entirely when metadata is empty or absent", () => {
    const { pageviewsToInsert } = buildRowsFromEvents(
      [pageview()],
      new Set(["proj-1"]),
      ctx,
    );
    const row = pageviewsToInsert[0];
    expect(row).not.toHaveProperty("utm_source");
    expect(row).not.toHaveProperty("utm_medium");
  });

  it("includes event_id only when the event carries one", () => {
    const withId = buildRowsFromEvents(
      [pageview({ event_id: "11111111-1111-1111-1111-111111111111" })],
      new Set(["proj-1"]),
      ctx,
    );
    expect(withId.pageviewsToInsert[0].event_id).toBe("11111111-1111-1111-1111-111111111111");

    const withoutId = buildRowsFromEvents([pageview()], new Set(["proj-1"]), ctx);
    expect(withoutId.pageviewsToInsert[0]).not.toHaveProperty("event_id");
  });

  it("nulls out referrer and session_id when absent", () => {
    const { pageviewsToInsert } = buildRowsFromEvents([pageview()], new Set(["proj-1"]), ctx);
    expect(pageviewsToInsert[0].referrer).toBeNull();
    expect(pageviewsToInsert[0].session_id).toBeNull();
  });

  it("splits a mixed batch into events and pageviews", () => {
    const { eventsToInsert, pageviewsToInsert } = buildRowsFromEvents(
      [pageview({ path: "/a" }), event({ event_type: "signup" }), pageview({ path: "/b" })],
      new Set(["proj-1"]),
      ctx,
    );
    expect(pageviewsToInsert.map((r) => r.page_path)).toEqual(["/a", "/b"]);
    expect(eventsToInsert.map((r) => r.event_type)).toEqual(["signup"]);
  });
});
