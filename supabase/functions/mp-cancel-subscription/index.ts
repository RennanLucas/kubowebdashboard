// Cancela uma assinatura recorrente do Mercado Pago no fim do período atual.
// Marca cancel_at_period_end=true localmente e atualiza o preapproval no MP para status="cancelled".
// O usuário mantém acesso até current_period_end (validado por has_active_subscription).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

import { getCorsHeaders } from "../_shared/cors.ts";
import { rateLimitResponse } from "../_shared/rate-limit.ts";
import { checkSharedRateLimit } from "../_shared/shared-rate-limit.ts";
import { errorResponse } from "../_shared/plan-gate.ts";
import { getMpConfig } from "../_shared/mp-config.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }



  try {
    const mpConfig = getMpConfig((name) => Deno.env.get(name));
    if (!mpConfig.token) {
      return json({ error: "Integração de pagamento indisponível neste ambiente." }, 503);
    }
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace("Bearer ", "").trim();
    if (!token) {
      return json({ error: "Não autenticado" }, 401);
    }

    // Identifica o usuário a partir do JWT
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: `Bearer ${token}` } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Não autenticado" }, 401);

    const userId = userData.user.id;
    const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
    const rateCheck = await checkSharedRateLimit(admin,"mp-cancel-subscription",userId,5);
    if (!rateCheck.allowed) return rateLimitResponse(rateCheck.resetAt,corsHeaders,5);

    const body = await req.json().catch(() => ({}));
    const organizationId = body.organizationId as string | undefined;

    if (!organizationId) {
      return json({ error: "organizationId is required" }, 400);
    }

    const { data: memberData, error: memberErr } = await admin
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .single();

    if (memberErr || !memberData || !['owner', 'admin'].includes(memberData.role)) {
      return json({ error: "Acesso negado para gerenciar faturamento desta organização" }, 403);
    }

    // Busca a assinatura ativa mais recente dessa ORG
    const { data: orgSubscription, error: orgSubscriptionError } = await admin
      .from("subscriptions")
      .select("id,external_id,provider,environment,current_period_end,cancel_at_period_end")
      .eq("organization_id", organizationId)
      .eq("environment", mpConfig.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (orgSubscriptionError) throw orgSubscriptionError;
    let sub = orgSubscription;
    if (!sub) {
      const { data: legacySubscription, error: legacyError } = await admin
        .from("subscriptions")
        .select("id,external_id,provider,environment,current_period_end,cancel_at_period_end")
        .eq("user_id", userId)
        .is("organization_id", null)
        .eq("environment", mpConfig.environment)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (legacyError) throw legacyError;
      sub = legacySubscription;
    }

    if (!sub) return json({ error: "Nenhuma assinatura encontrada para a organização" }, 404);

    if (sub.cancel_at_period_end) {
      return json({ success: true, mpUpdated: true, accessUntil: sub.current_period_end });
    }

    const preapprovalId = sub.external_id as string | null;
    if (sub.provider !== "mercadopago" || !preapprovalId || !/^[A-Za-z0-9_-]{1,128}$/.test(preapprovalId)) {
      return json({ error: "Esta assinatura não pode ser cancelada por este fluxo." }, 409);
    }

    const res = await fetch(`https://api.mercadopago.com/preapproval/${encodeURIComponent(preapprovalId)}`, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${mpConfig.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "cancelled" }),
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) {
      console.error("MP cancel rejected", { status: res.status });
      return json({ error: "O Mercado Pago não confirmou o cancelamento. Nenhuma alteração foi feita; tente novamente." }, 502);
    }

    // Somente confirma localmente depois da confirmação do provedor.
    const { error: updateError } = await admin
      .from("subscriptions")
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sub.id);
    if (updateError) throw updateError;

    return json({ success: true, mpUpdated: true, accessUntil: sub.current_period_end });
  } catch (e) {
    console.error("mp-cancel-subscription error:", e);
    return errorResponse(e,corsHeaders,"mp-cancel-subscription");
  }
});


