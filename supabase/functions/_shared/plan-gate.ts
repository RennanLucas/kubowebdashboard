import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";
import { resolveTier, limitsForTier, PlanTier } from "./plans.ts";

export async function resolveProjectTier(
  supabaseAdmin: SupabaseClient,
  organizationId: string,
  userId: string
): Promise<{ tier: PlanTier; maxHistoryDays: number }> {
  const { data: orgSub } = await supabaseAdmin
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: userSub } = await supabaseAdmin
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", userId)
    .is("organization_id", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const orgTier = resolveTier(orgSub);
  const userTier = resolveTier(userSub);
  const finalTier = orgTier === "pro" || userTier === "pro" ? "pro" : "free";
  const limits = limitsForTier(finalTier);
  return { tier: finalTier, maxHistoryDays: limits.maxHistoryDays };
}

export function enforceHistoryLimit(requestedDays: number, maxHistoryDays: number): number {
  if (requestedDays > maxHistoryDays) {
    throw new Error(`HISTORY_LIMIT_EXCEEDED: O limite de historico do plano foi excedido. (${maxHistoryDays} dias maximo)`);
  }
  return requestedDays;
}

export function enforcePremiumFeature(tier: PlanTier, featureName: string) {
  if (tier !== "pro") {
    throw new Error(`PLAN_REQUIRED: A funcionalidade ${featureName} e exclusiva do plano Pro.`);
  }
}
