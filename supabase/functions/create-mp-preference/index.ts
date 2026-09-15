// Cria checkout do Mercado Pago: preapproval recorrente para os planos KUBOWEB.
// Usa a definição compartilhada em _shared/plans.ts — desabilitar um plano lá
// automaticamente bloqueia novos checkouts dele.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { getPlan, type PlanId } from "../_shared/plans.ts";
import { checkoutReturnUrl } from "../_shared/origins.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { rateLimitResponse } from "../_shared/rate-limit.ts";
import { checkSharedRateLimit } from "../_shared/shared-rate-limit.ts";
import { errorResponse } from "../_shared/plan-gate.ts";
import { getMpConfig } from "../_shared/mp-config.ts";
import { createExternalReference } from "../mp-webhook/_billing.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const mpConfig = getMpConfig((name) => Deno.env.get(name));
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const token = authHeader.replace("Bearer ", "").trim();

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
      global: { headers: { Authorization: authHeader } },
    });

    let userId: string | undefined;
    let email: string | undefined;

    try {
      const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
      if (!claimsErr && claims?.claims?.sub) {
        userId = claims.claims.sub as string;
        email = (claims.claims.email as string | undefined) ?? undefined;
      }
    } catch {
      // fallback para getUser abaixo
    }

    if (!userId) {
      const { data: userData, error: userErr } = await supabase.auth.getUser(token);
      if (!userErr && userData?.user?.id) {
        userId = userData.user.id;
        email = userData.user.email ?? undefined;
      }
    }

    if (!userId) {
      return json({ error: "Sua sessão expirou. Entre novamente para continuar." }, 401);
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE);
    const rateCheck = await checkSharedRateLimit(admin, "create-mp-preference", userId, 10);
    if (!rateCheck.allowed) return rateLimitResponse(rateCheck.resetAt, corsHeaders, 10);

    const body = await req.json().catch(() => ({}));
    const planId = body.planId as PlanId | undefined;
    const returnUrl = (body.returnUrl as string | undefined) ?? "";
    const organizationId = body.organizationId as string | undefined;

    if (!organizationId) {
      return json({ error: "organizationId is required" }, 400);
    }

    // Consulta de papel da organização via admin para isolamento consistente
    const { data: memberData, error: memberErr } = await admin
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .single();

    if (memberErr || !memberData || !["owner", "admin"].includes(memberData.role)) {
      return json({ error: "Acesso negado para gerenciar faturamento desta organização" }, 403);
    }

    // A double click or a repeated checkout must not create a second paid
    // agreement while this organization already has access in this universe.
    const { data: currentSubscription, error: currentSubscriptionError } = await admin
      .from("subscriptions")
      .select("status,current_period_end")
      .eq("organization_id", organizationId)
      .eq("environment", mpConfig.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (currentSubscriptionError) throw currentSubscriptionError;
    const { data: legacySubscription, error: legacySubscriptionError } = await admin
      .from("subscriptions")
      .select("status,current_period_end")
      .eq("user_id", userId)
      .is("organization_id", null)
      .eq("environment", mpConfig.environment)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (legacySubscriptionError) throw legacySubscriptionError;
    const effectiveSubscription = currentSubscription ?? legacySubscription;
    const currentPeriodEnd = effectiveSubscription?.current_period_end
      ? Date.parse(effectiveSubscription.current_period_end)
      : Number.NaN;
    if (effectiveSubscription &&
      ["active", "trialing", "authorized", "approved", "canceled", "cancelled"].includes(effectiveSubscription.status) &&
      Number.isFinite(currentPeriodEnd) && currentPeriodEnd > Date.now()) {
      return json({ error: "Esta organização já possui uma assinatura ativa neste ambiente." }, 409);
    }

    const plan = planId ? getPlan(planId) : null;
    if (!plan) return json({ error: "Invalid planId" }, 400);
    if (!plan.enabled) {
      return json(
        { error: plan.disabledReason || "Este plano não está disponível no momento." },
        409,
      );
    }
    if (!mpConfig.token || !mpConfig.secret) {
      return json({ error: "Integração de pagamento indisponível neste ambiente." }, 503);
    }

    const baseReturn = checkoutReturnUrl(returnUrl, Deno.env.get("ALLOWED_ORIGIN"));

    // Assinatura recorrente (cartão) com 7 dias grátis
    const payload: Record<string, unknown> = {
      reason: String(plan.reason || "KUBOWEB Pro").slice(0, 60),
      external_reference: createExternalReference({
        environment: mpConfig.environment,
        organizationId,
        planId: plan.id,
        userId,
      }),
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

    if (email) {
      payload.payer_email = email;
    }

    const res = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${mpConfig.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15000),
    });

    const data = await res.json().catch(() => null);
    if (!res.ok) {
      console.error("MP preapproval rejected", { status: res.status });
      return json({ error: "Não foi possível iniciar a assinatura. Tente novamente ou entre em contato com o suporte." }, 502);
    }

    const checkoutUrl = data?.init_point;
    if (typeof checkoutUrl !== "string" || !/^https:\/\/www\.mercadopago\.com(?:\.br)?\//i.test(checkoutUrl)) {
      console.error("MP preapproval returned no trusted checkout URL");
      return json({ error: "O provedor não retornou uma página de pagamento válida." }, 502);
    }

    return json({ url: checkoutUrl, id: data.id, environment: mpConfig.environment });
  } catch (e) {
    console.error("create-mp-preference error:", e);
    return errorResponse(e, corsHeaders, "create-mp-preference");
  }
});

