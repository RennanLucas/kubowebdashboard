// Cria checkout do Mercado Pago: preapproval recorrente para os planos KUBOWEB.
// Usa a definição compartilhada em _shared/plans.ts — desabilitar um plano lá
// automaticamente bloqueia novos checkouts dele.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getPlan, type PlanId } from "../_shared/plans.ts";

import { corsHeaders } from "../_shared/cors.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";

const MP_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");

    // Rate limiting: 5 req/min por usuário (evita abuse de checkout)
    const rateCheck = checkRateLimit(token, 5, "user");
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck.resetAt, corsHeaders);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims) return json({ error: "Unauthorized" }, 401);

    const userId = claims.claims.sub as string;
    const email = (claims.claims.email as string | undefined) ?? undefined;

    const body = await req.json().catch(() => ({}));
    const planId = body.planId as PlanId | undefined;
    const returnUrl = (body.returnUrl as string | undefined) ?? "";
    const organizationId = body.organizationId as string | undefined;

    if (!organizationId) {
      return json({ error: "organizationId is required" }, 400);
    }

    const { data: memberData, error: memberErr } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .single();

    if (memberErr || !memberData || !['owner', 'admin'].includes(memberData.role)) {
      return json({ error: "Acesso negado para gerenciar faturamento desta organização" }, 403);
    }

    const plan = planId ? getPlan(planId) : null;
    if (!plan) return json({ error: "Invalid planId" }, 400);
    if (!plan.enabled) {
      return json(
        { error: plan.disabledReason || "Este plano não está disponível no momento." },
        409,
      );
    }

    const ALLOWED_RETURN_ORIGINS = [
      new URL(req.url).origin,
      Deno.env.get("PUBLIC_SITE_URL"),
    ].filter(Boolean) as string[];

    let baseReturn = `${new URL(req.url).origin}/checkout/return`;
    if (returnUrl) {
      try {
        const parsed = new URL(returnUrl);
        if (ALLOWED_RETURN_ORIGINS.some((o) => parsed.origin === o)) {
          baseReturn = returnUrl;
        }
      } catch { /* invalid URL — use default */ }
    }

    // Assinatura recorrente (cartão) com 7 dias grátis
    const payload = {
      reason: plan.reason,
      external_reference: `v2|org:${organizationId}|plan:${planId}|user:${userId}`,
      payer_email: email,
      back_url: baseReturn,
      auto_recurring: {
        frequency: plan.frequency,
        frequency_type: plan.frequency_type,
        transaction_amount: plan.amount,
        currency_id: "BRL",
        free_trial: plan.free_trial,
      },
      status: "pending",
    };
    const res = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("MP preapproval error:", data);
      return json({ error: data.message || "Falha ao criar assinatura", details: data }, 500);
    }
    return json({ url: data.init_point, id: data.id });
  } catch (e) {
    console.error("create-mp-preference error:", e);
    return json({ error: (e as Error).message }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

