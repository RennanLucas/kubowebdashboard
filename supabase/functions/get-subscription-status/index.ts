// Retorna o status consolidado da assinatura do usuário autenticado.
// Combina o registro mais recente de `subscriptions` com a definição do plano
// (de `_shared/plans.ts`), permitindo que o frontend saiba se o plano ainda
// está habilitado, próxima cobrança, trial e cancelamento agendado.

import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
// CORS vem do módulo compartilhado do projeto (allowlist de origens). Antes este
// arquivo importava `corsHeaders` de esm.sh/@supabase/supabase-js/cors, que
// devolve Access-Control-Allow-Origin: * — furava a allowlist e adicionava uma
// dependência de terceiros para algo que é configuração nossa.
import { corsHeaders } from "../_shared/cors.ts";
import { getPlan, listPlans } from "../_shared/plans.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";
import {
  computeIsActive,
  computeIsTrialing,
  computeNextChargeAt,
} from "./_subscription.ts";

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

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
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

    // Rate limiting por token (20 req/janela) — o frontend consulta este endpoint
    // em toda montagem de tela de billing.
    const rateCheck = checkRateLimit(token, 20, "user");
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck.resetAt, corsHeaders, 20);
    }

    const { data: claimsData, error: claimsError } = await supabase.auth
      .getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return json({ error: "Unauthorized" }, 401);
    }
    const userId = claimsData.claims.sub;
    const organizationId = req.headers.get("X-Organization-Id")?.trim() ?? "";
    if (!UUID_RE.test(organizationId)) {
      return json({ error: "Organização inválida ou ausente" }, 400);
    }

    // BL3 fix: verificar membership antes de expor dados de assinatura da organização.
    // O usuário só pode consultar assinaturas de organizações das quais é membro.
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Autoriza exatamente a organização ativa informada pelo cliente. Nunca
    // escolhe uma assinatura entre todas as organizações do usuário.
    const { data: membership, error: membershipError } = await supabaseAdmin
      .from("organization_members")
      .select("organization_id")
      .eq("user_id", userId)
      .eq("organization_id", organizationId)
      .maybeSingle();

    // Fail closed: erro de banco e ausência de membership nunca liberam acesso.
    if (membershipError) {
      console.error("[get-subscription-status] membership error", membershipError);
      return json({ error: "Falha ao validar acesso à organização" }, 500);
    }
    if (!membership) {
      return json({ error: "Forbidden" }, 403);
    }

    // Buscar somente a assinatura da organização ativa autorizada.
    let data: SubscriptionRow | null = null;
    let error: { message: string } | null = null;

    const { data: orgSub, error: orgErr } = await supabaseAdmin
      .from("subscriptions")
      .select(
        "id,status,plan_id,current_period_start,current_period_end,trial_end,cancel_at_period_end,environment,provider,amount,external_id,updated_at,created_at",
      )
      .eq("organization_id", organizationId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    data = orgSub as SubscriptionRow | null;
    error = orgErr;

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
    const now = Date.now();
    const isActive = computeIsActive(sub, now);
    const isTrialing = computeIsTrialing(sub, now);
    const willCancel = !!sub.cancel_at_period_end;

    const accessUntil = sub.current_period_end ?? null;
    const nextChargeAt = computeNextChargeAt(sub, isTrialing, willCancel);

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
    // Log detalhado no servidor, mensagem genérica para o cliente.
    console.error("[get-subscription-status] unexpected", e);
    return json({ error: "Erro inesperado" }, 500);
  }
});

