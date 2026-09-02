// Pure, dependency-free subscription-view logic extracted from index.ts so it
// can be unit-tested without booting Deno.serve. No URL imports here, so Vitest
// loads this file directly. index.ts imports these back in — runtime behavior is
// unchanged. `now` (epoch ms) is passed in so the time comparisons stay
// deterministic. Mirrors the server-side resolveTier gate in _shared/plans.ts.

export const ACTIVE_STATUSES = ["active", "trialing", "authorized", "approved"];
export const CANCELED_STATUSES = ["canceled", "cancelled"];

export interface SubscriptionState {
  status: string;
  current_period_end: string | null;
  trial_end: string | null;
}

/**
 * Whether the subscription currently grants access. Active statuses count while
 * the period has not lapsed; a canceled subscription still counts until the end
 * of its paid period (grace period).
 */
export function computeIsActive(sub: SubscriptionState, now: number): boolean {
  const periodOk = !sub.current_period_end ||
    new Date(sub.current_period_end).getTime() > now;
  if (ACTIVE_STATUSES.includes(sub.status) && periodOk) return true;
  if (
    CANCELED_STATUSES.includes(sub.status) && sub.current_period_end &&
    new Date(sub.current_period_end).getTime() > now
  ) return true;
  return false;
}

/** Whether the subscription is in a trial: explicit status or a future trial_end. */
export function computeIsTrialing(sub: SubscriptionState, now: number): boolean {
  if (sub.status === "trialing") return true;
  if (sub.trial_end && new Date(sub.trial_end).getTime() > now) return true;
  return false;
}

/**
 * When the user will next be charged. Nothing if the plan is set to cancel;
 * otherwise the trial end (falling back to the period end) while trialing, or
 * the period end once billing normally.
 */
export function computeNextChargeAt(
  sub: SubscriptionState,
  isTrialing: boolean,
  willCancel: boolean,
): string | null {
  if (willCancel) return null;
  return isTrialing ? (sub.trial_end ?? sub.current_period_end) : sub.current_period_end;
}
