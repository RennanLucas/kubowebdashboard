import { describe, it, expect } from "vitest";
// Import the REAL extracted billing-webhook logic (no URL imports in _billing.ts,
// so Vitest loads it directly). Tests fail if the mp-webhook source drifts.
import {
  parseExternalReference,
  isOutdated,
  mapPaymentStatus,
  mapPreapprovalStatus,
  computePeriodEnd,
  computeTrialEnd,
} from "../../supabase/functions/mp-webhook/_billing.ts";

describe("parseExternalReference", () => {
  it("parses a full v2 reference", () => {
    expect(parseExternalReference("v2|org:o1|plan:pro_monthly|user:u1")).toEqual({
      organizationId: "o1",
      planId: "pro_monthly",
      userId: "u1",
    });
  });

  it("is order-independent within a v2 reference", () => {
    expect(parseExternalReference("v2|user:u1|plan:p1|org:o1")).toEqual({
      organizationId: "o1",
      planId: "p1",
      userId: "u1",
    });
  });

  it("leaves organizationId undefined when the v2 reference omits org", () => {
    expect(parseExternalReference("v2|plan:p1|user:u1")).toEqual({
      organizationId: undefined,
      planId: "p1",
      userId: "u1",
    });
  });

  it("leaves plan/user undefined when a v2 reference omits them", () => {
    expect(parseExternalReference("v2|user:u1")).toEqual({
      organizationId: undefined,
      planId: undefined,
      userId: "u1",
    });
  });

  it("only strips the first prefix occurrence, keeping colons in the value", () => {
    expect(parseExternalReference("v2|plan:pro:yearly|user:u1").planId).toBe("pro:yearly");
  });

  it("parses the legacy v1 'userId|planId' reference", () => {
    expect(parseExternalReference("user-123|plan-pro")).toEqual({
      organizationId: undefined,
      planId: "plan-pro",
      userId: "user-123",
    });
  });

  it("handles a legacy reference with only a userId", () => {
    expect(parseExternalReference("user-123")).toEqual({
      organizationId: undefined,
      planId: undefined,
      userId: "user-123",
    });
  });
});

describe("isOutdated", () => {
  const older = "2026-01-01T00:00:00.000Z";
  const newer = "2026-02-01T00:00:00.000Z";

  it("is true when the incoming event is older than the last applied event", () => {
    expect(isOutdated(older, newer)).toBe(true);
  });

  it("is false when the incoming event is newer", () => {
    expect(isOutdated(newer, older)).toBe(false);
  });

  it("is true when the timestamps are equal (<=, so re-delivery is ignored)", () => {
    expect(isOutdated(older, older)).toBe(true);
  });

  it("is false when the event timestamp is missing", () => {
    expect(isOutdated(undefined, newer)).toBe(false);
  });

  it("is false when there is no existing timestamp (null or undefined)", () => {
    expect(isOutdated(newer, null)).toBe(false);
    expect(isOutdated(newer, undefined)).toBe(false);
  });
});

describe("mapPaymentStatus", () => {
  it("maps 'approved' to 'active'", () => {
    expect(mapPaymentStatus("approved")).toBe("active");
  });

  it("maps 'rejected' to 'unpaid'", () => {
    expect(mapPaymentStatus("rejected")).toBe("unpaid");
  });

  it("passes through other statuses unchanged", () => {
    expect(mapPaymentStatus("pending")).toBe("pending");
    expect(mapPaymentStatus("refunded")).toBe("refunded");
    expect(mapPaymentStatus("in_process")).toBe("in_process");
  });
});

describe("mapPreapprovalStatus", () => {
  const now = Date.parse("2026-06-01T00:00:00.000Z");

  it("maps an authorized preapproval with a future trial end to 'trialing'", () => {
    expect(mapPreapprovalStatus("authorized", "2026-06-08T00:00:00.000Z", now)).toBe("trialing");
  });

  it("maps an authorized preapproval with a past trial end to 'active'", () => {
    expect(mapPreapprovalStatus("authorized", "2026-05-01T00:00:00.000Z", now)).toBe("active");
  });

  it("maps an authorized preapproval with no trial to 'active'", () => {
    expect(mapPreapprovalStatus("authorized", null, now)).toBe("active");
  });

  it("normalizes the British 'cancelled' to 'canceled'", () => {
    expect(mapPreapprovalStatus("cancelled", null, now)).toBe("canceled");
  });

  it("maps 'paused' to 'paused'", () => {
    expect(mapPreapprovalStatus("paused", null, now)).toBe("paused");
  });

  it("passes through unknown statuses unchanged", () => {
    expect(mapPreapprovalStatus("pending", null, now)).toBe("pending");
  });
});

describe("computePeriodEnd", () => {
  const now = Date.parse("2026-01-01T00:00:00.000Z");

  it("returns null when the payment is not approved", () => {
    expect(computePeriodEnd("pro_monthly", false, now)).toBeNull();
  });

  it("adds 30 days for a monthly plan", () => {
    expect(computePeriodEnd("pro_monthly", true, now)).toBe("2026-01-31T00:00:00.000Z");
  });

  it("adds 365 days when the plan id contains 'yearly'", () => {
    expect(computePeriodEnd("pro_yearly", true, now)).toBe("2027-01-01T00:00:00.000Z");
  });

  it("defaults to 30 days when the plan id is not yearly", () => {
    expect(computePeriodEnd("", true, now)).toBe("2026-01-31T00:00:00.000Z");
  });
});

describe("computeTrialEnd", () => {
  const created = "2026-03-10T12:00:00.000Z";

  it("returns 7 days after creation when the plan has a free trial", () => {
    expect(computeTrialEnd(true, created)).toBe("2026-03-17T12:00:00.000Z");
  });

  it("returns null when there is no free trial", () => {
    expect(computeTrialEnd(false, created)).toBeNull();
  });

  it("returns null when the creation date is missing", () => {
    expect(computeTrialEnd(true, undefined)).toBeNull();
  });
});
