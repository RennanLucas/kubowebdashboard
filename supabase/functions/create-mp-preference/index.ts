// Cria checkout do Mercado Pago: preapproval recorrente para os planos KUBOWEB.
// Usa a definição compartilhada em _shared/plans.ts — desabilitar um plano lá
// automaticamente bloqueia novos checkouts dele.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getPlan, type PlanId } from "../_shared/plans.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";

const MP_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN") || Deno.env.get("MP_ACCESS_TOKEN");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON = Deno.env.get("SUPABASE_ANON_KEY")!;
const SUPABASE_SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const token = authHeader.replace("Bearer ", "").trim();

    // Rate limiting: 10 req/min por usuário
    const rateCheck = checkRateLimit(token, 10, "user");
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck.resetAt, corsHeaders, 10);
    }

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

    const body = await req.json().catch(() => ({}));
    const planId = body.planId as PlanId | undefined;
    const returnUrl = (body.returnUrl as string | undefined) ?? "";
    const organizationId = body.organizationId as string | undefined;

    if (!organizationId) {
      return json({ error: "organizationId is required" }, 400);
    }

    // Consulta de papel da organização via admin para isolamento consistente
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE || SUPABASE_ANON);
    const { data: memberData, error: memberErr } = await admin
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", userId)
      .single();

    if (memberErr || !memberData || !["owner", "admin"].includes(memberData.role)) {
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
    if (!MP_TOKEN) {
      return json({ error: "Integração do Mercado Pago não configurada (token ausente)." }, 503);
    }

    const origin = req.headers.get("origin") || "";
    let baseReturn = "https://kubowebdashboard.vercel.app/checkout/return";
    if (returnUrl) {
      try {
        const parsed = new URL(returnUrl);
        if (
          parsed.origin === origin ||
          parsed.hostname.includes("kubowebdashboard") ||
          parsed.hostname === "localhost"
        ) {
          baseReturn = returnUrl;
        }
      } catch {
        /* invalid URL — use default */
      }
    }

    // Assinatura recorrente (cartão) com 7 dias grátis
    const payload: Record<string, unknown> = {
      reason: plan.reason,
      external_reference: `v2|org:${organizationId}|plan:${planId}|user:${userId}`,
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

    let res = await fetch("https://api.mercadopago.com/preapproval", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    let data = await res.json();

    // Se o Mercado Pago reclamar que o comprador é o mesmo que o vendedor (ou erro de payer_email), tenta sem payer_email
    if (!res.ok) {
      const errStr = JSON.stringify(data).toLowerCase();
      if (payload.payer_email && (errStr.includes("payer_email") || errStr.includes("collector") || errStr.includes("same"))) {
        console.warn("Mercado Pago rejeitou payer_email (possível conta do vendedor). Retentando checkout genérico...");
        delete payload.payer_email;
        res = await fetch("https://api.mercadopago.com/preapproval", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${MP_TOKEN}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });
        data = await res.json();
      }
    }

    if (!res.ok) {
      console.error("MP preapproval error:", data);
      const detailMsg =
        data?.message ||
        (Array.isArray(data?.cause)
          ? data.cause.map((c: any) => c.description || c.code).join(", ")
          : null) ||
        "Falha ao criar assinatura no Mercado Pago";
      return json({ error: detailMsg, details: data }, 502);
    }

    return json({ url: data.init_point, id: data.id });
  } catch (e) {
    console.error("create-mp-preference error:", e);
    return json({ error: (e as Error).message || "Erro interno" }, 500);
  }
});

