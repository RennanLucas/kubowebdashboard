// Retorna o status consolidado da assinatura do usuário autenticado.
// Combina o registro mais recente de `subscriptions` com a definição do plano
// (de `_shared/plans.ts`), permitindo que o frontend saiba se o plano ainda
// está habilitado, próxima cobrança, trial e cancelamento agendado.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.95.0/cors";
import { getPlan, listPlans } from "../_shared/plans.ts";

interface SubscriptionRow {
  id: string;
  status: string;
  plan_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  trial_end: string | null;
  cancel_at_period_end: boolean | null;
  environment: string;
  provider: string;
  amount: number | null;
  external_id: string | null;
  updated_at: string | null;
  created_at: string | null;
}

const ACTIVE_STATUSES = ["active", "trialing", "authorized", "approved"];
const CANCELED_STATUSES = ["canceled", "cancelled"];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function computeIsActive(sub: SubscriptionRow): boolean {
  const periodOk = !sub.current_period_end ||
    new Date(sub.current_period_end) > new Date();
  if (ACTIVE_STATUSES.includes(sub.status) && periodOk) return true;
  if (
    CANCELED_STATUSES.includes(sub.status) && sub.current_period_end &&
    new Date(sub.current_period_end) > new Date()
  ) return true;
  return false;
}

function computeIsTrialing(sub: SubscriptionRow): boolean {
  if (sub.status === "trialing") return true;
  if (sub.trial_end && new Date(sub.trial_end) > new Date()) return true;
  return false;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth
      .getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userId = claimsData.claims.sub;

    const { data, error } = await supabase
      .from("subscriptions")
      .select(
        "id,status,plan_id,current_period_start,current_period_end,trial_end,cancel_at_period_end,environment,provider,amount,external_id,updated_at,created_at",
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("[get-subscription-status] db error", error);
      return json({ error: "Falha ao consultar assinatura" }, 500);
    }

    const availablePlans = listPlans()
      .filter((p) => p.enabled)
      .map((p) => ({
        id: p.id,
        name: p.name,
        price: p.price,
        cadence: p.cadence,
        enabled: p.enabled,
        disabledReason: p.disabledReason ?? null,
      }));

    if (!data) {
      return json({
        hasSubscription: false,
        subscription: null,
        plan: null,
        isActive: false,
        isTrialing: false,
        willCancel: false,
        nextChargeAt: null,
        accessUntil: null,
        availablePlans,
      });
    }

    const sub = data as SubscriptionRow;
    const planDef = sub.plan_id ? getPlan(sub.plan_id) : null;
    const isActive = computeIsActive(sub);
    const isTrialing = computeIsTrialing(sub);
    const willCancel = !!sub.cancel_at_period_end;

    const accessUntil = sub.current_period_end ?? null;
    const nextChargeAt = willCancel
      ? null
      : (isTrialing ? (sub.trial_end ?? sub.current_period_end) : sub.current_period_end);

    return json({
      hasSubscription: true,
      subscription: {
        id: sub.id,
        status: sub.status,
        plan_id: sub.plan_id,
        environment: sub.environment,
        provider: sub.provider,
        amount: sub.amount,
        current_period_start: sub.current_period_start,
        current_period_end: sub.current_period_end,
        trial_end: sub.trial_end,
        cancel_at_period_end: !!sub.cancel_at_period_end,
        external_id: sub.external_id,
        updated_at: sub.updated_at,
      },
      plan: planDef
        ? {
          id: planDef.id,
          name: planDef.name,
          price: planDef.price,
          cadence: planDef.cadence,
          amount: planDef.amount,
          currency: planDef.currency,
          enabled: planDef.enabled,
          disabledReason: planDef.disabledReason ?? null,
          highlight: planDef.highlight,
        }
        : (sub.plan_id
          ? {
            id: sub.plan_id,
            name: sub.plan_id,
            price: "—",
            cadence: "",
            amount: sub.amount ?? 0,
            currency: "BRL",
            enabled: false,
            disabledReason: "Plano não está mais disponível",
            highlight: "",
          }
          : null),
      isActive,
      isTrialing,
      willCancel,
      nextChargeAt,
      accessUntil,
      availablePlans,
    });
  } catch (e) {
    console.error("[get-subscription-status] unexpected", e);
    return json({ error: (e as Error).message ?? "Erro inesperado" }, 500);
  }
});

