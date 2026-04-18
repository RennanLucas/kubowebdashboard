// Cria checkout do Mercado Pago: preferência (anual à vista) ou preapproval (mensal recorrente)
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MP_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

const PLANS = {
  kuboweb_pro_monthly: {
    type: "preapproval" as const,
    reason: "KUBOWEB Pro - Mensal",
    amount: 29.99,
    frequency: 1,
    frequency_type: "months",
    free_trial: { frequency: 7, frequency_type: "days" },
  },
  kuboweb_pro_yearly: {
    type: "preference" as const,
    title: "KUBOWEB Pro - Anual (12 meses)",
    amount: 392.99,
  },
} as const;

type PlanId = keyof typeof PLANS;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims) return json({ error: "Unauthorized" }, 401);

    const userId = claims.claims.sub as string;
    const email = (claims.claims.email as string | undefined) ?? undefined;

    const body = await req.json().catch(() => ({}));
    const planId = body.planId as PlanId | undefined;
    const returnUrl = (body.returnUrl as string | undefined) ?? "";
    if (!planId || !PLANS[planId]) return json({ error: "Invalid planId" }, 400);

    const plan = PLANS[planId];
    const baseReturn = returnUrl || `${new URL(req.url).origin}/checkout/return`;
    const webhookUrl = `${SUPABASE_URL}/functions/v1/mp-webhook`;

    if (plan.type === "preapproval") {
      // Assinatura recorrente (cartão) com 7 dias grátis
      const payload = {
        reason: plan.reason,
        external_reference: `${userId}|${planId}`,
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
    }

    // Pagamento único (anual) — Checkout Pro
    // NÃO enviamos payer.email aqui: o MP rejeita quando o email do pagador
    // é o mesmo da conta dona do token, ou quando é um email sem conta MP.
    // Deixamos o comprador preencher no próprio checkout.
    const payload = {
      items: [
        {
          title: plan.title,
          quantity: 1,
          unit_price: plan.amount,
          currency_id: "BRL",
        },
      ],
      external_reference: `${userId}|${planId}`,
      back_urls: {
        success: baseReturn,
        failure: baseReturn,
        pending: baseReturn,
      },
      auto_return: "approved",
      notification_url: webhookUrl,
      metadata: { user_id: userId, plan_id: planId, payer_email: email },
    };
    const res = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${MP_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      console.error("MP preference error:", data);
      return json({ error: data.message || "Falha ao criar preferência", details: data }, 500);
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
