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
  isBot,
  BOT_UA_PATTERN,
  BOT_UA_ALLOWLIST,
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

/**
 * Bot filtering is a two-sided risk and both sides are graded here. A crawler
 * that gets counted inflates the visitor number a client reads in a report and
 * is billed against; a real browser that gets filtered silently deletes that
 * same client's traffic. So every assertion below names which side it protects.
 */
describe("isBot — filters non-human agents", () => {
  const crawlers = [
    ["Googlebot", "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"],
    ["Bingbot", "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)"],
    ["YandexBot", "Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)"],
    ["Baiduspider", "Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)"],
    ["DuckDuckBot", "DuckDuckBot/1.1; (+http://duckduckgo.com/duckduckbot.html)"],
    ["AhrefsBot", "Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)"],
    ["AhrefsSiteAudit (no 'bot' in the name)", "Mozilla/5.0 (compatible; AhrefsSiteAudit/6.1; +http://ahrefs.com/robot/)"],
    ["SemrushBot", "Mozilla/5.0 (compatible; SemrushBot/7~bl; +http://www.semrush.com/bot.html)"],
    ["Applebot", "Mozilla/5.0 (Device; like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15 (Applebot/0.1)"],
    ["PetalBot", "Mozilla/5.0 (Linux; Android 7.0;) AppleWebKit/537.36 (compatible; PetalBot;+https://webmaster.petalsearch.com/site/petalbot)"],
    ["Bytespider", "Mozilla/5.0 (Linux; Android 5.0) AppleWebKit/537.36 (KHTML, like Gecko) Mobile Safari/537.36 (compatible; Bytespider;)"],
    ["MJ12bot", "Mozilla/5.0 (compatible; MJ12bot/v1.4.8; http://mj12bot.com/)"],
    ["Scrapy", "Scrapy/2.11.0 (+https://scrapy.org)"],
    ["generic crawler", "SomeNewCrawler/1.0 (+https://example.test)"],
  ] as const;

  for (const [name, ua] of crawlers) {
    it(`filters ${name}`, () => {
      // Counted, this would show up as a visitor the client never had.
      expect(isBot(ua)).toBe(true);
    });
  }

  const automation = [
    ["HeadlessChrome", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0.0.0 Safari/537.36"],
    ["Lighthouse", "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36 Chrome-Lighthouse"],
    ["PhantomJS", "Mozilla/5.0 (Unknown; Linux x86_64) AppleWebKit/538.1 (KHTML, like Gecko) PhantomJS/2.1.1 Safari/538.1"],
    ["Pingdom", "Pingdom.com_bot_version_1.4_(http://www.pingdom.com/)"],
    ["curl", "curl/8.4.0"],
    ["wget", "Wget/1.21.4"],
    ["python-requests", "python-requests/2.31.0"],
    ["axios", "axios/1.6.7"],
    ["Go http client", "Go-http-client/2.0"],
    ["Java", "Java/17.0.9"],
    ["OkHttp", "okhttp/4.12.0"],
    ["node-fetch", "node-fetch/1.0 (+https://github.com/bitinn/node-fetch)"],
  ] as const;

  for (const [name, ua] of automation) {
    it(`filters ${name}`, () => {
      // These reach the endpoint only by direct POST — the browser-side check in
      // tracker-script never saw them, which is why the server needs this.
      expect(isBot(ua)).toBe(true);
    });
  }

  const previewFetchers = [
    ["facebookexternalhit", "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)"],
    ["BingPreview (no 'bot' in the name)", "Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) BingPreview/1.0b"],
    ["WhatsApp link preview", "WhatsApp/2.23.20.0 A"],
    ["Slackbot link expander", "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)"],
    ["Embedly", "Mozilla/5.0 (compatible; Embedly/0.2; +http://support.embed.ly/)"],
  ] as const;

  for (const [name, ua] of previewFetchers) {
    it(`filters ${name}`, () => {
      // A link unfurl is one machine fetch per share, not a person visiting.
      expect(isBot(ua)).toBe(true);
    });
  }
});

describe("isBot — never filters real visitors", () => {
  const browsers = [
    ["Chrome on Windows", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"],
    ["Safari on macOS", "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Safari/605.1.15"],
    ["Safari on iPhone", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.3 Mobile/15E148 Safari/604.1"],
    ["Chrome on Android", "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Mobile Safari/537.36"],
    ["Firefox on Linux", "Mozilla/5.0 (X11; Linux x86_64; rv:123.0) Gecko/20100101 Firefox/123.0"],
    ["Edge on Windows", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36 Edg/122.0.0.0"],
    ["Samsung Internet", "Mozilla/5.0 (Linux; Android 13; SAMSUNG SM-S911B) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/115.0.0.0 Mobile Safari/537.36"],
    ["Opera", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36 OPR/107.0.0.0"],
    ["Android WebView (in-app browser)", "Mozilla/5.0 (Linux; Android 13; SM-A536E; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/121.0.0.0 Mobile Safari/537.36"],
    ["Instagram in-app browser", "Mozilla/5.0 (iPhone; CPU iPhone OS 17_3 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 320.0.0.0.0"],
  ] as const;

  for (const [name, ua] of browsers) {
    it(`counts ${name}`, () => {
      // A false positive here silently deletes a paying client's real traffic.
      expect(isBot(ua)).toBe(false);
    });
  }

  it("counts Yandex Browser, a real browser from a search vendor", () => {
    // Matching the vendor name instead of its crawler would drop real people.
    // YandexBot is caught by the generic `bot` token, which is why the bare
    // vendor name is deliberately absent from the pattern.
    expect(isBot("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 YaBrowser/23.11.0.0 Safari/537.36")).toBe(false);
  });

  it("counts the Baidu mobile browser app", () => {
    expect(isBot("Mozilla/5.0 (iPhone; CPU iPhone OS 16_6 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 baiduboxapp/13.30.0.10")).toBe(false);
  });

  it("counts a CUBOT handset even though its brand name ends in 'bot'", () => {
    // The allowlist exists for exactly this: a device brand is not a robot.
    expect(isBot("Mozilla/5.0 (Linux; Android 11; CUBOT NOTE 20) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/96.0.4664.104 Mobile Safari/537.36")).toBe(false);
    expect(BOT_UA_ALLOWLIST.test("CUBOT NOTE 20")).toBe(true);
  });

  it("counts a hit with no user-agent at all", () => {
    // Fail open: privacy tooling strips this header on real people, and volume
    // abuse is rate limiting's job, not the bot gate's.
    expect(isBot(null)).toBe(false);
    expect(isBot(undefined)).toBe(false);
    expect(isBot("")).toBe(false);
  });
});

describe("isBot — pattern is shared with the browser script", () => {
  it("exposes patterns that survive being rebuilt from source", () => {
    // tracker-script serializes `.source` into the emitted JS via new RegExp,
    // so anything that breaks that round-trip breaks client-side filtering.
    const rebuilt = new RegExp(BOT_UA_PATTERN.source, "i");
    expect(rebuilt.test("Googlebot/2.1")).toBe(true);
    expect(rebuilt.test("Mozilla/5.0 (Windows NT 10.0) Chrome/122.0.0.0 Safari/537.36")).toBe(false);
    expect(new RegExp(BOT_UA_ALLOWLIST.source, "i").test("CUBOT_X30")).toBe(true);
  });

  it("is case-insensitive, since crawlers do not agree on casing", () => {
    expect(isBot("GOOGLEBOT/2.1")).toBe(true);
    expect(isBot("googlebot/2.1")).toBe(true);
    expect(isBot("CURL/8.4.0")).toBe(true);
  });
});
