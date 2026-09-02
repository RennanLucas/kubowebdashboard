// @vitest-environment node
// Pure gate logic — no DOM needed.
import { describe, it, expect } from "vitest";
import {
  isSubscriptionValid,
  ACTIVE_STATUSES,
  CANCELED_STATUSES,
} from "@/lib/subscription-validity";
import {
  computeIsActive,
  ACTIVE_STATUSES as SERVER_ACTIVE_STATUSES,
  CANCELED_STATUSES as SERVER_CANCELED_STATUSES,
} from "../../supabase/functions/get-subscription-status/_subscription";

const NOW = Date.UTC(2026, 7, 24, 12, 0, 0);
const FUTURE = new Date(NOW + 86_400_000).toISOString();
const PAST = new Date(NOW - 86_400_000).toISOString();
const AT_NOW = new Date(NOW).toISOString();

describe("isSubscriptionValid", () => {
  it("rejects a missing subscription", () => {
    expect(isSubscriptionValid(null, NOW)).toBe(false);
    expect(isSubscriptionValid(undefined, NOW)).toBe(false);
  });

  it("accepts every active status while the period has not lapsed", () => {
    for (const status of ACTIVE_STATUSES) {
      expect(isSubscriptionValid({ status, current_period_end: FUTURE }, NOW)).toBe(true);
    }
  });

  it("accepts an active status with no period end (open-ended)", () => {
    expect(isSubscriptionValid({ status: "active", current_period_end: null }, NOW)).toBe(true);
    expect(isSubscriptionValid({ status: "active" }, NOW)).toBe(true);
  });

  it("rejects an active status once the period has lapsed", () => {
    expect(isSubscriptionValid({ status: "active", current_period_end: PAST }, NOW)).toBe(false);
  });

  it("treats a period ending exactly now as lapsed", () => {
    expect(isSubscriptionValid({ status: "active", current_period_end: AT_NOW }, NOW)).toBe(false);
  });

  it("grants a grace period to canceled plans until the period ends", () => {
    for (const status of CANCELED_STATUSES) {
      expect(isSubscriptionValid({ status, current_period_end: FUTURE }, NOW)).toBe(true);
      expect(isSubscriptionValid({ status, current_period_end: PAST }, NOW)).toBe(false);
      // No period end means no grace window to fall back on.
      expect(isSubscriptionValid({ status, current_period_end: null }, NOW)).toBe(false);
    }
  });

  it("rejects unpaid/pending/paused statuses regardless of the period", () => {
    for (const status of ["unpaid", "pending", "paused", "past_due", ""]) {
      expect(isSubscriptionValid({ status, current_period_end: FUTURE }, NOW)).toBe(false);
      expect(isSubscriptionValid({ status, current_period_end: null }, NOW)).toBe(false);
    }
  });

  it("defaults `now` to the current clock", () => {
    const soon = new Date(Date.now() + 60_000).toISOString();
    const ago = new Date(Date.now() - 60_000).toISOString();
    expect(isSubscriptionValid({ status: "active", current_period_end: soon })).toBe(true);
    expect(isSubscriptionValid({ status: "active", current_period_end: ago })).toBe(false);
  });
});

// The client gate and the get-subscription-status edge function must agree:
// a mismatch means the UI unlocks features the server denies (or vice versa).
describe("parity with the server-side computeIsActive", () => {
  it("shares the same status lists", () => {
    expect(ACTIVE_STATUSES).toEqual(SERVER_ACTIVE_STATUSES);
    expect(CANCELED_STATUSES).toEqual(SERVER_CANCELED_STATUSES);
  });

  it("returns the same verdict across the status/period matrix", () => {
    const statuses = [
      ...ACTIVE_STATUSES,
      ...CANCELED_STATUSES,
      "unpaid",
      "pending",
      "paused",
      "past_due",
    ];
    const periods = [FUTURE, PAST, AT_NOW, null];

    for (const status of statuses) {
      for (const current_period_end of periods) {
        expect(isSubscriptionValid({ status, current_period_end }, NOW)).toBe(
          computeIsActive({ status, current_period_end, trial_end: null }, NOW),
        );
      }
    }
  });
});
