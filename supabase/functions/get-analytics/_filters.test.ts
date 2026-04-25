import { assertEquals, assert, assertNotEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import {
  classifySource,
  deviceMatchesFilter,
  parseDevice,
  shouldUseGA4,
  sourceMatchesFilter,
} from "./_filters.ts";

// ---------------------------------------------------------------------------
// shouldUseGA4 — guarantees the GA4 branch is ONLY used when no filters apply.
// ---------------------------------------------------------------------------

Deno.test("shouldUseGA4: true when GA4 is configured and no filters are active", () => {
  assertEquals(
    shouldUseGA4({
      hasServiceAccount: true,
      hasPropertyId: true,
      sourceFilter: "all",
      deviceFilter: "all",
    }),
    true,
  );
});

Deno.test("shouldUseGA4: false whenever a source filter is active", () => {
  for (const f of ["direct", "organic", "social", "paid", "referral", "email"]) {
    assertEquals(
      shouldUseGA4({
        hasServiceAccount: true,
        hasPropertyId: true,
        sourceFilter: f,
        deviceFilter: "all",
      }),
      false,
      `source filter '${f}' must force the fallback branch`,
    );
  }
});

Deno.test("shouldUseGA4: false whenever a device filter is active", () => {
  for (const d of ["desktop", "mobile", "tablet"]) {
    assertEquals(
      shouldUseGA4({
        hasServiceAccount: true,
        hasPropertyId: true,
        sourceFilter: "all",
        deviceFilter: d,
      }),
      false,
      `device filter '${d}' must force the fallback branch`,
    );
  }
});

Deno.test("shouldUseGA4: false when GA4 is not configured", () => {
  assertEquals(
    shouldUseGA4({
      hasServiceAccount: false,
      hasPropertyId: true,
      sourceFilter: "all",
      deviceFilter: "all",
    }),
    false,
  );
  assertEquals(
    shouldUseGA4({
      hasServiceAccount: true,
      hasPropertyId: false,
      sourceFilter: "all",
      deviceFilter: "all",
    }),
    false,
  );
});

// ---------------------------------------------------------------------------
// classifySource / sourceMatchesFilter — basic correctness sanity.
// ---------------------------------------------------------------------------

Deno.test("classifySource: maps known referrers", () => {
  assertEquals(classifySource(null), "Direto");
  assertEquals(classifySource(""), "Direto");
  assertEquals(classifySource("https://www.google.com/search"), "Google");
  assertEquals(classifySource("https://m.facebook.com/foo"), "Facebook");
  assertEquals(classifySource("https://instagram.com/x"), "Instagram");
  assertEquals(classifySource("https://example.com/blog"), "example.com");
});

Deno.test("sourceMatchesFilter: 'all' lets everything through", () => {
  for (const c of ["Direto", "Google", "Facebook", "example.com"]) {
    assert(sourceMatchesFilter(c, "all"));
  }
});

// ---------------------------------------------------------------------------
// FILTER ISOLATION — different filter values must NOT yield identical buckets
// when the underlying traffic mix has multiple sources/devices.
// This is the regression test for the GA4-branch bug we fixed.
// ---------------------------------------------------------------------------

interface FakePV {
  referrer: string | null;
  user_agent: string;
}

// Crafted so every bucket has a distinct count: direct=1, organic=2, social=3, referral=4.
// Devices: desktop=2, mobile=4, tablet=1.
const sample: FakePV[] = [
  // direct (1)
  { referrer: null, user_agent: "Mozilla/5.0 (Linux; Android 13)" }, // mobile

  // organic (2)
  { referrer: "https://www.google.com/", user_agent: "Mozilla/5.0 (Windows NT 10.0)" }, // desktop
  { referrer: "https://www.bing.com/", user_agent: "Mozilla/5.0 (Linux; Android 13)" }, // mobile

  // social (3)
  { referrer: "https://m.facebook.com/", user_agent: "Mozilla/5.0 (iPad; CPU OS 16_0)" }, // tablet
  { referrer: "https://instagram.com/", user_agent: "Mozilla/5.0 (Linux; Android 13)" }, // mobile
  { referrer: "https://twitter.com/", user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0)" }, // mobile

  // referral (4)
  { referrer: "https://news.ycombinator.com/", user_agent: "Mozilla/5.0 (Macintosh)" }, // desktop
  { referrer: "https://reddit.com/", user_agent: "Mozilla/5.0 (Linux; Android 13)" }, // mobile
  { referrer: "https://medium.com/", user_agent: "Mozilla/5.0 (Macintosh)" }, // desktop -> wait, that's 3 desktop. Adjust.
];

// Recompute carefully: we want desktop=2, mobile=4, tablet=1 → total 7 -> but we have 9 items.
// Let's just rebuild with explicit totals.
const fixture: FakePV[] = [
  // direct = 1 / mobile
  { referrer: null, user_agent: "Mozilla/5.0 (Linux; Android 13)" },
  // organic = 2  → 1 desktop, 1 mobile
  { referrer: "https://www.google.com/", user_agent: "Mozilla/5.0 (Windows NT 10.0)" },
  { referrer: "https://www.bing.com/", user_agent: "Mozilla/5.0 (Linux; Android 13)" },
  // social = 3  → 1 tablet, 2 mobile
  { referrer: "https://m.facebook.com/", user_agent: "Mozilla/5.0 (iPad; CPU OS 16_0)" },
  { referrer: "https://instagram.com/", user_agent: "Mozilla/5.0 (Linux; Android 13)" },
  { referrer: "https://twitter.com/", user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0)" },
  // referral = 4 → 4 desktop
  { referrer: "https://news.ycombinator.com/", user_agent: "Mozilla/5.0 (Macintosh)" },
  { referrer: "https://reddit.com/", user_agent: "Mozilla/5.0 (Macintosh)" },
  { referrer: "https://medium.com/", user_agent: "Mozilla/5.0 (Macintosh)" },
  { referrer: "https://dev.to/", user_agent: "Mozilla/5.0 (Macintosh)" },
];
// Totals: source { direct:1, organic:2, social:3, referral:4 }, total 10
//         device { mobile:4, desktop:5, tablet:1 } - but we want to ensure all distinct.
//         (mobile 4, desktop 5, tablet 1 → all distinct ✓)

function applySource(pvs: FakePV[], filter: string) {
  if (filter === "all") return pvs;
  return pvs.filter((pv) => sourceMatchesFilter(classifySource(pv.referrer), filter));
}

function applyDevice(pvs: FakePV[], filter: string) {
  if (filter === "all") return pvs;
  return pvs.filter((pv) => deviceMatchesFilter(pv.user_agent, filter));
}

Deno.test("source filters: each bucket has a DISTINCT non-trivial count", () => {
  // Regression test for the GA4-branch bug where every filter returned the
  // same number (because GA4 ignored the filter parameter entirely).
  const counts = {
    all: applySource(fixture, "all").length,
    direct: applySource(fixture, "direct").length,
    organic: applySource(fixture, "organic").length,
    social: applySource(fixture, "social").length,
    referral: applySource(fixture, "referral").length,
  };
  // No two buckets are equal — proves the filter actually narrows the data.
  const values = [counts.direct, counts.organic, counts.social, counts.referral];
  const unique = new Set(values);
  assertEquals(unique.size, values.length, `buckets must all differ, got ${JSON.stringify(counts)}`);
  // Subset invariants.
  for (const v of values) assert(v < counts.all);
});

Deno.test("source filters: every pageview falls into exactly one bucket", () => {
  const total = fixture.length;
  const partitioned =
    applySource(fixture, "direct").length +
    applySource(fixture, "organic").length +
    applySource(fixture, "social").length +
    applySource(fixture, "referral").length;
  assertEquals(partitioned, total);
  assertEquals(applySource(fixture, "paid").length, 0);
  assertEquals(applySource(fixture, "email").length, 0);
});

Deno.test("device filters: each bucket has a DISTINCT count and partitions traffic", () => {
  const counts = {
    all: applyDevice(fixture, "all").length,
    desktop: applyDevice(fixture, "desktop").length,
    mobile: applyDevice(fixture, "mobile").length,
    tablet: applyDevice(fixture, "tablet").length,
  };
  const values = [counts.desktop, counts.mobile, counts.tablet];
  const unique = new Set(values);
  assertEquals(unique.size, values.length, `device buckets must differ, got ${JSON.stringify(counts)}`);
  assertEquals(counts.desktop + counts.mobile + counts.tablet, counts.all);
});

Deno.test("parseDevice: known UAs map correctly", () => {
  assertEquals(parseDevice("Mozilla/5.0 (Windows NT 10.0)"), "Desktop");
  assertEquals(parseDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 16_0)"), "Mobile");
  assertEquals(parseDevice("Mozilla/5.0 (iPad; CPU OS 16_0)"), "Tablet");
  assertEquals(parseDevice("Mozilla/5.0 (Linux; Android 13)"), "Mobile");
});

// Silence unused-warning for the exploratory `sample` array left as documentation.
void sample;
