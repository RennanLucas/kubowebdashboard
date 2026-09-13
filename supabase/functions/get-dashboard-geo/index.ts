import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

import { filterSource } from "../_shared/analytics-source.ts";
import { analyticsPeriod } from "../_shared/analytics-period.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { resolveProjectTier, parseDaysParam, errorResponse } from "../_shared/plan-gate.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response("Não autorizado", { status: 401, headers: corsHeaders });

    // Rate limiting: 20 req/min por usuário
    const token = authHeader.replace("Bearer ", "").trim();
    const rateCheck = checkRateLimit(token, 20, "user");
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck.resetAt, corsHeaders);
    }

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (!user) return new Response("Token inválido", { status: 401, headers: corsHeaders });

    const url = new URL(req.url);
    const projectId = url.searchParams.get("project_id");
    const days = parseDaysParam(url.searchParams.get("days"), 30);
    const sourceFilter = (url.searchParams.get("source") || "all").toLowerCase();
    const deviceFilter = (url.searchParams.get("device") || "all").toLowerCase();

    if (!projectId) return new Response("Missing project_id", { status: 400, headers: corsHeaders });

    // Verify user access to project via organization
    const { data: projData, error: projErr } = await supabaseAdmin
      .from("projects")
      .select("organization_id")
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

    // Enforce plan-based history limit
    const { tier, maxHistoryDays } = await resolveProjectTier(supabaseAdmin, projData.organization_id, user.id);
    const period = analyticsPeriod(url.searchParams, days, maxHistoryDays);

    const { error: aggregateError } = await supabaseAdmin.rpc('aggregate_analytics_jit', { p_project_id: projectId });
    if (aggregateError) throw aggregateError;

    const startStr = period.start;
    const endStr = period.end;

    let query = supabaseAdmin
      .from('analytics_daily_geo')
      .select('country, city, views')
      .eq('project_id', projectId)
      .gte('date', startStr)
      .lte('date', endStr);

    query = filterSource(query, sourceFilter);
    if (deviceFilter !== "all") {
      query = query.ilike('device', deviceFilter);
    }

    const { data, error: queryError } = await query;
    if (queryError) throw queryError;

    const countryMap: Record<string, number> = {};
    const cityMap: Record<string, number> = {};
    
    let totalViews = 0;
    for (const row of (data || [])) {
      countryMap[row.country] = (countryMap[row.country] || 0) + row.views;
      cityMap[row.city] = (cityMap[row.city] || 0) + row.views;
      totalViews += row.views;
    }

    const toList = (map: Record<string, number>) =>
      Object.entries(map)
        .map(([name, count]) => ({ name, count, percentage: totalViews > 0 ? Math.round((count / totalViews) * 100) : 0 }))
        .sort((a, b) => b.count - a.count);

    return new Response(JSON.stringify({
      countries: toList(countryMap),
      cities: toList(cityMap)
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    return errorResponse(error, corsHeaders, "get-dashboard-geo");
  }
});

