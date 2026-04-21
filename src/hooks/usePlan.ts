import { useSubscription } from "./useSubscription";

export type PlanTier = "pro" | "pro_plus";

export interface PlanLimits {
  tier: PlanTier;
  isProPlus: boolean;
  maxProjects: number; // Infinity para ilimitado
  maxHistoryDays: number;
  aiMonthlyLimit: number;
  loading: boolean;
}

export function usePlan(enabled = true): PlanLimits {
  const { subscription, loading } = useSubscription(enabled);
  const planId = (subscription as any)?.plan_id as string | undefined;
  const isProPlus = planId === "kuboweb_pro_plus_monthly";

  return {
    tier: isProPlus ? "pro_plus" : "pro",
    isProPlus,
    maxProjects: isProPlus ? Number.POSITIVE_INFINITY : 3,
    maxHistoryDays: isProPlus ? 365 : 90,
    aiMonthlyLimit: isProPlus ? 6 : 3,
    loading,
  };
}
