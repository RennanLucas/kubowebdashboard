import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export interface SubscriptionRow {
  id: string;
  status: string;
  current_period_end: string | null;
  trial_end: string | null;
  cancel_at_period_end: boolean;
  product_id: string | null;
  price_id: string | null;
  environment: string;
}

export function useSubscription(enabled = true) {
  const { user, loading: authLoading } = useAuth();
  const [subscription, setSubscription] = useState<SubscriptionRow | null>(null);
  const [loading, setLoading] = useState(enabled);

  const fetchSub = async () => {
    if (!enabled || authLoading || !user) {
      setSubscription(null);
      setLoading(enabled && authLoading);
      return;
    }
    setLoading(true);
    try {
      const { data } = await supabase
        .from("subscriptions" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      setSubscription((data as any) ?? null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!enabled) {
      setSubscription(null);
      setLoading(false);
      return;
    }
    if (authLoading) {
      setLoading(true);
      return;
    }
    fetchSub();
    if (!user) return;
    const channel = supabase
      .channel(`subscriptions-${user.id}-${Math.random().toString(36).slice(2)}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "subscriptions", filter: `user_id=eq.${user.id}` },
        () => fetchSub(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, authLoading, user?.id]);

  const isActive = (() => {
    if (!subscription) return false;
    const okStatus = ["active", "trialing", "authorized", "approved"].includes(subscription.status);
    const periodOk = !subscription.current_period_end ||
      new Date(subscription.current_period_end) > new Date();
    if (okStatus && periodOk) return true;
    if (["canceled", "cancelled"].includes(subscription.status) && subscription.current_period_end &&
      new Date(subscription.current_period_end) > new Date()) return true;
    return false;
  })();

  return { subscription, loading, isActive, refresh: fetchSub };
}
