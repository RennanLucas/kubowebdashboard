import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { corsHeaders } from "https://esm.sh/@supabase/supabase-js@2.49.1/cors";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate JWT
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

    // Verify user token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get("days") || "30", 10);

    // Get client data for authenticated user
    const { data: clientData, error: clientError } = await supabaseAdmin
      .from("clients")
      .select("*, projects(*)")
      .eq("user_id", user.id)
      .limit(1)
      .maybeSingle();

    if (clientError) throw clientError;
    if (!clientData) {
      return new Response(JSON.stringify({ client: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const projectId = clientData.projects?.[0]?.id;
    if (!projectId) {
      return new Response(JSON.stringify({ client: clientData, metrics: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Calculate start date
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    const startDateStr = startDate.toISOString().split("T")[0];

    // Fetch all data in parallel
    const [metricsRes, trafficRes, pagesRes] = await Promise.all([
      supabaseAdmin
        .from("website_metrics")
        .select("*")
        .eq("project_id", projectId)
        .gte("date", startDateStr)
        .order("date", { ascending: true }),
      supabaseAdmin
        .from("traffic_sources")
        .select("*")
        .eq("project_id", projectId)
        .gte("date", startDateStr)
        .order("source"),
      supabaseAdmin
        .from("page_metrics")
        .select("*")
        .eq("project_id", projectId)
        .gte("date", startDateStr)
        .order("views", { ascending: false }),
    ]);

    if (metricsRes.error) throw metricsRes.error;
    if (trafficRes.error) throw trafficRes.error;
    if (pagesRes.error) throw pagesRes.error;

    // Aggregate traffic sources
    const trafficGrouped: Record<string, number> = {};
    for (const row of trafficRes.data) {
      trafficGrouped[row.source] = (trafficGrouped[row.source] || 0) + row.visitors;
    }
    const trafficTotal = Object.values(trafficGrouped).reduce((s, v) => s + v, 0);
    const colorMap: Record<string, string> = {
      Google: "hsl(var(--chart-blue))",
      "Redes Sociais": "hsl(var(--chart-purple))",
      Direto: "hsl(var(--chart-green))",
      "Anúncios": "hsl(var(--chart-orange))",
    };
    const trafficSources = Object.entries(trafficGrouped)
      .map(([source, visitors]) => ({
        source,
        visitors,
        percentage: trafficTotal > 0 ? Math.round((visitors / trafficTotal) * 100) : 0,
        color: colorMap[source] || "hsl(var(--chart-blue))",
      }))
      .sort((a, b) => b.visitors - a.visitors);

    // Aggregate page metrics
    const pageGrouped: Record<string, { views: number; totalTime: number; totalBounce: number; count: number }> = {};
    for (const row of pagesRes.data) {
      if (!pageGrouped[row.page_path]) {
        pageGrouped[row.page_path] = { views: 0, totalTime: 0, totalBounce: 0, count: 0 };
      }
      pageGrouped[row.page_path].views += row.views;
      pageGrouped[row.page_path].totalTime += Number(row.avg_time_on_page);
      pageGrouped[row.page_path].totalBounce += Number(row.bounce_rate);
      pageGrouped[row.page_path].count += 1;
    }
    const nameMap: Record<string, string> = {
      "/": "Página Inicial",
      "/servicos": "Serviços",
      "/contato": "Contato",
      "/sobre": "Sobre Nós",
      "/portfolio": "Portfólio",
    };
    const topPages = Object.entries(pageGrouped)
      .map(([path, d]) => {
        const avgSeconds = Math.round(d.totalTime / d.count);
        const mins = Math.floor(avgSeconds / 60);
        const secs = avgSeconds % 60;
        return {
          path,
          name: nameMap[path] || path,
          views: d.views,
          avgTime: `${mins}:${String(secs).padStart(2, "0")}`,
          bounceRate: Number((d.totalBounce / d.count).toFixed(1)),
        };
      })
      .sort((a, b) => b.views - a.views);

    return new Response(
      JSON.stringify({
        client: {
          id: clientData.id,
          company_name: clientData.company_name,
          domain: clientData.domain,
          analytics_property_id: clientData.analytics_property_id,
          project: clientData.projects?.[0] || null,
        },
        metrics: metricsRes.data,
        trafficSources,
        topPages,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Analytics error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
