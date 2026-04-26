// Cancela uma assinatura recorrente do Mercado Pago no fim do período atual.
// Marca cancel_at_period_end=true localmente e atualiza o preapproval no MP para status="cancelled".
// O usuário mantém acesso até current_period_end (validado por has_active_subscription).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const MP_TOKEN = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
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

    // Busca a assinatura ativa mais recente desse usuário
    const { data: sub, error: subErr } = await admin
      .from("subscriptions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (subErr || !sub) return json({ error: "Nenhuma assinatura encontrada" }, 404);

    const preapprovalId = sub.external_id as string | null;
    let mpUpdated = false;

    if (preapprovalId && sub.provider === "mercadopago") {
      const res = await fetch(`https://api.mercadopago.com/preapproval/${preapprovalId}`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${MP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "cancelled" }),
      });
      if (res.ok) {
        mpUpdated = true;
      } else {
        const txt = await res.text();
        console.error("MP cancel error:", res.status, txt);
      }
    }

    // Marca cancelamento ao fim do período (mantém acesso até current_period_end)
    await admin
      .from("subscriptions")
      .update({
        cancel_at_period_end: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", sub.id);

    return json({ success: true, mpUpdated, accessUntil: sub.current_period_end });
  } catch (e) {
    console.error("mp-cancel-subscription error:", e);
    return json({ error: (e as Error).message || "Erro interno" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
