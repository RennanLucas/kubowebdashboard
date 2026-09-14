import { describe, expect, it } from "vitest";
import { percentageChange } from "@/lib/metric-comparison";

describe("metric comparison", () => {
  it("uses the preceding value as the percentage baseline", () => {
    expect(percentageChange(209, 32)).toBeCloseTo(553.125);
    expect(percentageChange(32, 209)).toBeCloseTo(-84.689);
    expect(percentageChange(32, 32)).toBe(0);
  });
  it("does not invent growth from zero", () => {
    expect(percentageChange(209, 0)).toBeNull();
    expect(percentageChange(0, 0)).toBe(0);
    expect(percentageChange(0, 209)).toBe(-100);
    expect(percentageChange(NaN, 2)).toBeNull();
  });
});
