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

const sample: FakePV[] = [
  { referrer: null, user_agent: "Mozilla/5.0 (Windows NT 10.0)" }, // Direto / Desktop
  { referrer: null, user_agent: "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0)" }, // Direto / Mobile
  { referrer: "https://www.google.com/", user_agent: "Mozilla/5.0 (Windows NT 10.0)" }, // Organic / Desktop
  { referrer: "https://www.google.com/", user_agent: "Mozilla/5.0 (Linux; Android 13)" }, // Organic / Mobile
  { referrer: "https://m.facebook.com/", user_agent: "Mozilla/5.0 (iPad; CPU OS 16_0)" }, // Social / Tablet
  { referrer: "https://instagram.com/", user_agent: "Mozilla/5.0 (Linux; Android 13)" }, // Social / Mobile
  { referrer: "https://news.ycombinator.com/", user_agent: "Mozilla/5.0 (Macintosh)" }, // Referral / Desktop
];

function applySource(pvs: FakePV[], filter: string) {
  if (filter === "all") return pvs;
  return pvs.filter((pv) => sourceMatchesFilter(classifySource(pv.referrer), filter));
}

function applyDevice(pvs: FakePV[], filter: string) {
  if (filter === "all") return pvs;
  return pvs.filter((pv) => deviceMatchesFilter(pv.user_agent, filter));
}

Deno.test("source filters must NEVER all return the same count", () => {
  const counts = {
    all: applySource(sample, "all").length,
    direct: applySource(sample, "direct").length,
    organic: applySource(sample, "organic").length,
    social: applySource(sample, "social").length,
    referral: applySource(sample, "referral").length,
  };
  // The previous bug returned the same number for every filter (GA4 ignored them).
  // Distinct buckets => distinct counts (at least pairwise).
  assertNotEquals(counts.all, counts.direct, "direct should be a strict subset of all");
  assertNotEquals(counts.direct, counts.organic, "direct vs organic should differ");
  assertNotEquals(counts.organic, counts.social, "organic vs social should differ");
  assertNotEquals(counts.social, counts.referral, "social vs referral should differ");
  // Subset invariants.
  assert(counts.direct < counts.all);
  assert(counts.organic < counts.all);
  assert(counts.social < counts.all);
  assert(counts.referral < counts.all);
});

Deno.test("source filters: sum of partitions equals total (with paid/email = 0)", () => {
  const total = sample.length;
  const partitioned =
    applySource(sample, "direct").length +
    applySource(sample, "organic").length +
    applySource(sample, "social").length +
    applySource(sample, "referral").length;
  assertEquals(partitioned, total, "every pageview must fall into exactly one bucket");

  assertEquals(applySource(sample, "paid").length, 0);
  assertEquals(applySource(sample, "email").length, 0);
});

Deno.test("device filters must NEVER all return the same count", () => {
  const counts = {
    all: applyDevice(sample, "all").length,
    desktop: applyDevice(sample, "desktop").length,
    mobile: applyDevice(sample, "mobile").length,
    tablet: applyDevice(sample, "tablet").length,
  };
  assertNotEquals(counts.all, counts.desktop);
  assertNotEquals(counts.desktop, counts.mobile);
  assertNotEquals(counts.mobile, counts.tablet);
  assertEquals(
    counts.desktop + counts.mobile + counts.tablet,
    counts.all,
    "every UA must fall into exactly one device bucket",
  );
});

Deno.test("parseDevice: known UAs map correctly", () => {
  assertEquals(parseDevice("Mozilla/5.0 (Windows NT 10.0)"), "Desktop");
  assertEquals(parseDevice("Mozilla/5.0 (iPhone; CPU iPhone OS 16_0)"), "Mobile");
  assertEquals(parseDevice("Mozilla/5.0 (iPad; CPU OS 16_0)"), "Tablet");
  assertEquals(parseDevice("Mozilla/5.0 (Linux; Android 13)"), "Mobile");
});
