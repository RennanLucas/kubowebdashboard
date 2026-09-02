import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.6";
import { corsHeaders } from "../_shared/cors.ts";
import { resolveProjectTier, enforceHistoryLimit, enforcePremiumFeature, parseDaysParam, errorResponse } from "../_shared/plan-gate.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";

function escapeHtml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");

    // Rate limiting estrito (5 req/janela): gerar relatório varre várias tabelas
    // de analytics e monta HTML, então é o endpoint mais caro por requisição.
    const rateCheck = checkRateLimit(token, 5, "user");
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck.resetAt, corsHeaders, 5);
    }

    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const days = parseDaysParam(url.searchParams.get("days"), 30);
    const projectId = url.searchParams.get("project_id");

    if (!projectId) {
      return new Response(JSON.stringify({ error: "Missing project_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user access to project via organization
    const { data: projData, error: projErr } = await supabaseAdmin
      .from("projects")
      .select("name, organization_id, organizations!inner(name, domain, lead_value)")
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

    try {
      const { tier, maxHistoryDays } = await resolveProjectTier(supabaseAdmin, projData.organization_id, user.id);
      enforcePremiumFeature(tier, "pdf_report");
      enforceHistoryLimit(days, maxHistoryDays);
    } catch (planError) {
      return errorResponse(planError, corsHeaders, "generate-report:plan");
    }

    const clientData = {
      company_name: projData.organizations.name
    };
    const currentProject = { name: projData.name };

    // Fetch pageviews
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    const { data: pvData } = await supabaseAdmin
      .from("pageviews")
      .select("*")
      .eq("project_id", projectId)
      .gte("created_at", `${startDateStr}T00:00:00Z`)
      .lte("created_at", `${endDateStr}T23:59:59Z`);

    // Aggregate
    const uniqueVisitors = new Set<string>();
    const pageMap: Record<string, number> = {};
    const refMap: Record<string, number> = {};
    const dailyMap: Record<string, Set<string>> = {};

    for (const pv of (pvData || [])) {
      const sid = pv.session_id || pv.id;
      uniqueVisitors.add(sid);

      const day = pv.created_at.split("T")[0];
      if (!dailyMap[day]) dailyMap[day] = new Set();
      dailyMap[day].add(sid);

      const pagePath = pv.page_path || "/";
      pageMap[pagePath] = (pageMap[pagePath] || 0) + 1;

      let source = "Direto";
      if (pv.referrer) {
        try {
          const h = new URL(pv.referrer).hostname;
          if (h.includes("google")) source = "Google";
          else if (h.includes("facebook") || h.includes("instagram") || h.includes("twitter") || h.includes("linkedin")) source = "Redes Sociais";
          else source = h;
        } catch { source = "Outro"; }
      }
      refMap[source] = (refMap[source] || 0) + 1;
    }

    const totalVisitors = uniqueVisitors.size;
    const totalPageviews = pvData?.length || 0;

    // Sort pages and sources
    const sortedPages = Object.entries(pageMap).sort((a, b) => b[1] - a[1]).slice(0, 10);
    const sortedSources = Object.entries(refMap).sort((a, b) => b[1] - a[1]);

    // Daily chart data
    const sortedDays = Object.entries(dailyMap).sort(([a], [b]) => a.localeCompare(b));

    // Generate HTML report
    const reportDate = new Date().toLocaleDateString("pt-BR");
    const periodStart = startDate.toLocaleDateString("pt-BR");
    const periodEnd = endDate.toLocaleDateString("pt-BR");

    const pagesRows = sortedPages.map(([path, views]) =>
      `<tr><td>${escapeHtml(path === "/" ? "Página Inicial" : path)}</td><td style="text-align:right">${views}</td></tr>`
    ).join("");

    const sourcesRows = sortedSources.map(([source, count]) =>
      `<tr><td>${escapeHtml(source)}</td><td style="text-align:right">${count}</td></tr>`
    ).join("");

    const maxVisitors = Math.max(...sortedDays.map(([, s]) => s.size), 1);
    const chartBars = sortedDays.map(([day, visitors]) => {
      const pct = Math.round((visitors.size / maxVisitors) * 100);
      const label = day.slice(5).replace("-", "/");
      return `<div style="display:flex;align-items:center;gap:8px;margin:2px 0">
        <span style="width:40px;font-size:10px;text-align:right">${label}</span>
        <div style="background:#3b82f6;height:14px;width:${pct}%;border-radius:3px;min-width:2px"></div>
        <span style="font-size:10px">${visitors.size}</span>
      </div>`;
    }).join("");

    const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 800px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a; }
  h1 { font-size: 24px; margin-bottom: 4px; }
  .subtitle { color: #666; font-size: 14px; margin-bottom: 32px; }
  .kpi-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 32px; }
  .kpi { background: #f8f9fa; border-radius: 8px; padding: 16px; }
  .kpi-value { font-size: 28px; font-weight: 700; }
  .kpi-label { font-size: 12px; color: #666; text-transform: uppercase; }
  h2 { font-size: 18px; margin-top: 32px; margin-bottom: 12px; border-bottom: 1px solid #eee; padding-bottom: 8px; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid #eee; }
  th { font-weight: 600; background: #f8f9fa; }
  .chart { background: #f8f9fa; border-radius: 8px; padding: 16px; margin-bottom: 16px; }
  .footer { text-align: center; color: #999; font-size: 11px; margin-top: 48px; padding-top: 16px; border-top: 1px solid #eee; }
</style>
</head>
<body>
  <h1>Relatório de Desempenho</h1>
  <div class="subtitle">
    ${escapeHtml(clientData.company_name)} — ${escapeHtml(currentProject?.name || "")}
    <br>Período: ${periodStart} a ${periodEnd} (${days} dias) • Gerado em ${reportDate}
  </div>

  <div class="kpi-grid">
    <div class="kpi">
      <div class="kpi-label">Visitantes Únicos</div>
      <div class="kpi-value">${totalVisitors.toLocaleString("pt-BR")}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Pageviews</div>
      <div class="kpi-value">${totalPageviews.toLocaleString("pt-BR")}</div>
    </div>
    <div class="kpi">
      <div class="kpi-label">Páginas/Visitante</div>
      <div class="kpi-value">${totalVisitors > 0 ? (totalPageviews / totalVisitors).toFixed(1) : "0"}</div>
    </div>
  </div>

  <h2>📈 Visitantes por Dia</h2>
  <div class="chart">${chartBars || "<p style='color:#999;font-size:13px'>Sem dados no período</p>"}</div>

  <h2>🌐 Fontes de Tráfego</h2>
  <table>
    <thead><tr><th>Fonte</th><th style="text-align:right">Visitantes</th></tr></thead>
    <tbody>${sourcesRows || "<tr><td colspan='2' style='color:#999'>Sem dados</td></tr>"}</tbody>
  </table>

  <h2>📄 Páginas Mais Visitadas</h2>
  <table>
    <thead><tr><th>Página</th><th style="text-align:right">Views</th></tr></thead>
    <tbody>${pagesRows || "<tr><td colspan='2' style='color:#999'>Sem dados</td></tr>"}</tbody>
  </table>

  <div class="footer">Relatório gerado automaticamente por KUBOWEB</div>
</body>
</html>`;

    // Return HTML as downloadable file (client can print to PDF)
    return new Response(html, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/html; charset=utf-8",
        "Content-Disposition": `attachment; filename="relatorio-${days}d.html"`,
      },
    });
  } catch (error) {
    return errorResponse(error, corsHeaders, "generate-report");
  }
});
