import { describe, it, expect } from "vitest";
// Import the REAL shared plan logic instead of hand-copied duplicates, so these
// tests fail if the edge-function source drifts. `plans.ts` is pure TS; the
// `SupabaseClient` import in `plan-gate.ts` is type-only, so both load under
// Vitest without Deno.
import {
  resolveTier,
  limitsForTier,
  TIER_LIMITS,
} from "../../supabase/functions/_shared/plans.ts";
import {
  enforceHistoryLimit,
  enforcePremiumFeature,
} from "../../supabase/functions/_shared/plan-gate.ts";

describe("resolveTier", () => {
  it("returns 'free' when subscription is null", () => {
    expect(resolveTier(null)).toBe("free");
  });

  it("returns 'free' when subscription is undefined", () => {
    expect(resolveTier(undefined)).toBe("free");
  });

  it("returns 'pro' for active subscription", () => {
    expect(resolveTier({ status: "active" })).toBe("pro");
  });

  it("returns 'pro' for trialing subscription", () => {
    expect(resolveTier({ status: "trialing" })).toBe("pro");
  });

  it("returns 'pro' for authorized subscription", () => {
    expect(resolveTier({ status: "authorized" })).toBe("pro");
  });

  it("returns 'pro' for approved subscription", () => {
    expect(resolveTier({ status: "approved" })).toBe("pro");
  });

  it("returns 'pro' for canceled sub with future period_end (grace period)", () => {
    const future = new Date(Date.now() + 30 * 86400000).toISOString();
    expect(resolveTier({ status: "canceled", current_period_end: future })).toBe("pro");
  });

  it("returns 'free' for canceled sub with past period_end", () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    expect(resolveTier({ status: "canceled", current_period_end: past })).toBe("free");
  });

  it("returns 'free' for canceled sub without period_end", () => {
    expect(resolveTier({ status: "canceled" })).toBe("free");
  });

  it("returns 'free' for unknown status", () => {
    expect(resolveTier({ status: "unknown" })).toBe("free");
  });

  it("returns 'free' for unpaid status", () => {
    expect(resolveTier({ status: "unpaid" })).toBe("free");
  });

  it("returns 'free' for active sub with expired period_end", () => {
    const past = new Date(Date.now() - 86400000).toISOString();
    expect(resolveTier({ status: "active", current_period_end: past })).toBe("free");
  });

  it("handles 'cancelled' (double-l British spelling) with grace period", () => {
    const future = new Date(Date.now() + 30 * 86400000).toISOString();
    expect(resolveTier({ status: "cancelled", current_period_end: future })).toBe("pro");
  });

  it("is case-insensitive about the status string", () => {
    expect(resolveTier({ status: "ACTIVE" })).toBe("pro");
    expect(resolveTier({ status: "Trialing" })).toBe("pro");
  });
});

describe("TIER_LIMITS / limitsForTier", () => {
  it("free tier: maxHistoryDays = 7, maxProjects = 1, no AI, no email alerts", () => {
    expect(TIER_LIMITS.free.maxHistoryDays).toBe(7);
    expect(TIER_LIMITS.free.maxProjects).toBe(1);
    expect(TIER_LIMITS.free.aiMonthlyLimit).toBe(0);
    expect(TIER_LIMITS.free.emailAlerts).toBe(false);
  });

  it("pro tier: maxHistoryDays = 365, unlimited projects, AI + email alerts", () => {
    expect(TIER_LIMITS.pro.maxHistoryDays).toBe(365);
    expect(TIER_LIMITS.pro.maxProjects).toBe(Number.MAX_SAFE_INTEGER);
    expect(TIER_LIMITS.pro.aiMonthlyLimit).toBeGreaterThan(0);
    expect(TIER_LIMITS.pro.emailAlerts).toBe(true);
  });

  it("limitsForTier returns the matching TIER_LIMITS entry", () => {
    expect(limitsForTier("free")).toBe(TIER_LIMITS.free);
    expect(limitsForTier("pro")).toBe(TIER_LIMITS.pro);
  });
});

describe("enforceHistoryLimit", () => {
  it("returns days when within limit", () => {
    expect(enforceHistoryLimit(7, 7)).toBe(7);
    expect(enforceHistoryLimit(30, 365)).toBe(30);
  });

  it("throws HISTORY_LIMIT_EXCEEDED when days exceed limit", () => {
    expect(() => enforceHistoryLimit(30, 7)).toThrow("HISTORY_LIMIT_EXCEEDED");
    expect(() => enforceHistoryLimit(366, 365)).toThrow("HISTORY_LIMIT_EXCEEDED");
  });

  it("includes max days in error message", () => {
    expect(() => enforceHistoryLimit(30, 7)).toThrow("7 dias maximo");
  });
});

describe("enforcePremiumFeature", () => {
  it("does not throw for pro tier", () => {
    expect(() => enforcePremiumFeature("pro", "AI Insights")).not.toThrow();
  });

  it("throws PLAN_REQUIRED for free tier", () => {
    expect(() => enforcePremiumFeature("free", "AI Insights")).toThrow("PLAN_REQUIRED");
  });

  it("includes feature name in error message", () => {
    expect(() => enforcePremiumFeature("free", "Heatmaps")).toThrow("Heatmaps");
  });
});
