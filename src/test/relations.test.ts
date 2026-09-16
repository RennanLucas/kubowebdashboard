// @vitest-environment node
import { describe, expect, it } from "vitest";
import { oneRelation } from "../../supabase/functions/_shared/relations";
describe("embedded PostgREST relations", () => {
  it("supports object and array representations without inventing missing data", () => {
    const org = { name: "Kubo", lead_value: 25 };
    expect(oneRelation(org)).toBe(org);
    expect(oneRelation([org])).toBe(org);
    expect(oneRelation([])).toBeNull();
    expect(oneRelation(null)).toBeNull();
    expect(oneRelation(undefined)).toBeNull();
  });
});
