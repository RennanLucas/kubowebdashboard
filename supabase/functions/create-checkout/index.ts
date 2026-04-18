import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";
import { type StripeEnv, createStripeClient } from "../_shared/stripe.ts";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { priceId, customerEmail, userId, returnUrl, environment } = await req.json();
    if (!priceId || typeof priceId !== "string" || !/^[a-zA-Z0-9_-]+$/.test(priceId)) {
      return new Response(JSON.stringify({ error: "Invalid priceId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const env = (environment || "sandbox") as StripeEnv;
    const stripe = createStripeClient(env);

    const prices = await stripe.prices.list({ lookup_keys: [priceId] });
    if (!prices.data.length) {
      return new Response(JSON.stringify({ error: "Price not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const stripePrice = prices.data[0];
    const isRecurring = stripePrice.type === "recurring";

    // Pix só para pagamento único em BRL e se ativado no Stripe Dashboard.
    // Se Pix não estiver ativado, faz fallback para somente cartão.
    const wantsPix = !isRecurring && stripePrice.currency === "brl";

    const buildParams = (methods: string[]) => ({
      line_items: [{ price: stripePrice.id, quantity: 1 }],
      mode: (isRecurring ? "subscription" : "payment") as "subscription" | "payment",
      ui_mode: "embedded" as const,
      payment_method_types: methods,
      return_url: returnUrl || `${req.headers.get("origin")}/checkout/return?session_id={CHECKOUT_SESSION_ID}`,
      ...(customerEmail && { customer_email: customerEmail }),
      ...(isRecurring && {
        subscription_data: {
          trial_period_days: 7,
          ...(userId && { metadata: { userId } }),
        },
      }),
      ...(userId && { metadata: { userId } }),
    });

    let session;
    try {
      session = await stripe.checkout.sessions.create(
        buildParams(wantsPix ? ["card", "pix"] : ["card"]) as any,
      );
    } catch (err: any) {
      if (wantsPix && /pix/i.test(err?.message || "")) {
        console.warn("Pix não ativado no Stripe, fallback para cartão:", err.message);
        session = await stripe.checkout.sessions.create(buildParams(["card"]) as any);
      } else {
        throw err;
      }
    }

    return new Response(JSON.stringify({ clientSecret: session.client_secret }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
