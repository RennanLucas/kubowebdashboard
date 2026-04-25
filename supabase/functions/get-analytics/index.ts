import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  parseDevice,
  classifySource,
  sourceMatchesFilter,
  deviceMatchesFilter,
  shouldUseGA4,
} from "./_filters.ts";

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

  const [dailyRes, trafficRes, pagesRes] = await Promise.all([
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
    const dateStr = row.dimensionValues[0].value;
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

// --- User agent / source filtering helpers (extracted to _filters.ts so they
// can be unit tested without booting the HTTP handler). ---

import {
  parseDevice,
  classifySource,
  sourceMatchesFilter,
  deviceMatchesFilter,
  shouldUseGA4,
} from "./_filters.ts";

function parseBrowser(ua: string): string {
  if (!ua) return "Outro";
  if (ua.includes("Edg/") || ua.includes("Edge/")) return "Edge";
  if (ua.includes("OPR/") || ua.includes("Opera")) return "Opera";
  if (ua.includes("Chrome/") && !ua.includes("Edg/")) return "Chrome";
  if (ua.includes("Safari/") && !ua.includes("Chrome/")) return "Safari";
  if (ua.includes("Firefox/")) return "Firefox";
  return "Outro";
}


function parseOS(ua: string): string {
  if (!ua) return "Outro";
  if (ua.includes("Windows")) return "Windows";
  if (ua.includes("Mac OS")) return "macOS";
  if (ua.includes("Android")) return "Android";
  if (ua.includes("iPhone") || ua.includes("iPad") || ua.includes("iOS")) return "iOS";
  if (ua.includes("Linux")) return "Linux";
  return "Outro";
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

    if (!authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseAuth = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: authError } = await supabaseAuth.auth.getUser(token);
    const userId = userData?.user?.id;

    if (authError || !userId) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const url = new URL(req.url);
    const days = parseInt(url.searchParams.get("days") || "30", 10);
    const selectedProjectId = url.searchParams.get("project_id") || null;
    const sourceFilter = (url.searchParams.get("source") || "all").toLowerCase();
    const deviceFilter = (url.searchParams.get("device") || "all").toLowerCase();
    const hasSourceFilter = sourceFilter !== "all";
    const hasDeviceFilter = deviceFilter !== "all";

    // Get client data
    const { data: clientData, error: clientError } = await supabaseAdmin
      .from("clients")
      .select("*, projects(*)")
      .eq("user_id", userId)
      .limit(1)
      .maybeSingle();

    if (clientError) throw clientError;
    if (!clientData) {
      return new Response(JSON.stringify({ client: null }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Select project
    const projects = clientData.projects || [];
    const projectId = selectedProjectId && projects.some((p: any) => p.id === selectedProjectId)
      ? selectedProjectId
      : projects[0]?.id;
    const currentProject = projects.find((p: any) => p.id === projectId) || null;
    const analyticsPropertyId = clientData.analytics_property_id;

    // Calculate dates
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

    if (serviceAccountJson && analyticsPropertyId && !hasSourceFilter && !hasDeviceFilter) {
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
      // Also fetch events from DB to enrich GA4 data with leads
      let ga4Events: any[] = [];
      if (projectId) {
        const { data: evs } = await supabaseAdmin
          .from("events")
          .select("*")
          .eq("project_id", projectId)
          .gte("created_at", `${startDateStr}T00:00:00Z`)
          .lte("created_at", `${endDateStr}T23:59:59Z`);
        ga4Events = evs || [];
      }

      const ga4EventsByDay: Record<string, { whatsapp: number; forms: number; buttons: number }> = {};
      for (const ev of ga4Events) {
        const day = ev.created_at.split("T")[0];
        if (!ga4EventsByDay[day]) ga4EventsByDay[day] = { whatsapp: 0, forms: 0, buttons: 0 };
        if (ev.event_type === "whatsapp_click") ga4EventsByDay[day].whatsapp++;
        else if (ev.event_type === "form_submit") ga4EventsByDay[day].forms++;
        else if (ev.event_type === "button_click") ga4EventsByDay[day].buttons++;
      }

      const LEAD_VALUE = clientData.lead_value ?? 25;

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

      const metrics = ga4Data.dailyMetrics.map((d) => {
        const dayEv = ga4EventsByDay[d.date] || { whatsapp: 0, forms: 0, buttons: 0 };
        const dayLeads = dayEv.whatsapp + dayEv.forms;
        return {
          date: d.date,
          visitors: d.visitors,
          leads: dayLeads,
          conversion_rate: d.visitors > 0 ? Number(((dayLeads / d.visitors) * 100).toFixed(2)) : 0,
          estimated_value: dayLeads * LEAD_VALUE,
          whatsapp_clicks: dayEv.whatsapp,
          form_submissions: dayEv.forms,
          button_clicks: dayEv.buttons,
        };
      });

      return new Response(
        JSON.stringify({
          client: {
            id: clientData.id,
            company_name: clientData.company_name,
            domain: clientData.domain,
            lead_value: clientData.lead_value ?? 25,
            project: currentProject,
            projects,
          },
          metrics,
          trafficSources,
          topPages,
          comparison: null,
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

    // Try custom pageviews + events
    const [pvRes, pvPrevRes, evRes, evPrevRes] = await Promise.all([
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
      supabaseAdmin
        .from("events")
        .select("*")
        .eq("project_id", projectId)
        .gte("created_at", `${startDateStr}T00:00:00Z`)
        .lte("created_at", `${endDateStr}T23:59:59Z`),
      supabaseAdmin
        .from("events")
        .select("*")
        .eq("project_id", projectId)
        .gte("created_at", `${prevStartStr}T00:00:00Z`)
        .lte("created_at", `${prevEndStr}T23:59:59Z`),
    ]);

    let pvData = pvRes.data;
    let pvPrevData = pvPrevRes.data;
    let evData = evRes.data || [];
    let evPrevData = evPrevRes.data || [];

    // Apply global filters (source/device) BEFORE aggregation so every widget
    // (KPIs, chart, top pages, traffic sources, devices, geo, conversions, comparison)
    // reflects the same scoped slice. Project isolation is already enforced by
    // .eq("project_id", projectId) above + RLS on the table.
    if (hasSourceFilter || hasDeviceFilter) {
      const filterPV = (rows: any[] | null) =>
        (rows || []).filter((pv) => {
          if (hasSourceFilter && !sourceMatchesFilter(classifySource(pv.referrer), sourceFilter)) return false;
          if (hasDeviceFilter && !deviceMatchesFilter(pv.user_agent, deviceFilter)) return false;
          return true;
        });

      pvData = filterPV(pvData);
      pvPrevData = filterPV(pvPrevData);

      // Restrict events to sessions that survived the pageview filter so
      // conversions/leads stay coherent with the filtered traffic.
      const currentSessions = new Set<string>(
        pvData.map((pv: any) => pv.session_id || pv.id).filter(Boolean),
      );
      const previousSessions = new Set<string>(
        pvPrevData.map((pv: any) => pv.session_id || pv.id).filter(Boolean),
      );
      evData = evData.filter((ev) => !ev.session_id || currentSessions.has(ev.session_id));
      evPrevData = evPrevData.filter((ev) => !ev.session_id || previousSessions.has(ev.session_id));
    }

    if (!pvRes.error && pvData && pvData.length > 0) {
      function aggregatePV(data: any[]) {
        const dailyMap: Record<string, { visitors: Set<string>; views: number }> = {};
        const refMap: Record<string, Set<string>> = {};
        const pageMap: Record<string, number> = {};
        const totalVisitors = new Set<string>();

        // Device / browser / country aggregation
        const deviceMap: Record<string, number> = {};
        const browserMap: Record<string, number> = {};
        const osMap: Record<string, number> = {};
        const countryMap: Record<string, number> = {};
        const cityMap: Record<string, number> = {};

        // Session-based metrics for bounce rate & avg duration
        const sessions: Record<string, { pages: number; firstTime: number; lastTime: number }> = {};

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
              const refHost = new URL(pv.referrer).hostname
                .replace(/^www\./, "")
                .replace(/\.com$|\.com\.br$|\.org$|\.net$/, "");
              if (refHost.includes("google")) source = "Google";
              else if (refHost.includes("bing")) source = "Bing";
              else if (refHost.includes("yahoo")) source = "Yahoo";
              else if (refHost.includes("facebook") || refHost.includes("fb")) source = "Facebook";
              else if (refHost.includes("instagram")) source = "Instagram";
              else if (refHost.includes("twitter") || refHost.includes("x.")) source = "X (Twitter)";
              else if (refHost.includes("linkedin")) source = "LinkedIn";
              else if (refHost.includes("tiktok")) source = "TikTok";
              else if (refHost.includes("youtube")) source = "YouTube";
              else if (refHost.includes("pinterest")) source = "Pinterest";
              else if (refHost.includes("lovable") || refHost.includes("lovableproject")) source = "Direto";
              else source = new URL(pv.referrer).hostname.replace(/^www\./, "");
            } catch { source = "Outro"; }
          }
          if (!refMap[source]) refMap[source] = new Set();
          refMap[source].add(sid);

          const pagePath = pv.page_path || "/";
          pageMap[pagePath] = (pageMap[pagePath] || 0) + 1;

          // Parse user agent
          const ua = pv.user_agent || "";
          const device = parseDevice(ua);
          const browser = parseBrowser(ua);
          const os = parseOS(ua);
          deviceMap[device] = (deviceMap[device] || 0) + 1;
          browserMap[browser] = (browserMap[browser] || 0) + 1;
          osMap[os] = (osMap[os] || 0) + 1;

          // Country & City
          if (pv.country) {
            countryMap[pv.country] = (countryMap[pv.country] || 0) + 1;
          }
          if (pv.city) {
            cityMap[pv.city] = (cityMap[pv.city] || 0) + 1;
          }

          // Session tracking
          const pvTime = new Date(pv.created_at).getTime();
          if (!sessions[sid]) {
            sessions[sid] = { pages: 0, firstTime: pvTime, lastTime: pvTime };
          }
          sessions[sid].pages += 1;
          if (pvTime < sessions[sid].firstTime) sessions[sid].firstTime = pvTime;
          if (pvTime > sessions[sid].lastTime) sessions[sid].lastTime = pvTime;
        }

        // Calculate bounce rate and avg session duration
        const sessionList = Object.values(sessions);
        const totalSessions = sessionList.length;
        const bounces = sessionList.filter(s => s.pages === 1).length;
        const bounceRate = totalSessions > 0 ? Number(((bounces / totalSessions) * 100).toFixed(1)) : 0;
        const totalDuration = sessionList.reduce((sum, s) => sum + (s.lastTime - s.firstTime), 0);
        const avgSessionDuration = totalSessions > 0 ? Math.round(totalDuration / totalSessions / 1000) : 0;

        return {
          dailyMap, refMap, pageMap,
          totalVisitors: totalVisitors.size, totalViews: data.length,
          deviceMap, browserMap, osMap, countryMap, cityMap,
          bounceRate, avgSessionDuration, totalSessions, sessions,
        };
      }

      function countEvents(events: any[]) {
        const counts: Record<string, number> = {};
        const details: any[] = [];
        for (const ev of events) {
          counts[ev.event_type] = (counts[ev.event_type] || 0) + 1;
          details.push({
            type: ev.event_type,
            label: ev.event_label,
            page: ev.page_path,
            time: ev.created_at,
            metadata: ev.metadata,
          });
        }
        return { counts, details };
      }

      const current = aggregatePV(pvData);
      const previous = pvPrevData ? aggregatePV(pvPrevData) : null;
      const currentEvents = countEvents(evData);
      const previousEvents = countEvents(evPrevData);

      // Count events per day for leads calculation
      const eventsByDay: Record<string, { whatsapp: number; forms: number; buttons: number }> = {};
      for (const ev of evData) {
        const day = ev.created_at.split("T")[0];
        if (!eventsByDay[day]) eventsByDay[day] = { whatsapp: 0, forms: 0, buttons: 0 };
        if (ev.event_type === "whatsapp_click") eventsByDay[day].whatsapp++;
        else if (ev.event_type === "form_submit") eventsByDay[day].forms++;
        else if (ev.event_type === "button_click") eventsByDay[day].buttons++;
      }

      const LEAD_VALUE = clientData.lead_value ?? 25;

      const metrics = Object.entries(current.dailyMap)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([date, d]) => {
          const dayEvents = eventsByDay[date] || { whatsapp: 0, forms: 0, buttons: 0 };
          const dayLeads = dayEvents.whatsapp + dayEvents.forms;
          const visitors = d.visitors.size;
          return {
            date, visitors,
            views: d.views,
            leads: dayLeads,
            conversion_rate: visitors > 0 ? Number(((dayLeads / visitors) * 100).toFixed(2)) : 0,
            estimated_value: dayLeads * LEAD_VALUE,
            whatsapp_clicks: dayEvents.whatsapp,
            form_submissions: dayEvents.forms,
            button_clicks: dayEvents.buttons,
          };
        });

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

      // Calculate per-page bounce rate & avg time from session data
      const pageSessionData: Record<string, { bounces: number; totalSessions: number; totalTime: number }> = {};
      const sessionsByPage: Record<string, Set<string>> = {};

      for (const pv of pvData) {
        const pagePath = pv.page_path || "/";
        const sid = pv.session_id || pv.id;
        if (!sessionsByPage[pagePath]) sessionsByPage[pagePath] = new Set();
        sessionsByPage[pagePath].add(sid);
      }

      for (const [pagePath, sids] of Object.entries(sessionsByPage)) {
        let bounces = 0;
        let totalTime = 0;
        let sessionCount = 0;
        for (const sid of sids) {
          const sess = current.sessions[sid];
          if (sess) {
            sessionCount++;
            if (sess.pages === 1) bounces++;
            totalTime += (sess.lastTime - sess.firstTime) / 1000;
          }
        }
        pageSessionData[pagePath] = { bounces, totalSessions: sessionCount, totalTime };
      }

      const nameMap: Record<string, string> = {
        "/": "Página Inicial",
        "/servicos": "Serviços",
        "/contato": "Contato",
        "/sobre": "Sobre Nós",
        "/portfolio": "Portfólio",
        "/diagnostico": "Diagnóstico",
      };

      const topPages = Object.entries(current.pageMap)
        .map(([path, views]) => {
          const pd = pageSessionData[path];
          const bounceRate = pd && pd.totalSessions > 0 ? Number(((pd.bounces / pd.totalSessions) * 100).toFixed(1)) : 0;
          const avgSeconds = pd && pd.totalSessions > 0 ? Math.round(pd.totalTime / pd.totalSessions) : 0;
          const mins = Math.floor(avgSeconds / 60);
          const secs = avgSeconds % 60;
          return {
            path,
            name: nameMap[path] || path,
            views,
            avgTime: `${mins}:${String(secs).padStart(2, "0")}`,
            bounceRate,
          };
        })
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);

      const calcChange = (curr: number, prev: number) =>
        prev > 0 ? Number(((curr - prev) / prev * 100).toFixed(1)) : curr > 0 ? 100 : 0;

      const currLeadsTotal = (currentEvents.counts["whatsapp_click"] || 0) + (currentEvents.counts["form_submit"] || 0);
      const prevLeadsTotal = (previousEvents.counts["whatsapp_click"] || 0) + (previousEvents.counts["form_submit"] || 0);
      const currConv = current.totalVisitors > 0 ? Number(((currLeadsTotal / current.totalVisitors) * 100).toFixed(2)) : 0;
      const prevConv = previous && previous.totalVisitors > 0 ? Number(((prevLeadsTotal / previous.totalVisitors) * 100).toFixed(2)) : 0;
      const LEAD_VALUE_COMP = clientData.lead_value ?? 25;
      const currValue = currLeadsTotal * LEAD_VALUE_COMP;
      const prevValue = prevLeadsTotal * LEAD_VALUE_COMP;

      const comparison = previous ? {
        visitors: calcChange(current.totalVisitors, previous.totalVisitors),
        views: calcChange(current.totalViews, previous.totalViews),
        leads: calcChange(currLeadsTotal, prevLeadsTotal),
        conversionRate: Number((currConv - prevConv).toFixed(2)),
        estimatedValue: calcChange(currValue, prevValue),
        prevVisitors: previous.totalVisitors,
        prevViews: previous.totalViews,
        prevLeads: prevLeadsTotal,
        prevConversionRate: prevConv,
        prevEstimatedValue: prevValue,
      } : null;

      const conversions = {
        whatsapp_clicks: currentEvents.counts["whatsapp_click"] || 0,
        button_clicks: currentEvents.counts["button_click"] || 0,
        form_submissions: currentEvents.counts["form_submit"] || 0,
        phone_clicks: currentEvents.counts["phone_click"] || 0,
        email_clicks: currentEvents.counts["email_click"] || 0,
        changes: {
          whatsapp: calcChange(currentEvents.counts["whatsapp_click"] || 0, previousEvents.counts["whatsapp_click"] || 0),
          buttons: calcChange(currentEvents.counts["button_click"] || 0, previousEvents.counts["button_click"] || 0),
          forms: calcChange(currentEvents.counts["form_submit"] || 0, previousEvents.counts["form_submit"] || 0),
        },
        recent: currentEvents.details
          .sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime())
          .slice(0, 20),
      };

      // Format devices/browsers for frontend
      const totalPV = pvData.length;
      const toList = (map: Record<string, number>) =>
        Object.entries(map)
          .map(([name, count]) => ({ name, count, percentage: totalPV > 0 ? Math.round((count / totalPV) * 100) : 0 }))
          .sort((a, b) => b.count - a.count);

      const devices = toList(current.deviceMap);
      const browsers = toList(current.browserMap);
      const operatingSystems = toList(current.osMap);
      const countries = toList(current.countryMap);
      const cities = toList(current.cityMap);

      // Real-time: count sessions active in last 5 minutes
      const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const { count: activeNow } = await supabaseAdmin
        .from("pageviews")
        .select("session_id", { count: "exact", head: true })
        .eq("project_id", projectId)
        .gte("created_at", fiveMinAgo);

      // Engagement
      const engagement = {
        bounceRate: current.bounceRate,
        avgSessionDuration: current.avgSessionDuration,
        totalSessions: current.totalSessions,
        pagesPerSession: current.totalSessions > 0 ? Number((current.totalViews / current.totalSessions).toFixed(1)) : 0,
      };

      return new Response(
        JSON.stringify({
          client: {
            id: clientData.id,
            company_name: clientData.company_name,
            domain: clientData.domain,
            lead_value: clientData.lead_value ?? 25,
            project: currentProject,
            projects,
          },
          metrics,
          trafficSources,
          topPages,
          comparison,
          conversions,
          devices,
          browsers,
          operatingSystems,
          countries,
          cities,
          engagement,
          activeVisitors: activeNow || 0,
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
          lead_value: clientData.lead_value ?? 25,
          project: currentProject,
          projects,
        },
        metrics: metricsRes.data,
        trafficSources,
        topPages,
        comparison: null,
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
