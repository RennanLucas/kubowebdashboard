// Webhook do Mercado Pago: processa notificações de payment e preapproval
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

import { corsHeaders } from "../_shared/cors.ts";

const MP_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

const MP_WEBHOOK_SECRET =
  Deno.env.get("PAYMENTS_LIVE_WEBHOOK_SECRET") ||
  Deno.env.get("PAYMENTS_SANDBOX_WEBHOOK_SECRET") ||
  "";

// Valida a assinatura HMAC (x-signature) enviada pelo Mercado Pago.
// manifest: id:<data.id>;request-id:<x-request-id>;ts:<ts>;
async function verifyMpSignature(req: Request, dataId: string): Promise<boolean> {
  if (!MP_WEBHOOK_SECRET) {
    console.error("MP webhook secret não configurado — rejeitando requisição");
    return false;
  }

  const signature = req.headers.get("x-signature") ?? "";
  const requestId = req.headers.get("x-request-id") ?? "";
  if (!signature) return false;

  let ts = "";
  let v1 = "";
  for (const part of signature.split(",")) {
    const [k, v] = part.split("=").map((s) => s?.trim());
    if (k === "ts") ts = v ?? "";
    if (k === "v1") v1 = v ?? "";
  }
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(MP_WEBHOOK_SECRET),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(manifest));
  const expected = Array.from(new Uint8Array(sigBuf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return expected === v1.toLowerCase();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const queryType = url.searchParams.get("type") || url.searchParams.get("topic");
    const queryId = url.searchParams.get("id") || url.searchParams.get("data.id");

    let body: { type?: string; topic?: string; resource?: string; data?: { id?: string } } = {};
    try { body = await req.json(); } catch { /* GET ping */ }

    const type = body.type || body.topic || queryType;
    const dataId = body.data?.id || body.resource || queryId;

    console.log("MP webhook:", { type, dataId });

    if (!type || !dataId) {
      return new Response("ok", { status: 200, headers: corsHeaders });
    }

    // Rejeita qualquer notificação sem assinatura válida do Mercado Pago
    if (!(await verifyMpSignature(req, String(dataId)))) {
      console.warn("MP webhook: assinatura inválida");
      return new Response(JSON.stringify({ error: "invalid signature" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }


    if (type === "payment") {
      await handlePayment(String(dataId).replace(/\D/g, ""));
    } else if (type === "preapproval" || type === "subscription_preapproval") {
      await handlePreapproval(String(dataId));
    } else if (type === "subscription_authorized_payment") {
      // Pagamento recorrente bem-sucedido — atualiza período
      await handleAuthorizedPayment(String(dataId));
    }

    return new Response("ok", { status: 200, headers: corsHeaders });
  } catch (e) {
    console.error("mp-webhook error:", e);
    // Sempre 200 pra não causar retries infinitos
    return new Response("ok", { status: 200, headers: corsHeaders });
  }
});

async function mpFetch(path: string) {
  const res = await fetch(`https://api.mercadopago.com${path}`, {
    headers: { Authorization: `Bearer ${MP_TOKEN}` },
  });
  if (!res.ok) {
    console.error("MP fetch error:", path, await res.text());
    return null;
  }
  return res.json();
}

function parseExternalReference(extRef: string) {
  if (extRef.startsWith("v2|")) {
    const parts = extRef.split("|");
    let orgId, planId, userId;
    for (const p of parts) {
      if (p.startsWith("org:")) orgId = p.replace("org:", "");
      if (p.startsWith("plan:")) planId = p.replace("plan:", "");
      if (p.startsWith("user:")) userId = p.replace("user:", "");
    }
    return { organizationId: orgId, planId, userId };
  } else {
    const [userId, planId] = extRef.split("|");
    return { organizationId: undefined, planId, userId };
  }
}

async function getExistingSub(externalId: string) {
  const { data } = await admin
    .from("subscriptions")
    .select("id, organization_id, last_event_ts, status")
    .eq("external_id", externalId)
    .single();
  return data;
}

function isOutdated(eventDateStr: string | undefined, existingTsStr: string | null | undefined): boolean {
  if (!eventDateStr || !existingTsStr) return false;
  const eventTime = new Date(eventDateStr).getTime();
  const existingTime = new Date(existingTsStr).getTime();
  return eventTime <= existingTime;
}

async function handlePayment(paymentId: string) {
  const payment = await mpFetch(`/v1/payments/${paymentId}`);
  if (!payment) return;

  const extRef = payment.external_reference as string | undefined;
  if (!extRef) {
    console.warn("Payment without external_reference:", paymentId);
    return;
  }
  
  const { organizationId, planId, userId } = parseExternalReference(extRef);
  if (!userId || !planId) return;

  const status = payment.status as string; // approved, pending, rejected, refunded
  const isApproved = status === "approved";

  const eventTs = payment.date_last_updated || payment.date_created || new Date().toISOString();
  const existingSub = await getExistingSub(String(paymentId));

  if (isOutdated(eventTs, existingSub?.last_event_ts)) {
    console.log(`Payment ${paymentId} webhook ignored (outdated event)`);
    return;
  }

  const periodEnd = isApproved
    ? new Date(Date.now() + (planId.includes("yearly") ? 365 : 30) * 24 * 60 * 60 * 1000).toISOString()
    : null;

  // Se a subscrição já existe e tem org_id mas o payload é V1 (orgId undef), mantém o org_id atual.
  const finalOrgId = organizationId || existingSub?.organization_id || null;

  await admin.from("subscriptions").upsert(
    {
      id: existingSub?.id, // ajuda no upsert caso external_id tenha mudado (raro)
      user_id: userId,
      organization_id: finalOrgId,
      provider: "mercadopago",
      external_id: String(paymentId),
      plan_id: planId,
      status: isApproved ? "active" : (status === "rejected" ? "unpaid" : status),
      amount: payment.transaction_amount,
      payer_email: payment.payer?.email,
      current_period_start: payment.date_created || new Date().toISOString(),
      current_period_end: periodEnd,
      last_event_ts: eventTs,
      environment: "live",
      stripe_subscription_id: `mp_${paymentId}`,
      stripe_customer_id: `mp_${payment.payer?.id ?? userId}`,
      product_id: planId,
      price_id: planId,
    },
    { onConflict: "external_id" },
  );
}

async function handlePreapproval(preapprovalId: string) {
  const sub = await mpFetch(`/preapproval/${preapprovalId}`);
  if (!sub) return;

  const extRef = sub.external_reference as string | undefined;
  if (!extRef) return;
  
  const { organizationId, planId, userId } = parseExternalReference(extRef);
  if (!userId || !planId) return;

  const status = sub.status as string; // pending, authorized, paused, cancelled
  const nextPayment = sub.next_payment_date ? new Date(sub.next_payment_date).toISOString() : null;
  const trialEnd = sub.auto_recurring?.free_trial && sub.date_created
    ? new Date(new Date(sub.date_created).getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
    : null;

  const mappedStatus =
    status === "authorized" ? (trialEnd && new Date(trialEnd) > new Date() ? "trialing" : "active") :
    status === "cancelled" ? "canceled" :
    status === "paused" ? "paused" : status;

  const eventTs = sub.last_modified || sub.date_created || new Date().toISOString();
  const existingSub = await getExistingSub(preapprovalId);

  if (isOutdated(eventTs, existingSub?.last_event_ts)) {
    console.log(`Preapproval ${preapprovalId} webhook ignored (outdated event)`);
    return;
  }

  const finalOrgId = organizationId || existingSub?.organization_id || null;

  await admin.from("subscriptions").upsert(
    {
      id: existingSub?.id,
      user_id: userId,
      organization_id: finalOrgId,
      provider: "mercadopago",
      external_id: preapprovalId,
      plan_id: planId,
      status: mappedStatus,
      amount: sub.auto_recurring?.transaction_amount,
      payer_email: sub.payer_email,
      current_period_start: sub.date_created ? new Date(sub.date_created).toISOString() : new Date().toISOString(),
      current_period_end: nextPayment,
      trial_end: trialEnd,
      last_event_ts: eventTs,
      environment: "live",
      stripe_subscription_id: `mp_${preapprovalId}`,
      stripe_customer_id: `mp_${sub.payer_id ?? userId}`,
      product_id: planId,
      price_id: planId,
    },
    { onConflict: "external_id" },
  );
}

async function handleAuthorizedPayment(authPaymentId: string) {
  const auth = await mpFetch(`/authorized_payments/${authPaymentId}`);
  if (!auth?.preapproval_id) return;
  // Apenas delega para o preapproval que fará o sync correto baseado em data mais recente
  await handlePreapproval(String(auth.preapproval_id));
}

