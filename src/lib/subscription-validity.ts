/**
 * Client-side gate that decides whether a subscription row grants access.
 *
 * Deliberately a mirror of `computeIsActive` in
 * supabase/functions/get-subscription-status/_subscription.ts — the server stays
 * the source of truth, but the UI needs the same answer without a round trip.
 * Kept in its own module so the gate is unit-testable and the parity with the
 * server copy is assertable (see subscription-validity.test.ts); the two files
 * can't share code across the browser/Deno boundary.
 *
 * `now` (epoch ms) is injectable so the time comparisons stay deterministic.
 */

export const ACTIVE_STATUSES = ["active", "trialing", "authorized", "approved"];
export const CANCELED_STATUSES = ["canceled", "cancelled"];

export interface SubscriptionValidityInput {
  status: string;
  current_period_end?: string | null;
}

export function isSubscriptionValid(
  sub: SubscriptionValidityInput | null | undefined,
  now: number = Date.now(),
): boolean {
  if (!sub) return false;
  const periodOk =
    !sub.current_period_end || new Date(sub.current_period_end).getTime() > now;
  if (ACTIVE_STATUSES.includes(sub.status) && periodOk) return true;
  // Grace period: a canceled plan still grants access until the paid period ends.
  if (
    CANCELED_STATUSES.includes(sub.status) &&
    sub.current_period_end &&
    new Date(sub.current_period_end).getTime() > now
  ) {
    return true;
  }
  return false;
}
