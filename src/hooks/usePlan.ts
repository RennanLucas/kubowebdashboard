import { useSubscription } from "./useSubscription";
import {
  PLAN_CAPABILITIES,
  type FeatureKey,
  type PlanTier,
  requiredTierFor,
} from "@/lib/plan-features";

export type { PlanTier, FeatureKey };

export interface PlanLimits {
  tier: PlanTier;
  label: string;
  isFree: boolean;
  isPro: boolean;
  isProPlus: boolean;
  maxProjects: number; // Infinity para ilimitado
  maxHistoryDays: number;
  aiMonthlyLimit: number;
  loading: boolean;
  /** true se o plano atual libera o recurso */
  can: (feature: FeatureKey) => boolean;
  /** menor plano que libera o recurso ("pro" | "pro_plus") */
  requiredTierFor: (feature: FeatureKey) => PlanTier;
}

export function usePlan(enabled = true): PlanLimits {
  const { subscription, isActive, loading } = useSubscription(enabled);
  const planId = (subscription as any)?.plan_id as string | undefined;

  let tier: PlanTier = "free";
  if (isActive) {
    tier = planId === "kuboweb_pro_plus_monthly" ? "pro_plus" : "pro";
  }

  const caps = PLAN_CAPABILITIES[tier];

  return {
    tier,
    label: caps.label,
    isFree: tier === "free",
    isPro: tier === "pro",
    isProPlus: tier === "pro_plus",
    maxProjects: caps.maxProjects,
    maxHistoryDays: caps.maxHistoryDays,
    aiMonthlyLimit: caps.aiMonthlyLimit,
    loading,
    can: (feature: FeatureKey) => caps.features[feature],
    requiredTierFor,
  };
}
