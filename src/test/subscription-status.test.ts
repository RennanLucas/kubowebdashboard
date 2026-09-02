import { describe, it, expect } from "vitest";
// Import the REAL extracted subscription-view logic (no URL imports in
// _subscription.ts, so Vitest loads it directly). Tests fail if the
// get-subscription-status source drifts.
import {
  computeIsActive,
  computeIsTrialing,
  computeNextChargeAt,
  ACTIVE_STATUSES,
  CANCELED_STATUSES,
  type SubscriptionState,
} from "../../supabase/functions/get-subscription-status/_subscription.ts";

const NOW = Date.parse("2026-06-01T00:00:00.000Z");
const FUTURE = "2026-07-01T00:00:00.000Z";
const PAST = "2026-05-01T00:00:00.000Z";
const AT_NOW = "2026-06-01T00:00:00.000Z";

function sub(overrides: Partial<SubscriptionState> = {}): SubscriptionState {
  return { status: "active", current_period_end: null, trial_end: null, ...overrides };
}

describe("status constants (drift guard vs resolveTier)", () => {
  it("ACTIVE_STATUSES matches the server-side gate", () => {
    expect(ACTIVE_STATUSES).toEqual(["active", "trialing", "authorized", "approved"]);
  });

  it("CANCELED_STATUSES covers both spellings", () => {
    expect(CANCELED_STATUSES).toEqual(["canceled", "cancelled"]);
  });
});

describe("computeIsActive", () => {
  it("is active for an active status with no period end", () => {
    expect(computeIsActive(sub({ status: "active" }), NOW)).toBe(true);
  });

  it("is active for an active status within the period", () => {
    expect(computeIsActive(sub({ status: "active", current_period_end: FUTURE }), NOW)).toBe(true);
  });

  it("is inactive once an active status's period has lapsed", () => {
    expect(computeIsActive(sub({ status: "active", current_period_end: PAST }), NOW)).toBe(false);
  });

  it("treats a period end exactly at now as lapsed (strict >)", () => {
    expect(computeIsActive(sub({ status: "active", current_period_end: AT_NOW }), NOW)).toBe(false);
  });

  it("is active for trialing / authorized / approved statuses", () => {
    expect(computeIsActive(sub({ status: "trialing" }), NOW)).toBe(true);
    expect(computeIsActive(sub({ status: "authorized" }), NOW)).toBe(true);
    expect(computeIsActive(sub({ status: "approved" }), NOW)).toBe(true);
  });

  it("keeps a canceled subscription active during its grace period", () => {
    expect(computeIsActive(sub({ status: "canceled", current_period_end: FUTURE }), NOW)).toBe(true);
    expect(computeIsActive(sub({ status: "cancelled", current_period_end: FUTURE }), NOW)).toBe(true);
  });

  it("is inactive for a canceled subscription past its period", () => {
    expect(computeIsActive(sub({ status: "canceled", current_period_end: PAST }), NOW)).toBe(false);
  });

  it("is inactive for a canceled subscription with no period end", () => {
    expect(computeIsActive(sub({ status: "canceled", current_period_end: null }), NOW)).toBe(false);
  });

  it("is inactive for unpaid / pending statuses", () => {
    expect(computeIsActive(sub({ status: "unpaid", current_period_end: FUTURE }), NOW)).toBe(false);
    expect(computeIsActive(sub({ status: "pending", current_period_end: FUTURE }), NOW)).toBe(false);
  });
});

describe("computeIsTrialing", () => {
  it("is trialing when the status is 'trialing', regardless of trial_end", () => {
    expect(computeIsTrialing(sub({ status: "trialing", trial_end: null }), NOW)).toBe(true);
    expect(computeIsTrialing(sub({ status: "trialing", trial_end: PAST }), NOW)).toBe(true);
  });

  it("is trialing when trial_end is still in the future", () => {
    expect(computeIsTrialing(sub({ status: "active", trial_end: FUTURE }), NOW)).toBe(true);
  });

  it("is not trialing once trial_end has passed", () => {
    expect(computeIsTrialing(sub({ status: "active", trial_end: PAST }), NOW)).toBe(false);
  });

  it("treats a trial_end exactly at now as ended (strict >)", () => {
    expect(computeIsTrialing(sub({ status: "active", trial_end: AT_NOW }), NOW)).toBe(false);
  });

  it("is not trialing with no trial_end and a non-trial status", () => {
    expect(computeIsTrialing(sub({ status: "active", trial_end: null }), NOW)).toBe(false);
  });
});

describe("computeNextChargeAt", () => {
  it("returns null when the plan is set to cancel, even while trialing", () => {
    expect(
      computeNextChargeAt(sub({ trial_end: FUTURE, current_period_end: FUTURE }), true, true),
    ).toBeNull();
  });

  it("returns trial_end while trialing", () => {
    expect(
      computeNextChargeAt(sub({ trial_end: FUTURE, current_period_end: PAST }), true, false),
    ).toBe(FUTURE);
  });

  it("falls back to current_period_end while trialing without a trial_end", () => {
    expect(
      computeNextChargeAt(sub({ trial_end: null, current_period_end: FUTURE }), true, false),
    ).toBe(FUTURE);
  });

  it("returns current_period_end when billing normally", () => {
    expect(
      computeNextChargeAt(sub({ current_period_end: FUTURE }), false, false),
    ).toBe(FUTURE);
  });

  it("returns null when billing normally with no period end", () => {
    expect(
      computeNextChargeAt(sub({ current_period_end: null }), false, false),
    ).toBeNull();
  });
});
