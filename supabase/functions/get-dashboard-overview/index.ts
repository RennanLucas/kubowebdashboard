import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

import { getCorsHeaders } from "../_shared/cors.ts";
import { resolveProjectTier, enforceHistoryLimit, parseDaysParam, errorResponse } from "../_shared/plan-gate.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), { status: 401, headers: corsHeaders });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );
    const token = authHeader.replace("Bearer ", "").trim();

    // Rate limiting: 20 req/janela por usuário — mesmo limite dos outros
    // endpoints de dashboard (devices/geo/pages/sources), que já eram limitados.
    const rateCheck = checkRateLimit(token, 20, "user");
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck.resetAt, corsHeaders, 20);
    }

    // Fast Auth
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), { status: 401, headers: corsHeaders });
    }

    const url = new URL(req.url);
    const projectId = url.searchParams.get("project_id");
    const days = parseDaysParam(url.searchParams.get("days"), 30);
    const sourceFilter = (url.searchParams.get("source") || "all").toLowerCase();
    const deviceFilter = (url.searchParams.get("device") || "all").toLowerCase();

    if (!projectId) {
      return new Response(JSON.stringify({ error: "Missing project_id" }), { status: 400, headers: corsHeaders });
    }

    // Verify user access to project
    const { data: projData, error: projErr } = await supabaseAdmin
      .from("projects")
      .select("organization_id, organizations!inner(name, domain, lead_value)")
      .eq("id", projectId)
      .single();

    if (projErr || !projData) {
      return new Response(JSON.stringify({ error: "Projeto não encontrado" }), { status: 403, headers: corsHeaders });
    }

    const { data: memberData, error: memberErr } = await supabaseAdmin
      .from("organization_members")
      .select("role")
      .eq("organization_id", projData.organization_id)
      .eq("user_id", user.id)
      .single();

    if (memberErr || !memberData) {
      return new Response(JSON.stringify({ error: "Acesso negado à organização" }), { status: 403, headers: corsHeaders });
    }

    const { maxHistoryDays } = await resolveProjectTier(supabaseAdmin, projData.organization_id, user.id);
    enforceHistoryLimit(days, maxHistoryDays);

    const leadValue = Number(projData.organizations.lead_value) > 0 ? Number(projData.organizations.lead_value) : 25;

    // 1. JIT Aggregation (aggregates anything missing up to NOW)
    await supabaseAdmin.rpc('aggregate_analytics_jit', { p_project_id: projectId });

    // 2. Calculate date ranges
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    const startStr = startDate.toISOString().split("T")[0];
    const endStr = endDate.toISOString().split("T")[0];

    // Previous period for comparison
    const prevEndDate = new Date(startDate);
    prevEndDate.setDate(prevEndDate.getDate() - 1);
    const prevStartDate = new Date(prevEndDate);
    prevStartDate.setDate(prevStartDate.getDate() - (days - 1));
    const prevStartStr = prevStartDate.toISOString().split("T")[0];
    const prevEndStr = prevEndDate.toISOString().split("T")[0];

    // 3. Query Rollups
    let query = supabaseAdmin
      .from('analytics_daily_overview')
      .select('date, source, device, visitors, views, sessions, bounces, total_duration')
      .eq('project_id', projectId)
      .gte('date', startStr)
      .lte('date', endStr);

    let prevQuery = supabaseAdmin
      .from('analytics_daily_overview')
      .select('date, source, device, visitors, views, sessions, bounces, total_duration')
      .eq('project_id', projectId)
      .gte('date', prevStartStr)
      .lte('date', prevEndStr);

    // Apply filters directly to DB query
    if (sourceFilter !== "all") {
      const canonicalSource = sourceFilter === 'direct' ? 'Direto' :
                              sourceFilter === 'organic' ? 'Google' : // Simplify for now
                              sourceFilter === 'social' ? 'Instagram' : sourceFilter;
      query = query.eq('source', canonicalSource);
      prevQuery = prevQuery.eq('source', canonicalSource);
    }
    if (deviceFilter !== "all") {
      query = query.ilike('device', deviceFilter);
      prevQuery = prevQuery.ilike('device', deviceFilter);
    }

    const [{ data: currentData }, { data: prevData }] = await Promise.all([
      query,
      prevQuery
    ]);

    // Query Events Rollups for Leads
    const eventQuery = supabaseAdmin
      .from('analytics_daily_events')
      .select('date, event_type, count')
      .eq('project_id', projectId)
      .gte('date', startStr)
      .lte('date', endStr);

    const prevEventQuery = supabaseAdmin
      .from('analytics_daily_events')
      .select('date, event_type, count')
      .eq('project_id', projectId)
      .gte('date', prevStartStr)
      .lte('date', prevEndStr);

    const [{ data: currentEvents }, { data: prevEvents }] = await Promise.all([
      eventQuery,
      prevEventQuery
    ]);

    // Aggregate daily metrics
    const dailyMap: Record<string, { date: string, visitors: number, views: number, leads: number, whatsapp_clicks: number, form_submissions: number, button_clicks: number }> = {};
    let totalViews = 0;
    let totalVisitors = 0;
    let totalSessions = 0;
    let totalBounces = 0;
    let totalDuration = 0;

    for (const row of (currentData || [])) {
      if (!dailyMap[row.date]) {
        dailyMap[row.date] = { date: row.date, visitors: 0, views: 0, leads: 0, whatsapp_clicks: 0, form_submissions: 0, button_clicks: 0 };
      }
      dailyMap[row.date].visitors += row.visitors;
      dailyMap[row.date].views += row.views;
      totalViews += row.views;
      totalVisitors += row.visitors;
      totalSessions += row.sessions;
      totalBounces += row.bounces;
      totalDuration += row.total_duration;
    }

    let totalLeads = 0;
    for (const ev of (currentEvents || [])) {
      if (!dailyMap[ev.date]) {
        dailyMap[ev.date] = { date: ev.date, visitors: 0, views: 0, leads: 0, whatsapp_clicks: 0, form_submissions: 0, button_clicks: 0 };
      }
      if (ev.event_type === "whatsapp_click") dailyMap[ev.date].whatsapp_clicks += ev.count;
      else if (ev.event_type === "form_submit") dailyMap[ev.date].form_submissions += ev.count;
      else if (ev.event_type === "button_click") dailyMap[ev.date].button_clicks += ev.count;
      
      if (["whatsapp_click", "form_submit"].includes(ev.event_type)) {
        dailyMap[ev.date].leads += ev.count;
        totalLeads += ev.count;
      }
    }

    const metrics = Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date)).map((m) => ({
      ...m,
      conversion_rate: m.visitors > 0 ? Number(((m.leads / m.visitors) * 100).toFixed(2)) : 0,
      estimated_value: m.leads * leadValue
    }));

    // Previous Comparison
    let prevViews = 0;
    let prevVisitors = 0;
    let prevLeads = 0;
    for (const row of (prevData || [])) prevViews += row.views;
    for (const row of (prevData || [])) prevVisitors += row.visitors;
    for (const ev of (prevEvents || [])) {
      if (["whatsapp_click", "form_submit"].includes(ev.event_type)) prevLeads += ev.count;
    }

    const calcChange = (curr: number, prev: number) =>
      prev > 0 ? Number((((curr - prev) / prev) * 100).toFixed(1)) : curr > 0 ? 100 : 0;

    const prevConv = prevVisitors > 0 ? Number(((prevLeads / prevVisitors) * 100).toFixed(2)) : 0;
    const currConv = totalVisitors > 0 ? Number(((totalLeads / totalVisitors) * 100).toFixed(2)) : 0;

    const comparison = {
      visitors: calcChange(totalVisitors, prevVisitors),
      views: calcChange(totalViews, prevViews),
      leads: calcChange(totalLeads, prevLeads),
      conversionRate: Number((currConv - prevConv).toFixed(2)),
      estimatedValue: calcChange(totalLeads * leadValue, prevLeads * leadValue),
      prevVisitors, prevViews, prevLeads, prevConversionRate: prevConv, prevEstimatedValue: prevLeads * leadValue
    };

    const engagement = {
      bounceRate: totalSessions > 0 ? Number(((totalBounces / totalSessions) * 100).toFixed(1)) : 0,
      avgSessionDuration: totalSessions > 0 ? Math.round(totalDuration / totalSessions) : 0,
      totalSessions,
      pagesPerSession: totalSessions > 0 ? Number((totalViews / totalSessions).toFixed(1)) : 0,
    };

    // Active Visitors in last 5 minutes (Real-time DB query is still OK for just 5 minutes!)
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count: activeNow } = await supabaseAdmin
      .from("pageviews")
      .select("session_id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .gte("created_at", fiveMinAgo);

    return new Response(JSON.stringify({
      client: {
        company_name: projData.organizations.name,
        domain: projData.organizations.domain,
        lead_value: leadValue
      },
      summary: { totalVisitors, totalViews, totalLeads, totalSessions },
      metrics,
      comparison,
      engagement,
      activeVisitors: activeNow || 0,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    return errorResponse(error, corsHeaders, "get-dashboard-overview");
  }
});

