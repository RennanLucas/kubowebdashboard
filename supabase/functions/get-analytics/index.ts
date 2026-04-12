import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// --- Google Auth helpers ---

function base64url(data: Uint8Array): string {
  return btoa(String.fromCharCode(...data))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function strToBase64url(str: string): string {
  return base64url(new TextEncoder().encode(str));
}

async function importPrivateKey(pem: string): Promise<CryptoKey> {
  const pemContents = pem
    .replace(/-----BEGIN PRIVATE KEY-----/, "")
    .replace(/-----END PRIVATE KEY-----/, "")
    .replace(/\s/g, "");
  const binaryDer = Uint8Array.from(atob(pemContents), (c) => c.charCodeAt(0));
  return crypto.subtle.importKey(
    "pkcs8",
    binaryDer,
    { name: "RSASSA-PKCS1-v1_5", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

async function getGoogleAccessToken(
  serviceAccount: { client_email: string; private_key: string }
): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  const header = strToBase64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const payload = strToBase64url(
    JSON.stringify({
      iss: serviceAccount.client_email,
      scope: "https://www.googleapis.com/auth/analytics.readonly https://www.googleapis.com/auth/webmasters.readonly",
      aud: "https://oauth2.googleapis.com/token",
      iat: now,
      exp: now + 3600,
    })
  );

  const key = await importPrivateKey(serviceAccount.private_key);
  const signature = await crypto.subtle.sign(
    "RSASSA-PKCS1-v1_5",
    key,
    new TextEncoder().encode(`${header}.${payload}`)
  );
  const jwt = `${header}.${payload}.${base64url(new Uint8Array(signature))}`;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `grant_type=urn%3Aietf%3Aparams%3Aoauth%3Agrant-type%3Ajwt-bearer&assertion=${jwt}`,
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    throw new Error(`Google token error: ${err}`);
  }
  const { access_token } = await tokenRes.json();
  return access_token;
}

// --- GA4 Data API ---

interface GA4Row {
  dimensionValues: { value: string }[];
  metricValues: { value: string }[];
}

async function fetchGA4Report(
  accessToken: string,
  propertyId: string,
  startDate: string,
  endDate: string
): Promise<{
  dailyMetrics: { date: string; visitors: number; sessions: number; views: number }[];
  trafficSources: { source: string; visitors: number }[];
  topPages: { path: string; views: number; avgTime: number; bounceRate: number }[];
}> {
  const baseUrl = `https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  // Run 3 reports in parallel
  const [dailyRes, trafficRes, pagesRes] = await Promise.all([
    // Daily visitors
    fetch(baseUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "date" }],
        metrics: [
          { name: "activeUsers" },
          { name: "sessions" },
          { name: "screenPageViews" },
        ],
        orderBys: [{ dimension: { dimensionName: "date" } }],
      }),
    }),
    // Traffic sources
    fetch(baseUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "sessionDefaultChannelGroup" }],
        metrics: [{ name: "activeUsers" }],
        orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }],
        limit: 10,
      }),
    }),
    // Top pages
    fetch(baseUrl, {
      method: "POST",
      headers,
      body: JSON.stringify({
        dateRanges: [{ startDate, endDate }],
        dimensions: [{ name: "pagePath" }],
        metrics: [
          { name: "screenPageViews" },
          { name: "averageSessionDuration" },
          { name: "bounceRate" },
        ],
        orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }],
        limit: 10,
      }),
    }),
  ]);

  for (const res of [dailyRes, trafficRes, pagesRes]) {
    if (!res.ok) {
      const errText = await res.text();
      throw new Error(`GA4 API error [${res.status}]: ${errText}`);
    }
  }

  const [dailyData, trafficData, pagesData] = await Promise.all([
    dailyRes.json(),
    trafficRes.json(),
    pagesRes.json(),
  ]);

  const dailyMetrics = (dailyData.rows || []).map((row: GA4Row) => {
    const dateStr = row.dimensionValues[0].value; // YYYYMMDD
    return {
      date: `${dateStr.slice(0, 4)}-${dateStr.slice(4, 6)}-${dateStr.slice(6, 8)}`,
      visitors: parseInt(row.metricValues[0].value) || 0,
      sessions: parseInt(row.metricValues[1].value) || 0,
      views: parseInt(row.metricValues[2].value) || 0,
    };
  });

  const trafficSources = (trafficData.rows || []).map((row: GA4Row) => ({
    source: row.dimensionValues[0].value,
    visitors: parseInt(row.metricValues[0].value) || 0,
  }));

  const topPages = (pagesData.rows || []).map((row: GA4Row) => ({
    path: row.dimensionValues[0].value,
    views: parseInt(row.metricValues[0].value) || 0,
    avgTime: parseFloat(row.metricValues[1].value) || 0,
    bounceRate: parseFloat(row.metricValues[2].value) || 0,
  }));

  return { dailyMetrics, trafficSources, topPages };
}

// --- Main handler ---

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
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get("days") || "30", 10);
    const selectedProjectId = url.searchParams.get("project_id") || null;

    // Get client data
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

    // Select project (support multi-project)
    const projects = clientData.projects || [];
    const projectId = selectedProjectId && projects.some((p: any) => p.id === selectedProjectId)
      ? selectedProjectId
      : projects[0]?.id;
    const currentProject = projects.find((p: any) => p.id === projectId) || null;
    const analyticsPropertyId = clientData.analytics_property_id;

    // Calculate dates for current and previous period
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - (days - 1));
    const startDateStr = startDate.toISOString().split("T")[0];
    const endDateStr = endDate.toISOString().split("T")[0];

    const prevEndDate = new Date(startDate);
    prevEndDate.setDate(prevEndDate.getDate() - 1);
    const prevStartDate = new Date(prevEndDate);
    prevStartDate.setDate(prevStartDate.getDate() - (days - 1));
    const prevStartStr = prevStartDate.toISOString().split("T")[0];
    const prevEndStr = prevEndDate.toISOString().split("T")[0];

    // Try GA4 real data first
    const serviceAccountJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");
    let ga4Data: Awaited<ReturnType<typeof fetchGA4Report>> | null = null;

    if (serviceAccountJson && analyticsPropertyId) {
      try {
        const serviceAccount = JSON.parse(serviceAccountJson);
        const accessToken = await getGoogleAccessToken(serviceAccount);
        ga4Data = await fetchGA4Report(accessToken, analyticsPropertyId, startDateStr, endDateStr);
        console.log("GA4 real data fetched successfully");
      } catch (gaError) {
        console.error("GA4 fetch failed, falling back to DB:", gaError);
      }
    }

    const ga4HasData = ga4Data && ga4Data.dailyMetrics.length > 0;

    if (ga4HasData) {
      // Format GA4 data for the frontend
      const colorMap: Record<string, string> = {
        "Organic Search": "hsl(var(--chart-blue))",
        "Direct": "hsl(var(--chart-green))",
        "Social": "hsl(var(--chart-purple))",
        "Paid Search": "hsl(var(--chart-orange))",
        "Referral": "hsl(var(--chart-blue))",
        "Email": "hsl(var(--chart-green))",
      };

      const trafficTotal = ga4Data.trafficSources.reduce((s, t) => s + t.visitors, 0);
      const trafficSources = ga4Data.trafficSources.map((t) => ({
        source: t.source,
        visitors: t.visitors,
        percentage: trafficTotal > 0 ? Math.round((t.visitors / trafficTotal) * 100) : 0,
        color: colorMap[t.source] || "hsl(var(--chart-blue))",
      }));

      const topPages = ga4Data.topPages.map((p) => {
        const avgSeconds = Math.round(p.avgTime);
        const mins = Math.floor(avgSeconds / 60);
        const secs = avgSeconds % 60;
        return {
          path: p.path,
          name: p.path === "/" ? "Página Inicial" : p.path,
          views: p.views,
          avgTime: `${mins}:${String(secs).padStart(2, "0")}`,
          bounceRate: Number((p.bounceRate * 100).toFixed(1)),
        };
      });

      // Map daily metrics to expected format
      const metrics = ga4Data.dailyMetrics.map((d) => ({
        date: d.date,
        visitors: d.visitors,
        leads: 0,
        conversion_rate: 0,
        estimated_value: 0,
        whatsapp_clicks: 0,
        form_submissions: 0,
        button_clicks: 0,
      }));

      return new Response(
        JSON.stringify({
          client: {
            id: clientData.id,
            company_name: clientData.company_name,
            domain: clientData.domain,
            analytics_property_id: analyticsPropertyId,
            project: clientData.projects?.[0] || null,
          },
          metrics,
          trafficSources,
          topPages,
          source: "google_analytics",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback: use pageviews (custom tracking) or legacy DB tables
    if (!projectId) {
      return new Response(JSON.stringify({ client: clientData, metrics: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Try custom pageviews first (current + previous period)
    const [pvRes, pvPrevRes] = await Promise.all([
      supabaseAdmin
        .from("pageviews")
        .select("*")
        .eq("project_id", projectId)
        .gte("created_at", `${startDateStr}T00:00:00Z`)
        .lte("created_at", `${endDateStr}T23:59:59Z`),
      supabaseAdmin
        .from("pageviews")
        .select("*")
        .eq("project_id", projectId)
        .gte("created_at", `${prevStartStr}T00:00:00Z`)
        .lte("created_at", `${prevEndStr}T23:59:59Z`),
    ]);

    const pvData = pvRes.data;
    const pvPrevData = pvPrevRes.data;

    if (!pvRes.error && pvData && pvData.length > 0) {
      // Helper to aggregate pageviews
      function aggregatePV(data: any[]) {
        const dailyMap: Record<string, { visitors: Set<string>; views: number }> = {};
        const refMap: Record<string, Set<string>> = {};
        const pageMap: Record<string, number> = {};
        let totalVisitors = new Set<string>();

        for (const pv of data) {
          const day = pv.created_at.split("T")[0];
          const sid = pv.session_id || pv.id;
          if (!dailyMap[day]) dailyMap[day] = { visitors: new Set(), views: 0 };
          dailyMap[day].visitors.add(sid);
          dailyMap[day].views += 1;
          totalVisitors.add(sid);

          let source = "Direto";
          if (pv.referrer) {
            try {
              const refHost = new URL(pv.referrer).hostname;
              if (refHost.includes("google")) source = "Google";
              else if (refHost.includes("facebook") || refHost.includes("instagram") || refHost.includes("twitter") || refHost.includes("linkedin") || refHost.includes("tiktok")) source = "Redes Sociais";
              else source = refHost;
            } catch { source = "Outro"; }
          }
          if (!refMap[source]) refMap[source] = new Set();
          refMap[source].add(sid);

          const pagePath = pv.page_path || "/";
          pageMap[pagePath] = (pageMap[pagePath] || 0) + 1;
        }

        return { dailyMap, refMap, pageMap, totalVisitors: totalVisitors.size, totalViews: data.length };
      }

      const current = aggregatePV(pvData);
      const previous = pvPrevData ? aggregatePV(pvPrevData) : null;

      const metrics = Object.entries(current.dailyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, d]) => ({
          date, visitors: d.visitors.size,
          leads: 0, conversion_rate: 0, estimated_value: 0,
          whatsapp_clicks: 0, form_submissions: 0, button_clicks: 0,
        }));

      const colorMap: Record<string, string> = {
        Google: "hsl(var(--chart-blue))",
        "Redes Sociais": "hsl(var(--chart-purple))",
        Direto: "hsl(var(--chart-green))",
      };
      const trafficTotal = Object.values(current.refMap).reduce((s, v) => s + v.size, 0);
      const trafficSources = Object.entries(current.refMap)
        .map(([source, visitors]) => ({
          source, visitors: visitors.size,
          percentage: trafficTotal > 0 ? Math.round((visitors.size / trafficTotal) * 100) : 0,
          color: colorMap[source] || "hsl(var(--chart-orange))",
        }))
        .sort((a, b) => b.visitors - a.visitors);

      const topPages = Object.entries(current.pageMap)
        .map(([path, views]) => ({
          path, name: path === "/" ? "Página Inicial" : path,
          views, avgTime: "0:00", bounceRate: 0,
        }))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      // Calculate changes vs previous period
      const calcChange = (curr: number, prev: number) =>
        prev > 0 ? Number(((curr - prev) / prev * 100).toFixed(1)) : curr > 0 ? 100 : 0;

      const comparison = previous ? {
        visitors: calcChange(current.totalVisitors, previous.totalVisitors),
        views: calcChange(current.totalViews, previous.totalViews),
        prevVisitors: previous.totalVisitors,
        prevViews: previous.totalViews,
      } : null;

      return new Response(
        JSON.stringify({
          client: {
            id: clientData.id,
            company_name: clientData.company_name,
            domain: clientData.domain,
            project: currentProject,
            projects,
          },
          metrics,
          trafficSources,
          topPages,
          comparison,
          source: "custom_tracking",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Legacy fallback: use old DB tables
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

    const trafficGrouped: Record<string, number> = {};
    for (const row of trafficRes.data) {
      trafficGrouped[row.source] = (trafficGrouped[row.source] || 0) + row.visitors;
    }
    const trafficTotalDb = Object.values(trafficGrouped).reduce((s, v) => s + v, 0);
    const dbColorMap: Record<string, string> = {
      Google: "hsl(var(--chart-blue))",
      "Redes Sociais": "hsl(var(--chart-purple))",
      Direto: "hsl(var(--chart-green))",
      "Anúncios": "hsl(var(--chart-orange))",
    };
    const trafficSources = Object.entries(trafficGrouped)
      .map(([source, visitors]) => ({
        source,
        visitors,
        percentage: trafficTotalDb > 0 ? Math.round((visitors / trafficTotalDb) * 100) : 0,
        color: dbColorMap[source] || "hsl(var(--chart-blue))",
      }))
      .sort((a, b) => b.visitors - a.visitors);

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
        source: "database",
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
