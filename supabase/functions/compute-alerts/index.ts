import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yStart = new Date(yesterday); yStart.setHours(0, 0, 0, 0);
  const yEnd = new Date(yesterday); yEnd.setHours(23, 59, 59, 999);
  const sevenAgo = new Date(today); sevenAgo.setDate(sevenAgo.getDate() - 8);

  // Get all projects with prefs (or default)
  const { data: projects } = await supabase.from("projects").select("id, name");
  if (!projects) return new Response(JSON.stringify({ ok: true, alerts: 0 }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  let created = 0;

  for (const project of projects) {
    const { data: pref } = await supabase
      .from("alert_preferences")
      .select("*")
      .eq("project_id", project.id)
      .maybeSingle();

    if (pref && !pref.enabled) continue;
    const threshold = pref?.traffic_threshold_pct ?? 20;
    const leadsGoal = pref?.leads_goal_daily ?? null;

    // Yesterday's pageviews
    const { count: yesterdayCount } = await supabase
      .from("pageviews")
      .select("*", { count: "exact", head: true })
      .eq("project_id", project.id)
      .gte("created_at", yStart.toISOString())
      .lte("created_at", yEnd.toISOString());

    // Previous 7 days (excluding yesterday)
    const prevStart = new Date(sevenAgo); prevStart.setHours(0, 0, 0, 0);
    const prevEnd = new Date(yesterday); prevEnd.setDate(prevEnd.getDate() - 1); prevEnd.setHours(23, 59, 59, 999);
    const { count: prevCount } = await supabase
      .from("pageviews")
      .select("*", { count: "exact", head: true })
      .eq("project_id", project.id)
      .gte("created_at", prevStart.toISOString())
      .lte("created_at", prevEnd.toISOString());

    const avg7 = (prevCount ?? 0) / 7;
    const yCount = yesterdayCount ?? 0;

    if (avg7 > 0) {
      const change = ((yCount - avg7) / avg7) * 100;
      if (change >= threshold) {
        await supabase.from("alerts").insert({
          project_id: project.id,
          type: "traffic_spike",
          severity: "success",
          title: `📈 Tráfego subiu ${change.toFixed(0)}%`,
          message: `${project.name} teve ${yCount} visitas ontem, ${change.toFixed(0)}% acima da média semanal (${avg7.toFixed(0)}).`,
          metadata: { yesterday: yCount, avg7, change },
        });
        created++;
      } else if (change <= -threshold) {
        await supabase.from("alerts").insert({
          project_id: project.id,
          type: "traffic_drop",
          severity: "warning",
          title: `📉 Tráfego caiu ${Math.abs(change).toFixed(0)}%`,
          message: `${project.name} teve ${yCount} visitas ontem, ${Math.abs(change).toFixed(0)}% abaixo da média semanal (${avg7.toFixed(0)}).`,
          metadata: { yesterday: yCount, avg7, change },
        });
        created++;
      }
    }

    // Leads goal check
    if (leadsGoal && leadsGoal > 0) {
      const { count: leadsCount } = await supabase
        .from("events")
        .select("*", { count: "exact", head: true })
        .eq("project_id", project.id)
        .in("event_type", ["whatsapp_click", "form_submit"])
        .gte("created_at", yStart.toISOString())
        .lte("created_at", yEnd.toISOString());

      const leads = leadsCount ?? 0;
      if (leads >= leadsGoal) {
        await supabase.from("alerts").insert({
          project_id: project.id,
          type: "leads_goal",
          severity: "success",
          title: `🎯 Meta de leads batida!`,
          message: `${project.name} gerou ${leads} leads ontem (meta: ${leadsGoal}).`,
          metadata: { leads, goal: leadsGoal },
        });
        created++;
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, alerts: created }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
