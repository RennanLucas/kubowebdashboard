import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";

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
  const orgId = activeOrganization?.id;

  const isReady = enabled && !authLoading && !orgLoading && !!user;

  const { data, isLoading, refetch } = useQuery({
    queryKey: ["subscription", user?.id, orgId],
    enabled: isReady,
    staleTime: 1000 * 60 * 5, // 5 minutes
    queryFn: async () => {
      let orgSub = null;
      
      // 1. Fetch organization subscription
      if (orgId) {
        const { data } = await supabase
          .from("subscriptions" as any)
          .select("*")
          .eq("organization_id", orgId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();
        orgSub = data;
      }

      // 2. Fetch ambiguous legacy subscriptions (Scenario C)
      const { data: ambiguousData } = await supabase
        .from("subscriptions" as any)
        .select("*")
        .eq("user_id", user!.id)
        .is("organization_id", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

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

    const channel2 = user
      ? supabase
          .channel(`subscriptions-user-${user.id}-${Math.random().toString(36).slice(2)}`)
          .on(
            "postgres_changes",
            { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${user.id}` },
            () => refetch(),
          )
          .subscribe()
      : null;

    return () => {
      if (channel1) supabase.removeChannel(channel1);
      if (channel2) supabase.removeChannel(channel2);
    };
  }, [isReady, orgId, user?.id, refetch]);

  const isActive = (() => {
    const subToCheck = subscription || ambiguousSubscription;
    if (!subToCheck) return false;
    const okStatus = ["active", "trialing", "authorized", "approved"].includes(subToCheck.status);
    const periodOk =
      !subToCheck.current_period_end || new Date(subToCheck.current_period_end) > new Date();
    if (okStatus && periodOk) return true;
    if (
      ["canceled", "cancelled"].includes(subToCheck.status) &&
      subToCheck.current_period_end &&
      new Date(subToCheck.current_period_end) > new Date()
    )
      return true;
    return false;
  })();

  return {
    subscription,
    ambiguousSubscription,
    loading,
    isActive,
    refresh: refetch,
  };
}
