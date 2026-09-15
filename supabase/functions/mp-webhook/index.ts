// Webhook do Mercado Pago: processa notificações de payment e preapproval
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

import { corsHeaders } from "../_shared/cors.ts";
import { rateLimitResponse } from "../_shared/rate-limit.ts";
import { checkSharedRateLimit } from "../_shared/shared-rate-limit.ts";
import { getMpConfig } from "../_shared/mp-config.ts";
import { verifyMpSignature } from "./_signature.ts";
import {
  parseExternalReference,
  isReferenceEnvironmentAllowed,
  isOutdated,
  mapPaymentStatus,
  mapPreapprovalStatus,
  computePeriodEnd,
  computeTrialEnd,
} from "./_billing.ts";
import { getPlan } from "../_shared/plans.ts";

const mpConfig = () => getMpConfig(name => Deno.env.get(name));
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = createClient(SUPABASE_URL, SERVICE_ROLE);

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return new Response("Method not allowed", { status:405, headers:corsHeaders });

  try {
    const configuration = mpConfig();
    if (!configuration.token || !configuration.secret) return new Response("Service unavailable",{ status:503,headers:corsHeaders });
    const url = new URL(req.url);
    const queryType = url.searchParams.get("type") || url.searchParams.get("topic");
    const queryId = url.searchParams.get("data.id") || url.searchParams.get("id");

    let body: { type?: string; topic?: string; resource?: string; data?: { id?: string } } = {};
    try { body = await req.json(); } catch { /* GET ping */ }

    const type = body.type || body.topic || queryType;
    const dataId = queryId || body.data?.id;
    const bodyType = body.type || body.topic;
    if (queryType && bodyType && queryType !== bodyType) {
      return new Response("Invalid notification",{ status:400,headers:corsHeaders });
    }
    if (queryId && body.data?.id != null && String(body.data.id)!==queryId) {
      return new Response("Invalid notification",{ status:400,headers:corsHeaders });
    }

    console.log("MP webhook:", { type, dataId });

    if (!type || !dataId) {
      return new Response("Invalid notification", { status: 400, headers: corsHeaders });
    }

    // Rejeita qualquer notificação sem assinatura válida do Mercado Pago
    if (!(await verifyMpSignature(req, String(dataId),configuration.secret))) {
      console.error("Assinatura MP inválida");
      return new Response("Unauthorized", { status: 401, headers: corsHeaders });
    }

    const rateCheck = await checkSharedRateLimit(admin,"mp-webhook",`${configuration.environment}:${dataId}`,100);
    if (!rateCheck.allowed) return rateLimitResponse(rateCheck.resetAt,corsHeaders,100);

    if (type === "payment") {
      if (!/^[0-9]+$/.test(String(dataId))) return new Response("Invalid payment id",{ status:400,headers:corsHeaders });
      await handlePayment(String(dataId));
    } else if (type === "preapproval" || type === "subscription_preapproval") {
      await handlePreapproval(String(dataId));
    } else if (type === "subscription_authorized_payment") {
      // Pagamento recorrente bem-sucedido — atualiza período
      await handleAuthorizedPayment(String(dataId));
    }

    return new Response("ok", { status: 200, headers: corsHeaders });
  } catch (e) {
    console.error("mp-webhook error:", e);
    // Do not acknowledge a lost update: the provider must be able to retry.
    return new Response("Processing unavailable", { status: 503, headers: { ...corsHeaders,"Retry-After":"60" } });
  }
});

async function mpFetch(path: string, expectedId: string) {
  const res = await fetch(`https://api.mercadopago.com${path}`, {
    headers: { Authorization: `Bearer ${mpConfig().token}` },
    signal:AbortSignal.timeout(7000),
  });
  if (!res.ok) {
    console.error("MP fetch failed",{ status:res.status });
    throw new Error("MP_FETCH_FAILED");
  }
  const data = await res.json();
  if (typeof data.live_mode==="boolean" && data.live_mode!==(mpConfig().environment==="live")) throw new Error("MP_ENVIRONMENT_MISMATCH");
  if (String(data?.id ?? "") !== expectedId) throw new Error("MP_RESOURCE_ID_MISMATCH");
  return data;
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function validatedReference(
  extRef: string,
  organizationRequired: boolean,
): ReturnType<typeof parseExternalReference> & { userId: string; planId: string } {
  const parsed = parseExternalReference(extRef);
  if (!isReferenceEnvironmentAllowed(parsed, mpConfig().environment)) {
    throw new Error("MP_REFERENCE_ENVIRONMENT_MISMATCH");
  }
  if (!parsed.userId || !UUID_RE.test(parsed.userId)
    || (organizationRequired && (!parsed.organizationId || !UUID_RE.test(parsed.organizationId)))
    || (parsed.organizationId && !UUID_RE.test(parsed.organizationId))
    || !parsed.planId || !getPlan(parsed.planId)) {
    throw new Error("MP_INVALID_EXTERNAL_REFERENCE");
  }
  return parsed as ReturnType<typeof parseExternalReference> & { userId: string; planId: string };
}

async function getExistingSub(externalId: string) {
  const { data,error } = await admin
    .from("subscriptions")
    .select("id, organization_id, last_event_ts, status, current_period_end")
    .eq("provider", "mercadopago")
    .eq("environment", mpConfig().environment)
    .eq("external_id", externalId)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function handlePayment(paymentId: string) {
  const payment = await mpFetch(`/v1/payments/${paymentId}`, paymentId);
  if (!payment) return;

  const extRef = payment.external_reference as string | undefined;
  if (!extRef) {
    console.warn("Payment without external_reference:", paymentId);
    return;
  }
  
  const parsed = validatedReference(extRef, false);
  // Current Kubo checkouts are recurring preapprovals. Their generic payment
  // notification must not create a second subscription row; the preapproval
  // (or authorized-payment) notification is the authority for recurring access.
  if (parsed.version !== "v1") {
    console.log("Recurring payment acknowledged; awaiting preapproval sync");
    return;
  }
  const { organizationId, planId, userId } = parsed;

  const status = payment.status as string; // approved, pending, rejected, refunded
  const isApproved = status === "approved";

  const eventTs = payment.date_last_updated || payment.date_created;
  if (!eventTs || !Number.isFinite(Date.parse(eventTs))) throw new Error("MP_INVALID_EVENT_DATE");
  const existingSub = await getExistingSub(String(paymentId));

  if (isOutdated(eventTs, existingSub?.last_event_ts)) {
    console.log(`Payment ${paymentId} webhook ignored (outdated event)`);
    return;
  }

  const approvalDate = payment.date_approved || payment.date_created;
  if (isApproved && !Number.isFinite(Date.parse(approvalDate))) throw new Error("MP_INVALID_APPROVAL_DATE");
  const periodEnd = computePeriodEnd(planId, isApproved, Date.parse(approvalDate));

  // Se a subscrição já existe e tem org_id mas o payload é V1 (orgId undef), mantém o org_id atual.
  const finalOrgId = organizationId || existingSub?.organization_id || null;

  const { error:writeError } = await admin.rpc("apply_mp_subscription_event", { p_payload: {
      id: existingSub?.id, // ajuda no upsert caso external_id tenha mudado (raro)
      user_id: userId,
      organization_id: finalOrgId,
      provider: "mercadopago",
      external_id: String(paymentId),
      plan_id: planId,
      status: mapPaymentStatus(status),
      amount: payment.transaction_amount,
      payer_email: payment.payer?.email,
      current_period_start: payment.date_created || new Date().toISOString(),
      current_period_end: periodEnd,
      last_event_ts: eventTs,
      environment: mpConfig().environment,
      stripe_subscription_id: `mp_${paymentId}`,
      stripe_customer_id: `mp_${payment.payer?.id ?? userId}`,
      product_id: planId,
      price_id: planId,
    } });
  if (writeError) throw writeError;
}

async function handlePreapproval(preapprovalId: string) {
  const sub = await mpFetch(`/preapproval/${preapprovalId}`, preapprovalId);
  if (!sub) return;

  const extRef = sub.external_reference as string | undefined;
  if (!extRef) return;
  
  const { organizationId, planId, userId } = validatedReference(extRef, true);

  const status = sub.status as string; // pending, authorized, paused, cancelled
  const nextPayment = sub.next_payment_date ? new Date(sub.next_payment_date).toISOString() : null;
  const trialEnd = computeTrialEnd(!!sub.auto_recurring?.free_trial, sub.date_created);

  const mappedStatus = mapPreapprovalStatus(status, trialEnd, Date.now());

  const eventTs = sub.last_modified || sub.date_created;
  if (!eventTs || !Number.isFinite(Date.parse(eventTs))) throw new Error("MP_INVALID_EVENT_DATE");
  const existingSub = await getExistingSub(preapprovalId);

  if (isOutdated(eventTs, existingSub?.last_event_ts)) {
    console.log(`Preapproval ${preapprovalId} webhook ignored (outdated event)`);
    return;
  }

  const finalOrgId = organizationId || existingSub?.organization_id || null;

  const { error:writeError } = await admin.rpc("apply_mp_subscription_event", { p_payload: {
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
      current_period_end: nextPayment || (trialEnd && Date.parse(trialEnd)>Date.now() ? trialEnd : null),
      trial_end: trialEnd,
      last_event_ts: eventTs,
      environment: mpConfig().environment,
      stripe_subscription_id: `mp_${preapprovalId}`,
      stripe_customer_id: `mp_${sub.payer_id ?? userId}`,
      product_id: planId,
      price_id: planId,
    } });
  if (writeError) throw writeError;
}

async function handleAuthorizedPayment(authPaymentId: string) {
  const auth = await mpFetch(`/authorized_payments/${authPaymentId}`, authPaymentId);
  if (!auth?.preapproval_id) return;
  // Apenas delega para o preapproval que fará o sync correto baseado em data mais recente
  await handlePreapproval(String(auth.preapproval_id));
}

