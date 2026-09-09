import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

import { getCorsHeaders } from "../_shared/cors.ts";
import { resolveProjectTier, enforceHistoryLimit, parseDaysParam, errorResponse } from "../_shared/plan-gate.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response("Não autorizado", { status: 401, headers: corsHeaders });

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const token = authHeader.replace("Bearer ", "").trim();

    // Rate limiting: 20 req/min por usuário
    const rateCheck = checkRateLimit(token, 20, "user");
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck.resetAt, corsHeaders);
    }

    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (!user) return new Response("Token inválido", { status: 401, headers: corsHeaders });

    const url = new URL(req.url);
    const projectId = url.searchParams.get("project_id");
    const days = parseDaysParam(url.searchParams.get("days"), 30);
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
    const enforcedDays = enforceHistoryLimit(days, maxHistoryDays);

    await supabaseAdmin.rpc('aggregate_analytics_jit', { p_project_id: projectId });

    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (enforcedDays - 1));
    const startStr = startDate.toISOString().split("T")[0];
    const endStr = endDate.toISOString().split("T")[0];

    let query = supabaseAdmin
      .from('analytics_daily_overview')
      .select('source, visitors')
      .eq('project_id', projectId)
      .gte('date', startStr)
      .lte('date', endStr);

    if (deviceFilter !== "all") {
      query = query.ilike('device', deviceFilter);
    }

    const { data } = await query;

    const sourceMap: Record<string, number> = {};
    let trafficTotal = 0;
    for (const row of (data || [])) {
      sourceMap[row.source] = (sourceMap[row.source] || 0) + row.visitors;
      trafficTotal += row.visitors;
    }

    const colorMap: Record<string, string> = {
      Google: "hsl(var(--chart-blue))",
      "Redes Sociais": "hsl(var(--chart-purple))",
      Facebook: "hsl(var(--chart-purple))",
      Instagram: "hsl(var(--chart-purple))",
      Direto: "hsl(var(--chart-green))",
    };

    const trafficSources = Object.entries(sourceMap)
      .map(([source, visitors]) => ({
        source,
        visitors,
        percentage: trafficTotal > 0 ? Math.round((visitors / trafficTotal) * 100) : 0,
        color: colorMap[source] || "hsl(var(--chart-orange))",
      }))
      .sort((a, b) => b.visitors - a.visitors);

    return new Response(JSON.stringify({ trafficSources }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error) {
    return errorResponse(error, corsHeaders, "get-dashboard-sources");
  }
});

