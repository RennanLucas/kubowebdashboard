import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "./useSubscription";
import { usePlanPreview } from "./usePlanPreview";
import { useIsAdmin } from "./useIsAdmin";
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
  maxProjects: number;
  maxHistoryDays: number;
  aiMonthlyLimit: number;
  loading: boolean;
  isPreview: boolean;
  can: (feature: FeatureKey) => boolean;
  requiredTierFor: (feature: FeatureKey) => PlanTier;
}

export function usePlan(enabled = true): PlanLimits {
  const { user } = useAuth();
  const { subscription, isActive, loading: subLoading } = useSubscription(enabled);
  const { preview } = usePlanPreview();
  const { isAdmin, loading: adminLoading } = useIsAdmin(enabled);

  const isPreview = preview !== null;

  let tier: PlanTier = "free";
  if (isActive) {
    tier = "pro";
  }
  if (isAdmin && !isPreview) {
    tier = "pro";
  }
  if (isPreview && preview) {
    tier = preview;
  }

  const caps = PLAN_CAPABILITIES[tier] || PLAN_CAPABILITIES.free;

  return {
    tier,
    label: caps.label,
    isFree: tier === "free",
    isPro: tier === "pro",
    maxProjects: caps.maxProjects,
    maxHistoryDays: caps.maxHistoryDays,
    aiMonthlyLimit: caps.aiMonthlyLimit,
    loading: (isAdmin || isPreview) ? false : (subLoading || adminLoading),
    isPreview,
    can: (feature: FeatureKey) => {
      if (isPreview) {
        return !!caps.features[feature];
      }
      return isAdmin || !!caps.features[feature];
    },
    requiredTierFor,
  };
}
