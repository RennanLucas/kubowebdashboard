import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("authorization")?.replace("Bearer ", "");
    if (!authHeader) {
      return json({ error: "Unauthorized" }, 401);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // Validate caller
    const authClient = createClient(supabaseUrl, anonKey);
    const { data: userRes, error: authErr } = await authClient.auth.getUser(authHeader);
    if (authErr || !userRes.user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(supabaseUrl, serviceKey);

    // Check admin role
    const { data: roleRow } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", userRes.user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) return json({ error: "Forbidden" }, 403);

    const body = req.method === "POST" ? await req.json().catch(() => ({})) : {};
    const action = body.action || "list";

    if (action === "list") {
      const { data: usersList, error: listErr } = await admin.auth.admin.listUsers({
        page: 1,
        perPage: 200,
      });
      if (listErr) return json({ error: listErr.message }, 500);

      const userIds = usersList.users.map((u) => u.id);
      const [{ data: subs }, { data: roles }, { data: profiles }] = await Promise.all([
        admin.from("subscriptions").select("user_id, status, current_period_end, trial_end, cancel_at_period_end, environment, stripe_subscription_id").in("user_id", userIds),
        admin.from("user_roles").select("user_id, role").in("user_id", userIds),
        admin.from("profiles").select("user_id, full_name").in("user_id", userIds),
      ]);

      const result = usersList.users.map((u) => ({
        id: u.id,
        email: u.email,
        created_at: u.created_at,
        last_sign_in_at: u.last_sign_in_at,
        full_name: profiles?.find((p) => p.user_id === u.id)?.full_name ?? null,
        roles: roles?.filter((r) => r.user_id === u.id).map((r) => r.role) ?? [],
        subscription: subs?.find((s) => s.user_id === u.id) ?? null,
      }));

      return json({ users: result });
    }

    if (action === "promote" || action === "demote") {
      const targetId = body.userId as string;
      if (!targetId) return json({ error: "userId required" }, 400);
      if (action === "promote") {
        await admin.from("user_roles").upsert({ user_id: targetId, role: "admin" }, { onConflict: "user_id,role" });
      } else {
        if (targetId === userRes.user.id) return json({ error: "Cannot demote yourself" }, 400);
        await admin.from("user_roles").delete().eq("user_id", targetId).eq("role", "admin");
      }
      return json({ ok: true });
    }

    if (action === "grant_subscription") {
      const targetId = body.userId as string;
      const days = Math.max(1, Math.min(3650, Number(body.days) || 365));
      const env = (body.environment as string) || "sandbox";
      if (!targetId) return json({ error: "userId required" }, 400);

      const periodEnd = new Date(Date.now() + days * 86400000).toISOString();
      const manualId = `manual_${targetId}_${env}`;

      const { error: upsertErr } = await admin.from("subscriptions").upsert(
        {
          user_id: targetId,
          stripe_subscription_id: manualId,
          stripe_customer_id: manualId,
          product_id: "manual_grant",
          price_id: "manual_grant",
          status: "active",
          current_period_start: new Date().toISOString(),
          current_period_end: periodEnd,
          cancel_at_period_end: false,
          environment: env,
        },
        { onConflict: "stripe_subscription_id" },
      );
      if (upsertErr) return json({ error: upsertErr.message }, 500);
      return json({ ok: true, current_period_end: periodEnd });
    }

    if (action === "revoke_subscription") {
      const targetId = body.userId as string;
      const env = (body.environment as string) || "sandbox";
      if (!targetId) return json({ error: "userId required" }, 400);
      const { error: delErr } = await admin
        .from("subscriptions")
        .delete()
        .eq("user_id", targetId)
        .eq("environment", env)
        .like("stripe_subscription_id", "manual_%");
      if (delErr) return json({ error: delErr.message }, 500);
      return json({ ok: true });
    }

    return json({ error: "Unknown action" }, 400);
  } catch (e: any) {
    return json({ error: e.message }, 500);
  }
});

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
