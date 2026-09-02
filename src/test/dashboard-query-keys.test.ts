// @vitest-environment node
// Pure predicate — no DOM needed.
import { describe, it, expect } from "vitest";
import {
  isDashboardQueryForProject,
  DASHBOARD_QUERY_PREFIX,
} from "@/lib/dashboard-query-keys";

/**
 * This predicate decides which cached entries are thrown away on a refetch.
 * Too narrow → the client stares at stale numbers. Too wide → one project's
 * traffic refetches every project, multiplying Edge Function calls per client.
 * So the tests pin both directions.
 */

const PROJECT = "proj-1";
const OTHER = "proj-2";
const USER = "user-1";
const ORG = "org-1";

/** The five real dashboard keys, mirroring src/hooks/useDashboardData.ts. */
const realKeys = (projectId: string) => [
  ["dashboard-overview", USER, ORG, 30, projectId, undefined, undefined],
  ["dashboard-pages", USER, ORG, 30, projectId, undefined, undefined],
  ["dashboard-sources", USER, ORG, 30, projectId, undefined],
  ["dashboard-devices", USER, ORG, 30, projectId, undefined],
  ["dashboard-geo", USER, ORG, 30, projectId, undefined, undefined],
];

describe("isDashboardQueryForProject", () => {
  it("matches every real dashboard query key for the project", () => {
    for (const key of realKeys(PROJECT)) {
      expect(isDashboardQueryForProject(key, PROJECT)).toBe(true);
    }
  });

  it("does not match another project's dashboard queries", () => {
    for (const key of realKeys(OTHER)) {
      expect(isDashboardQueryForProject(key, PROJECT)).toBe(false);
    }
  });

  it("ignores non-dashboard queries even when they carry the project id", () => {
    // Real keys from other hooks — invalidating these would refetch unrelated
    // data (and, for "subscription", the billing gate) on every pageview.
    expect(isDashboardQueryForProject(["projects", PROJECT], PROJECT)).toBe(false);
    expect(isDashboardQueryForProject(["subscription", USER, ORG], PROJECT)).toBe(false);
    expect(isDashboardQueryForProject(["is-admin", USER], PROJECT)).toBe(false);
    expect(isDashboardQueryForProject(["my-feedbacks", PROJECT], PROJECT)).toBe(false);
  });

  it("matches regardless of where the project id sits in the key", () => {
    // The filter tail shifts the position between hooks, so the match is
    // deliberately positional-agnostic.
    expect(isDashboardQueryForProject(["dashboard-x", PROJECT], PROJECT)).toBe(true);
    expect(
      isDashboardQueryForProject(["dashboard-x", USER, ORG, 7, "src", "mobile", PROJECT], PROJECT),
    ).toBe(true);
  });

  it("distinguishes queries that differ only by filters, matching all of them", () => {
    // Same project, different filter combinations: all must be invalidated,
    // otherwise a filtered view keeps serving stale numbers.
    const filtered = [
      ["dashboard-overview", USER, ORG, 30, PROJECT, "google", "mobile"],
      ["dashboard-overview", USER, ORG, 30, PROJECT, "direct", "desktop"],
      ["dashboard-overview", USER, ORG, 7, PROJECT, undefined, undefined],
    ];
    for (const key of filtered) {
      expect(isDashboardQueryForProject(key, PROJECT)).toBe(true);
    }
  });

  it("rejects an empty key", () => {
    expect(isDashboardQueryForProject([], PROJECT)).toBe(false);
  });

  it("survives a null or undefined key head without throwing", () => {
    expect(isDashboardQueryForProject([null, PROJECT], PROJECT)).toBe(false);
    expect(isDashboardQueryForProject([undefined, PROJECT], PROJECT)).toBe(false);
  });

  it("tolerates a non-string key head", () => {
    expect(isDashboardQueryForProject([42, PROJECT], PROJECT)).toBe(false);
    expect(isDashboardQueryForProject([{ scope: "dashboard-x" }, PROJECT], PROJECT)).toBe(false);
  });

  it("requires the prefix at the start, not merely somewhere in the head", () => {
    expect(isDashboardQueryForProject(["my-dashboard-overview", PROJECT], PROJECT)).toBe(false);
  });

  it("matches the bare prefix as a head", () => {
    expect(isDashboardQueryForProject([DASHBOARD_QUERY_PREFIX, PROJECT], PROJECT)).toBe(true);
  });

  it("compares the project id exactly, not by prefix", () => {
    // "proj-1" must not match a query for "proj-10".
    expect(isDashboardQueryForProject(["dashboard-overview", "proj-10"], "proj-1")).toBe(false);
  });
});
