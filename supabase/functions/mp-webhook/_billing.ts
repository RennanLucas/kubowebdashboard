// Pure, dependency-free billing-webhook decision logic extracted from index.ts
// so it can be unit-tested without booting Deno.serve. No URL imports here, so
// Vitest loads this file directly. index.ts imports these back in — runtime
// behavior is unchanged. Time-dependent helpers take `now` (epoch ms) as a
// parameter to stay deterministic.

const DAY_MS = 24 * 60 * 60 * 1000;
const TRIAL_DAYS = 7;

/**
 * Parse the MercadoPago `external_reference` into who the subscription belongs to.
 * v2 format: "v2|org:<id>|plan:<id>|user:<id>" (any order, any subset present).
 * legacy v1 format: "<userId>|<planId>".
 */
export function parseExternalReference(
  extRef: string,
): { organizationId?: string; planId?: string; userId?: string } {
  if (extRef.startsWith("v2|")) {
    const parts = extRef.split("|");
    let orgId, planId, userId;
    for (const p of parts) {
      if (p.startsWith("org:")) orgId = p.replace("org:", "");
      if (p.startsWith("plan:")) planId = p.replace("plan:", "");
      if (p.startsWith("user:")) userId = p.replace("user:", "");
    }
    return { organizationId: orgId, planId, userId };
  } else {
    const [userId, planId] = extRef.split("|");
    return { organizationId: undefined, planId, userId };
  }
}

/**
 * Idempotency / ordering guard: true when the incoming event is not newer than
 * the last event already applied to the subscription (so it should be ignored).
 * Missing either timestamp means we cannot prove it is stale — apply it.
 */
export function isOutdated(
  eventDateStr: string | undefined,
  existingTsStr: string | null | undefined,
): boolean {
  if (!eventDateStr || !existingTsStr) return false;
  const eventTime = new Date(eventDateStr).getTime();
  const existingTime = new Date(existingTsStr).getTime();
  return eventTime <= existingTime;
}

/** Map a MercadoPago payment status to the subscription status we persist. */
export function mapPaymentStatus(status: string): string {
  return status === "approved" ? "active" : status === "rejected" ? "unpaid" : status;
}

/**
 * Map a MercadoPago preapproval status to our subscription status. An authorized
 * preapproval with a still-future trial end is "trialing", otherwise "active".
 */
export function mapPreapprovalStatus(
  status: string,
  trialEnd: string | null,
  now: number,
): string {
  if (status === "authorized") {
    return trialEnd && new Date(trialEnd).getTime() > now ? "trialing" : "active";
  }
  if (status === "cancelled") return "canceled";
  if (status === "paused") return "paused";
  return status;
}

/**
 * Period end for a one-off payment: 30 days (or 365 for yearly plans) from `now`
 * when approved, otherwise null. Returns an ISO string.
 */
export function computePeriodEnd(
  planId: string,
  isApproved: boolean,
  now: number,
): string | null {
  return isApproved
    ? new Date(now + (planId.includes("yearly") ? 365 : 30) * DAY_MS).toISOString()
    : null;
}

/**
 * Trial end for a preapproval: `TRIAL_DAYS` after creation when the plan has a
 * free trial and a creation date, otherwise null. Returns an ISO string.
 */
export function computeTrialEnd(
  hasFreeTrial: boolean,
  dateCreated: string | undefined,
): string | null {
  return hasFreeTrial && dateCreated
    ? new Date(new Date(dateCreated).getTime() + TRIAL_DAYS * DAY_MS).toISOString()
    : null;
}
