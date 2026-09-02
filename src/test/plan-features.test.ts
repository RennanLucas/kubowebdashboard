import { describe, it, expect } from "vitest";
import {
  PLAN_CAPABILITIES,
  requiredTierFor,
  type FeatureKey,
  type PlanTier,
} from "@/lib/plan-features";

describe("PLAN_CAPABILITIES", () => {
  it("free tier has correct limits", () => {
    const free = PLAN_CAPABILITIES.free;
    expect(free.tier).toBe("free");
    expect(free.maxProjects).toBe(1);
    expect(free.maxHistoryDays).toBe(7);
    expect(free.aiMonthlyLimit).toBe(0);
  });

  it("pro tier has correct limits", () => {
    const pro = PLAN_CAPABILITIES.pro;
    expect(pro.tier).toBe("pro");
    expect(pro.maxProjects).toBe(Number.POSITIVE_INFINITY);
    expect(pro.maxHistoryDays).toBe(365);
    expect(pro.aiMonthlyLimit).toBe(10);
  });

  it("free tier blocks premium features", () => {
    const free = PLAN_CAPABILITIES.free.features;
    expect(free.ai_insights).toBe(false);
    expect(free.email_alerts).toBe(false);
    expect(free.pdf_report).toBe(false);
    expect(free.csv_export).toBe(false);
    expect(free.live).toBe(false);
    expect(free.heatmap).toBe(false);
    expect(free.annotations).toBe(false);
    expect(free.goals).toBe(false);
  });

  it("free tier allows in_app_alerts", () => {
    expect(PLAN_CAPABILITIES.free.features.in_app_alerts).toBe(true);
  });

  it("pro tier enables all features", () => {
    const pro = PLAN_CAPABILITIES.pro.features;
    const allKeys = Object.keys(pro) as FeatureKey[];
    for (const key of allKeys) {
      expect(pro[key]).toBe(true);
    }
  });
});

describe("requiredTierFor", () => {
  it("returns 'free' for features available on free tier", () => {
    expect(requiredTierFor("in_app_alerts")).toBe("free");
  });

  it("returns 'pro' for features requiring upgrade", () => {
    const proFeatures: FeatureKey[] = [
      "live",
      "ai_insights",
      "compare",
      "presentation",
      "pdf_report",
      "csv_export",
      "email_alerts",
      "annotations",
      "goals",
      "heatmap",
      "realtime_refresh",
    ];
    for (const f of proFeatures) {
      expect(requiredTierFor(f)).toBe("pro");
    }
  });
});
