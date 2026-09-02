import { describe, it, expect } from "vitest";

/**
 * Edge function mirror of parseDaysParam — kept in sync manually.
 * The real implementation lives in supabase/functions/_shared/plan-gate.ts;
 * this copy allows us to test the parse logic without importing Deno TS.
 */
function parseDaysParam(raw: string | null, fallback = 30): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return parsed;
}

describe("parseDaysParam", () => {
  it("returns the parsed integer when valid", () => {
    expect(parseDaysParam("7", 30)).toBe(7);
    expect(parseDaysParam("90", 30)).toBe(90);
    expect(parseDaysParam("1", 30)).toBe(1);
  });

  it("returns fallback when raw is null", () => {
    expect(parseDaysParam(null, 30)).toBe(30);
  });

  it("returns fallback when raw is empty string", () => {
    expect(parseDaysParam("", 30)).toBe(30);
  });

  it("returns fallback when raw is non-numeric", () => {
    expect(parseDaysParam("abc", 30)).toBe(30);
    expect(parseDaysParam("x7", 30)).toBe(30);
  });

  it("returns fallback when parsed value is zero", () => {
    expect(parseDaysParam("0", 30)).toBe(30);
  });

  it("returns fallback when parsed value is negative", () => {
    expect(parseDaysParam("-5", 30)).toBe(30);
    expect(parseDaysParam("-999", 30)).toBe(30);
  });

  it("returns fallback when raw contains only whitespace", () => {
    expect(parseDaysParam("   ", 30)).toBe(30);
  });

  it("parses leading numeric portion (parseInt behavior)", () => {
    expect(parseDaysParam("42abc", 30)).toBe(42);
  });

  it("respects custom fallback", () => {
    expect(parseDaysParam(null, 7)).toBe(7);
    expect(parseDaysParam("abc", 90)).toBe(90);
  });
});
