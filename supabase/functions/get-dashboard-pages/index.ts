import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

import { filterSource } from "../_shared/analytics-source.ts";
import { analyticsPeriod } from "../_shared/analytics-period.ts";
import { getCorsHeaders } from "../_shared/cors.ts";
import { resolveProjectTier, parseDaysParam, errorResponse } from "../_shared/plan-gate.ts";
import { rateLimitResponse } from "../_shared/rate-limit.ts";
import { checkSharedRateLimit } from "../_shared/shared-rate-limit.ts";

Deno.serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return new Response("Não autorizado", { status: 401, headers: corsHeaders });

    const token = authHeader.replace("Bearer ", "").trim();

    const supabaseAdmin = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { data: { user } } = await supabaseAdmin.auth.getUser(token);
    if (!user) return new Response("Token inválido", { status: 401, headers: corsHeaders });

    const rateCheck = await checkSharedRateLimit(supabaseAdmin, "get-dashboard-pages", user.id, 20);
    if (!rateCheck.allowed) return rateLimitResponse(rateCheck.resetAt, corsHeaders, 20);

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

    // JIT Aggregation (Safe concurrent execution due to SKIP LOCKED)
    const { error: aggregateError } = await supabaseAdmin.rpc('aggregate_analytics_jit', { p_project_id: projectId });
    if (aggregateError) throw aggregateError;

    const startStr = period.start;
    const endStr = period.end;

    let query = supabaseAdmin
      .from('analytics_daily_pages')
      .select('page_path, views, visitors, sessions, bounces, total_duration')
      .eq('project_id', projectId)
      .gte('date', startStr)
      .lte('date', endStr);

    query = filterSource(query, sourceFilter);
    if (deviceFilter !== "all") {
      query = query.ilike('device', deviceFilter);
    }

    const { data, error: queryError } = await query;
    if (queryError) throw queryError;

    const pageMap: Record<string, { path: string; views: number; visitors: number; sessions: number; bounces: number; total_time: number }> = {};
    for (const row of (data || [])) {
      if (!pageMap[row.page_path]) {
        pageMap[row.page_path] = { path: row.page_path, views: 0, visitors: 0, sessions: 0, bounces: 0, total_time: 0 };
      }
      pageMap[row.page_path].views += row.views;
      pageMap[row.page_path].visitors += row.visitors;
      pageMap[row.page_path].sessions += row.sessions;
      pageMap[row.page_path].bounces += row.bounces;
      pageMap[row.page_path].total_time += row.total_duration;
    }

    const nameMap: Record<string, string> = {
      "/": "Página Inicial", "/servicos": "Serviços", "/contato": "Contato",
      "/sobre": "Sobre Nós", "/portfolio": "Portfólio", "/diagnostico": "Diagnóstico",
    };

    const topPages = Object.values(pageMap)
      .map((p) => {
        const bounceRate = p.sessions > 0 ? Number(((p.bounces / p.sessions) * 100).toFixed(1)) : 0;
        const avgSeconds = p.sessions > 0 ? Math.round(p.total_time / p.sessions) : 0;
        const mins = Math.floor(avgSeconds / 60);
        const secs = avgSeconds % 60;
        return {
          path: p.path,
          name: nameMap[p.path] || p.path,
          views: p.views,
          avgTime: `${mins}:${String(secs).padStart(2, "0")}`,
          bounceRate,
        };
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    return new Response(JSON.stringify({ topPages }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error: unknown) {
    return errorResponse(error, corsHeaders, "get-dashboard-pages");
  }
});

