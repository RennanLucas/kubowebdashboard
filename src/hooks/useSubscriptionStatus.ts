import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { toCustomerNetworkMessage, withTransientNetworkRetry } from "@/lib/network-retry";

export interface SubscriptionStatusPlan {
  id: string;
  name: string;
  price: string;
  cadence: string;
  amount: number;
  currency: string;
  enabled: boolean;
  disabledReason: string | null;
  highlight: string;
}

export interface SubscriptionStatusRow {
  id: string;
  status: string;
  plan_id: string | null;
  environment: string;
  provider: string;
  amount: number | null;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_end: string | null;
  cancel_at_period_end: boolean;
  external_id: string | null;
  updated_at: string | null;
}

export interface SubscriptionStatus {
  hasSubscription: boolean;
  subscription: SubscriptionStatusRow | null;
  plan: SubscriptionStatusPlan | null;
  isActive: boolean;
  isTrialing: boolean;
  willCancel: boolean;
  nextChargeAt: string | null;
  accessUntil: string | null;
  availablePlans: { id: string; name: string; price: string; cadence: string; enabled: boolean }[];
}

export function useSubscriptionStatus(enabled = true) {
  const { user, loading: authLoading } = useAuth();
  const { activeOrganization, loading: orgLoading } = useOrganization();
  const organizationId = activeOrganization?.id;
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!enabled || authLoading || orgLoading || !user || !organizationId) {
      setStatus(null);
      setLoading(enabled && (authLoading || orgLoading));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await withTransientNetworkRetry(async () => {
        const { data: responseData, error: fnError } = await supabase.functions.invoke(
          "get-subscription-status",
          { method: "GET", headers: { "X-Organization-Id": organizationId } },
        );
        if (fnError) throw new Error(fnError.message);
        if ((responseData as any)?.error) throw new Error((responseData as any).error);
        return responseData;
      });
      setStatus(data as SubscriptionStatus);
    } catch (e) {
      setError(toCustomerNetworkMessage(e, "Falha ao carregar assinatura"));
      // Deliberately keep the last known good status. This hook feeds the
      // billing page, which renders a null subscription as "you have no
      // active plan" next to a buy button — so nulling out on a transient
      // Edge Function error invites a paying customer into a second charge.
      // Callers must gate on `error`, not infer absence from a null status.
    } finally {
      setLoading(false);
    }
  }, [enabled, authLoading, orgLoading, user, organizationId]);

  useEffect(() => {
    if (!enabled) {
      setStatus(null);
      setLoading(false);
      return;
    }
    if (authLoading || orgLoading) {
      setLoading(true);
      return;
    }
    fetchStatus();
    if (!user || !organizationId) return;

    // Realtime: re-busca quando a row do usuário muda (webhook MP, cancelamento, etc).
    const channel = supabase
      .channel(`sub-status-${organizationId}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subscriptions",
          filter: `organization_id=eq.${organizationId}`,
        },
        () => fetchStatus(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, authLoading, orgLoading, user?.id, organizationId, fetchStatus]);

  return { status, loading, error, refresh: fetchStatus };
}
