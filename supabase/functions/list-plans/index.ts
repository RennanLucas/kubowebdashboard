// Endpoint público que retorna a lista de planos disponíveis.
// O frontend usa essa função como fonte única para renderizar Pricing/Subscription.
import { listPlans } from "../_shared/plans.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "GET" && req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Expõe apenas os campos relevantes ao cliente.
  const plans = listPlans().map((p) => ({
    id: p.id,
    name: p.name,
    tagline: p.tagline,
    price: p.price,
    cadence: p.cadence,
    amount: p.amount,
    currency: p.currency,
    highlight: p.highlight,
    cta: p.cta,
    features: p.features,
    recommended: p.recommended ?? false,
    enabled: p.enabled,
    disabledReason: p.disabledReason ?? null,
  }));

  return new Response(JSON.stringify({ plans }), {
    status: 200,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=60",
    },
  });
});
