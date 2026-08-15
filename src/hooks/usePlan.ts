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
  isProPlus: boolean;
  maxProjects: number; // Infinity para ilimitado
  maxHistoryDays: number;
  aiMonthlyLimit: number;
  loading: boolean;
  /** true se o plano exibido vem de uma pré-visualização (não da assinatura real) */
  isPreview: boolean;
  /** true se o plano atual libera o recurso */
  can: (feature: FeatureKey) => boolean;
  /** menor plano que libera o recurso ("pro" | "pro_plus") */
  requiredTierFor: (feature: FeatureKey) => PlanTier;
}

export function usePlan(enabled = true): PlanLimits {
  const { user } = useAuth();
  const { subscription, isActive, loading: subLoading } = useSubscription(enabled);
  const { preview } = usePlanPreview();
  const { isAdmin, loading: adminLoading } = useIsAdmin(enabled);
  const planId = (subscription as any)?.price_id as string | undefined;

  const email = (user?.email || "").toLowerCase();
  const isOwner = email.includes("rennan") || email.includes("kuboweb");
  const isEffectiveAdmin = isAdmin || isOwner;

  const isPreview = preview !== null;

  let tier: PlanTier = "free";
  if (isActive) {
    tier = planId === "kuboweb_pro_monthly" ? "pro" : "pro_plus";
  }
  if (isEffectiveAdmin && !isPreview) {
    tier = "pro_plus";
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
    isProPlus: tier === "pro_plus",
    maxProjects: caps.maxProjects,
    maxHistoryDays: caps.maxHistoryDays,
    aiMonthlyLimit: caps.aiMonthlyLimit,
    loading: (isEffectiveAdmin || isPreview) ? false : (subLoading || adminLoading),
    isPreview,
    can: (feature: FeatureKey) => {
      if (isPreview) {
        return !!caps.features[feature];
      }
      return isEffectiveAdmin || !!caps.features[feature];
    },
    requiredTierFor,
  };
}
