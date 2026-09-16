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
): { version: "v1" | "v2" | "v3"; environment?: "live" | "sandbox"; organizationId?: string; planId?: string; userId?: string } {
  if (extRef.startsWith("v2|") || extRef.startsWith("v3|")) {
    const parts = extRef.split("|");
    const version = parts.shift() as "v2" | "v3";
    const values = new Map<string, string>();
    for (const part of parts) {
      const separator = part.indexOf(":");
      if (separator < 1) continue;
      const key = part.slice(0, separator);
      const value = part.slice(separator + 1);
      // Duplicate identity fields make the reference ambiguous: fail closed.
      if (values.has(key)) return { version };
      values.set(key, value);
    }
    const environment = values.get("env");
    return {
      version,
      environment: environment === "live" || environment === "sandbox" ? environment : undefined,
      organizationId: values.get("org"),
      planId: values.get("plan"),
      userId: values.get("user"),
    };
  } else {
    const [userId, planId] = extRef.split("|");
    return { version: "v1", organizationId: undefined, planId, userId };
  }
}

export function createExternalReference(input: {
  environment: "live" | "sandbox";
  organizationId: string;
  planId: string;
  userId: string;
}): string {
  return `v3|env:${input.environment}|org:${input.organizationId}|plan:${input.planId}|user:${input.userId}`;
}

export function isReferenceEnvironmentAllowed(
  reference: ReturnType<typeof parseExternalReference>,
  environment: "live" | "sandbox",
): boolean {
  // Legacy references were issued before test/live binding existed. They may
  // be honored only by live to avoid turning historical production IDs into
  // sandbox grants (or vice versa).
  return reference.version === "v3"
    ? reference.environment === environment
    : environment === "live";
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
