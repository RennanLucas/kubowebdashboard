import { describe, it, expect } from "vitest";

// Mirror the plan-gate logic from supabase/functions/_shared/plans.ts
// so we can test it in vitest without Deno imports.

type PlanTier = "free" | "pro";

interface SubscriptionRow {
  plan_id?: string | null;
  status?: string | null;
  current_period_end?: string | null;
}

const ACTIVE_STATUS = ["active", "trialing", "authorized", "approved"];

function resolveTier(sub: SubscriptionRow | null | undefined): PlanTier {
  if (!sub) return "free";
  const status = (sub.status ?? "").toLowerCase();
  const periodOk =
    !sub.current_period_end ||
    new Date(sub.current_period_end) > new Date();
  const active =
    (ACTIVE_STATUS.includes(status) && periodOk) ||
    (["canceled", "cancelled"].includes(status) &&
      !!sub.current_period_end &&
      new Date(sub.current_period_end) > new Date());
  if (!active) return "free";
  return "pro";
}

interface TierLimits {
  tier: PlanTier;
  maxProjects: number;
  maxHistoryDays: number;
}

const TIER_LIMITS: Record<PlanTier, TierLimits> = {
  free: { tier: "free", maxProjects: 1, maxHistoryDays: 7 },
  pro: { tier: "pro", maxProjects: Number.MAX_SAFE_INTEGER, maxHistoryDays: 365 },
};

function enforceHistoryLimit(requestedDays: number, maxHistoryDays: number): number {
  if (requestedDays > maxHistoryDays) {
    throw new Error(
      `HISTORY_LIMIT_EXCEEDED: O limite de historico do plano foi excedido. (${maxHistoryDays} dias maximo)`,
    );
  }
  return requestedDays;
}

function enforcePremiumFeature(tier: PlanTier, featureName: string) {
  if (tier !== "pro") {
    throw new Error(
      `PLAN_REQUIRED: A funcionalidade ${featureName} e exclusiva do plano Pro.`,
    );
  }
}

// ─── Tests ──────────────────────────────────────────────────────────────────

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
});

describe("TIER_LIMITS", () => {
  it("free tier: maxHistoryDays = 7, maxProjects = 1", () => {
    expect(TIER_LIMITS.free.maxHistoryDays).toBe(7);
    expect(TIER_LIMITS.free.maxProjects).toBe(1);
  });

  it("pro tier: maxHistoryDays = 365, maxProjects = MAX_SAFE_INTEGER", () => {
    expect(TIER_LIMITS.pro.maxHistoryDays).toBe(365);
    expect(TIER_LIMITS.pro.maxProjects).toBe(Number.MAX_SAFE_INTEGER);
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
