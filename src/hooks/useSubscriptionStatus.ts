import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

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
  const [status, setStatus] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState<string | null>(null);

  const fetchStatus = useCallback(async () => {
    if (!enabled || authLoading || !user) {
      setStatus(null);
      setLoading(enabled && authLoading);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke(
        "get-subscription-status",
        { method: "GET" },
      );
      if (fnError) throw new Error(fnError.message);
      if ((data as any)?.error) throw new Error((data as any).error);
      setStatus(data as SubscriptionStatus);
    } catch (e) {
      setError((e as Error).message || "Falha ao carregar assinatura");
      setStatus(null);
    } finally {
      setLoading(false);
    }
  }, [enabled, authLoading, user]);

  useEffect(() => {
    if (!enabled) {
      setStatus(null);
      setLoading(false);
      return;
    }
    if (authLoading) {
      setLoading(true);
      return;
    }
    fetchStatus();
    if (!user) return;

    // Realtime: re-busca quando a row do usuário muda (webhook MP, cancelamento, etc).
    const channel = supabase
      .channel(`sub-status-${user.id}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subscriptions",
          filter: `user_id=eq.${user.id}`,
        },
        () => fetchStatus(),
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [enabled, authLoading, user?.id, fetchStatus]);

  return { status, loading, error, refresh: fetchStatus };
}
