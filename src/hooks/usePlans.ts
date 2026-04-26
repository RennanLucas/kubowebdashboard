import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Plan {
  id: string;
  name: string;
  tagline: string;
  price: string;
  cadence: string;
  amount: number;
  currency: string;
  highlight: string;
  cta: string;
  features: string[];
  recommended: boolean;
  enabled: boolean;
  disabledReason: string | null;
}

interface State {
  plans: Plan[];
  loading: boolean;
  error: string | null;
}

let cache: Plan[] | null = null;
let inflight: Promise<Plan[]> | null = null;

async function fetchPlans(): Promise<Plan[]> {
  if (cache) return cache;
  if (inflight) return inflight;
  inflight = (async () => {
    const { data, error } = await supabase.functions.invoke("list-plans", {
      method: "GET",
    });
    if (error) throw new Error(error.message);
    const plans = ((data as any)?.plans ?? []) as Plan[];
    cache = plans;
    return plans;
  })().finally(() => {
    inflight = null;
  });
  return inflight;
}

export function usePlans(): State {
  const [state, setState] = useState<State>(() => ({
    plans: cache ?? [],
    loading: !cache,
    error: null,
  }));

  useEffect(() => {
    if (cache) return;
    let cancelled = false;
    fetchPlans()
      .then((plans) => {
        if (!cancelled) setState({ plans, loading: false, error: null });
      })
      .catch((e: Error) => {
        if (!cancelled) {
          setState({ plans: [], loading: false, error: e.message || "Falha ao carregar planos" });
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
