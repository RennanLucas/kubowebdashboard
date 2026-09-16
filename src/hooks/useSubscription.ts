import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { isSubscriptionValid } from "@/lib/subscription-validity";
import { getPaymentEnvironment } from "@/lib/payment-environment";

export interface SubscriptionRow {
  id: string;
  status: string;
  current_period_end: string | null;
  trial_end: string | null;
  cancel_at_period_end: boolean;
  product_id: string | null;
  price_id: string | null;
  environment: string;
  organization_id: string | null;
  user_id: string;
}

export function useSubscription(enabled = true) {
  const { user, loading: authLoading } = useAuth();
  const { activeOrganization, loading: orgLoading } = useOrganization();
  const userId = user?.id;
  const orgId = activeOrganization?.id;
  const paymentEnvironment = getPaymentEnvironment();

  const isReady = enabled && !authLoading && !orgLoading && !!userId;

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["subscription", userId, orgId, paymentEnvironment],
    enabled: isReady,
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: async () => {
      let orgSub = null;
      
      // 1. Fetch organization subscription
      if (orgId) {
        const { data, error } = await supabase
          .from("subscriptions" as any)
          .select("*")
          .eq("organization_id", orgId)
          .eq("environment", paymentEnvironment)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        if (error) throw error;
        orgSub = data;
      }

      // 2. Fetch ambiguous legacy subscriptions (Scenario C)
      const { data: ambiguousData, error: ambiguousError } = await supabase
        .from("subscriptions" as any)
        .select("*")
        .eq("user_id", userId!)
        .is("organization_id", null)
        .eq("environment", paymentEnvironment)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (ambiguousError) throw ambiguousError;

      return {
        subscription: (orgSub as any) ?? null,
        ambiguousSubscription: (ambiguousData as any) ?? null,
      };
    },
  });

  const subscription = data?.subscription ?? null;
  const ambiguousSubscription = data?.ambiguousSubscription ?? null;

  // Se a requisição não estiver pronta (auth/org loading) ou o React Query estiver carregando, tratamos como loading.
  const loading = (enabled && (authLoading || orgLoading)) || isLoading;

  useEffect(() => {
    if (!isReady) return;

    // Subscribe to both user and org channels if they exist
    const channel1 = orgId
      ? supabase
          .channel(`subscriptions-org-${orgId}-${Math.random().toString(36).slice(2)}`)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "subscriptions", filter: `organization_id=eq.${orgId}` },
            () => refetch(),
          )
          .subscribe()
      : null;

    const channel2 = userId
      ? supabase
          .channel(`subscriptions-user-${userId}-${Math.random().toString(36).slice(2)}`)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${userId}` },
            () => refetch(),
          )
          .subscribe()
      : null;

    return () => {
      if (channel1) supabase.removeChannel(channel1);
      if (channel2) supabase.removeChannel(channel2);
    };
  }, [isReady, orgId, userId, refetch]);

  const isActive =
    isSubscriptionValid(subscription) || isSubscriptionValid(ambiguousSubscription);

  return {
    subscription,
    ambiguousSubscription,
    loading,
    isActive,
    error: isError ? error : null,
    refresh: refetch,
  };
}
