import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { resolveTier, limitsForTier } from "../_shared/plans.ts";
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

    const token = authHeader.replace("Bearer ", "").trim();

    // Prefer getClaims() (local JWKS validation — resilient to transient
    // Auth server hiccups). Fall back to getUser() if claims verification
    // fails for a reason other than an actually invalid token.
    let userId: string | undefined;
    try {
      const { data: claimsData, error: claimsError } = await supabaseAuth.auth.getClaims(token);
      if (!claimsError && claimsData?.claims?.sub) {
        userId = claimsData.claims.sub as string;
      }
    } catch (_e) {
      // ignore, fallback below
    }

    if (!userId) {
      const { data: userData, error: authError } = await supabaseAuth.auth.getUser(token);
      if (!authError && userData?.user?.id) userId = userData.user.id;
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "Token inválido" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }


    const url = new URL(req.url);
    const requestedDays = parseInt(url.searchParams.get("days") || "30", 10);

    // Enforce the history window allowed by the user's plan (server-side).
    const { data: subRow } = await supabaseAdmin
      .from("subscriptions")
      .select("plan_id, status, current_period_end")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const planTier = resolveTier(subRow);
    const planLimits = limitsForTier(planTier);
    const days = Math.max(
      1,
      Math.min(Number.isFinite(requestedDays) ? requestedDays : 30, planLimits.maxHistoryDays),
    );

    const selectedProjectId = url.searchParams.get("project_id") || null;
    const sourceFilter = (url.searchParams.get("source") || "all").toLowerCase();
    const deviceFilter = (url.searchParams.get("device") || "all").toLowerCase();
    const hasSourceFilter = sourceFilter !== "all";
    const hasDeviceFilter = deviceFilter !== "all";

    // Pick the organization that owns the selected project.
    let orgData: any = null;
    let currentProject: any = null;
    let projects: any[] = [];
    
    if (selectedProjectId) {
      // Find the project and its organization
      const { data: projData } = await supabaseAdmin
        .from("projects")
        .select("organization_id, name")
        .eq("id", selectedProjectId)
        .single();
        
      if (projData && projData.organization_id) {
        // Verify user is member of this organization
        const { data: memberData } = await supabaseAdmin
          .from("organization_members")
          .select("role")
          .eq("organization_id", projData.organization_id)
          .eq("user_id", userId)
          .single();
          
        if (memberData) {
          const { data: org } = await supabaseAdmin
            .from("organizations")
            .select("*")
            .eq("id", projData.organization_id)
            .single();
          
          if (org) {
            orgData = org;
            // Get all projects for this org to populate the switcher
            const { data: orgProjects } = await supabaseAdmin
              .from("projects")
              .select("*")
              .eq("organization_id", org.id);
            projects = orgProjects || [];
            currentProject = projects.find(p => p.id === selectedProjectId) || null;
          }
        }
      }
    }
    
    // Fallback if no project_id or invalid project_id
    if (!orgData) {
       return new Response(JSON.stringify({ error: "Missing or invalid project_id" }), { status: 400, headers: corsHeaders });
    }

    const projectId = currentProject?.id;
    const analyticsPropertyId = orgData.analytics_property_id;
    const clientData = {
      id: orgData.id,
      company_name: orgData.name,
      domain: orgData.domain,
      lead_value: orgData.lead_value
    };

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

    if (
      shouldUseGA4({
        hasServiceAccount: !!serviceAccountJson,
        hasPropertyId: !!analyticsPropertyId,
        sourceFilter,
        deviceFilter,
      })
    ) {
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

      const LEAD_VALUE = (Number(clientData.lead_value) > 0 ? Number(clientData.lead_value) : 25);

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
            lead_value: (Number(clientData.lead_value) > 0 ? Number(clientData.lead_value) : 25),
            project: currentProject,
            projects,
          },
          summary: {
            totalVisitors: ga4Data.dailyMetrics.reduce((s: number, m: any) => s + m.visitors, 0),
            totalViews: ga4Data.dailyMetrics.reduce((s: number, m: any) => s + m.views, 0),
            totalLeads: metrics.reduce((s: number, m: any) => s + m.leads, 0),
            totalSessions: ga4Data.dailyMetrics.reduce((s: number, m: any) => s + m.sessions, 0)
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

    // ─── Hybrid Analytics Query ──────────────────────────────────────────────
    // Strategy:
    //  • "recent" window (last 2 days): query raw pageviews/events tables.
    //    These rows are always available and give realtime accuracy.
    //  • "historical" window (everything older than 2 days): query rollup tables
    //    (analytics_daily_overview, analytics_daily_pages, analytics_daily_events).
    //    Rollups survive the 60-day raw-data cleanup, so Pro 365-day history works.
    //
    // Filters (source/device) are applied:
    //  - On raw rows: in-memory filtering (same as before).
    //  - On rollup rows: WHERE source/device column (pre-bucketed at aggregation time).

    const RAW_WINDOW_DAYS = 2; // days that still have reliable raw data
    const rawCutoff = new Date();
    rawCutoff.setDate(rawCutoff.getDate() - RAW_WINDOW_DAYS);
    const rawCutoffStr = rawCutoff.toISOString().split("T")[0];

    // Does the requested period overlap the historical (rollup) window?
    const needsRollup = startDateStr < rawCutoffStr;
    // Does the requested period overlap the recent (raw) window?
    const needsRaw = endDateStr >= rawCutoffStr;

    // Rollup date bounds (clamped to the non-raw portion)
    const rollupStartStr = startDateStr;
    const rollupEndStr = needsRaw
      ? new Date(rawCutoff.getTime() - 86400000).toISOString().split("T")[0] // day before cutoff
      : endDateStr;

    // Raw date bounds (clamped to the recent portion)
    const rawStartStr = needsRollup ? rawCutoffStr : startDateStr;
    const rawEndStr = endDateStr;

    // Previous period: same split logic
    const prevRawCutoff = new Date(rawCutoff);
    prevRawCutoff.setDate(prevRawCutoff.getDate() - days);
    const prevRawCutoffStr = prevRawCutoff.toISOString().split("T")[0];
    const prevNeedsRollup = prevStartStr < prevRawCutoffStr;
    const prevNeedsRaw = prevEndStr >= prevRawCutoffStr;

    // ── Source/device filter helpers for rollup queries ──
    const rollupSourceValues = (() => {
      if (!hasSourceFilter) return null;
      const map: Record<string, string[]> = {
        organic: ["Google", "Bing", "Yahoo"],
        social: ["Facebook", "Instagram", "X (Twitter)", "LinkedIn", "TikTok", "YouTube", "Pinterest"],
        direct: ["Direto"],
        paid: ["Anúncios"],
        referral: [], // anything not in other lists — handled as NOT IN
        email: ["Email"],
      };
      return map[sourceFilter] ?? null;
    })();
    const rollupDevice = hasDeviceFilter
      ? deviceFilter.charAt(0).toUpperCase() + deviceFilter.slice(1) // "mobile" → "Mobile"
      : null;

    // ── 1. Rollup queries (historical) ──────────────────────────────────────
    type RollupOverviewRow = { date: string; source: string; device: string; visitors: number; views: number; sessions: number; bounces: number; total_duration: number };
    type RollupPageRow = { date: string; source: string; device: string; page_path: string; views: number; visitors: number; sessions: number; bounces: number; total_duration: number };
    type RollupEventRow = { date: string; source: string; device: string; event_type: string; count: number };
    type RollupGeoRow = { date: string; source: string; device: string; country: string; city: string; views: number; visitors: number };

    let rollupOverview: RollupOverviewRow[] = [];
    let rollupPages: RollupPageRow[] = [];
    let rollupEvents: RollupEventRow[] = [];
    let rollupGeo: RollupGeoRow[] = [];
    let prevRollupOverview: RollupOverviewRow[] = [];
    let prevRollupEvents: RollupEventRow[] = [];

    if (needsRollup) {
      const applyRollupFilters = (q: any) => {
        if (rollupDevice) q = q.eq("device", rollupDevice);
        if (rollupSourceValues !== null) {
          if (rollupSourceValues.length > 0) q = q.in("source", rollupSourceValues);
          else if (sourceFilter === "referral") {
            // referral = not in any known source category
            const knownSources = ["Google","Bing","Yahoo","Facebook","Instagram","X (Twitter)","LinkedIn","TikTok","YouTube","Pinterest","Direto","Anúncios","Email"];
            q = q.not("source", "in", `(${knownSources.map(s => `"${s}"`).join(",")})`);
          }
        }
        return q;
      };

      const [ovRes, pgRes, evRes2, geoRes, prevOvRes, prevEvRes] = await Promise.all([
        applyRollupFilters(
          supabaseAdmin.from("analytics_daily_overview")
            .select("date,source,device,visitors,views,sessions,bounces,total_duration")
            .eq("project_id", projectId)
            .gte("date", rollupStartStr)
            .lte("date", rollupEndStr)
        ),
        applyRollupFilters(
          supabaseAdmin.from("analytics_daily_pages")
            .select("date,source,device,page_path,views,visitors,sessions,bounces,total_duration")
            .eq("project_id", projectId)
            .gte("date", rollupStartStr)
            .lte("date", rollupEndStr)
        ),
        applyRollupFilters(
          supabaseAdmin.from("analytics_daily_events")
            .select("date,source,device,event_type,count")
            .eq("project_id", projectId)
            .gte("date", rollupStartStr)
            .lte("date", rollupEndStr)
        ),
        applyRollupFilters(
          supabaseAdmin.from("analytics_daily_geo")
            .select("date,source,device,country,city,views,visitors")
            .eq("project_id", projectId)
            .gte("date", rollupStartStr)
            .lte("date", rollupEndStr)
        ),
        // Previous period rollup
        prevNeedsRollup
          ? applyRollupFilters(
              supabaseAdmin.from("analytics_daily_overview")
                .select("date,source,device,visitors,views,sessions,bounces,total_duration")
                .eq("project_id", projectId)
                .gte("date", prevStartStr)
                .lte("date", prevNeedsRaw
                  ? new Date(prevRawCutoff.getTime() - 86400000).toISOString().split("T")[0]
                  : prevEndStr)
            )
          : Promise.resolve({ data: [], error: null }),
        prevNeedsRollup
          ? applyRollupFilters(
              supabaseAdmin.from("analytics_daily_events")
                .select("date,source,device,event_type,count")
                .eq("project_id", projectId)
                .gte("date", prevStartStr)
                .lte("date", prevNeedsRaw
                  ? new Date(prevRawCutoff.getTime() - 86400000).toISOString().split("T")[0]
                  : prevEndStr)
            )
          : Promise.resolve({ data: [], error: null }),
      ]);

      rollupOverview = ovRes.data || [];
      rollupPages = pgRes.data || [];
      rollupEvents = evRes2.data || [];
      rollupGeo = geoRes.data || [];
      prevRollupOverview = prevOvRes.data || [];
      prevRollupEvents = prevEvRes.data || [];
    }

    // ── 2. Raw queries (recent window) ──────────────────────────────────────
    let pvData: any[] = [];
    let pvPrevData: any[] = [];
    let evData: any[] = [];
    let evPrevData: any[] = [];

    if (needsRaw) {
      const [pvRes, evRes3] = await Promise.all([
        supabaseAdmin
          .from("pageviews")
          .select("created_at,page_path,referrer,user_agent,session_id,id,country,city")
          .eq("project_id", projectId)
          .gte("created_at", `${rawStartStr}T00:00:00Z`)
          .lte("created_at", `${rawEndStr}T23:59:59Z`),
        supabaseAdmin
          .from("events")
          .select("created_at,event_type,event_label,page_path,session_id,metadata")
          .eq("project_id", projectId)
          .gte("created_at", `${rawStartStr}T00:00:00Z`)
          .lte("created_at", `${rawEndStr}T23:59:59Z`),
      ]);
      pvData = pvRes.data || [];
      evData = evRes3.data || [];
    }

    if (prevNeedsRaw) {
      const prevRawStartStr = prevNeedsRollup ? prevRawCutoffStr : prevStartStr;
      const [pvPrevRes, evPrevRes2] = await Promise.all([
        supabaseAdmin
          .from("pageviews")
          .select("created_at,page_path,referrer,user_agent,session_id,id,country,city")
          .eq("project_id", projectId)
          .gte("created_at", `${prevRawStartStr}T00:00:00Z`)
          .lte("created_at", `${prevEndStr}T23:59:59Z`),
        supabaseAdmin
          .from("events")
          .select("created_at,event_type,event_label,page_path,session_id,metadata")
          .eq("project_id", projectId)
          .gte("created_at", `${prevRawStartStr}T00:00:00Z`)
          .lte("created_at", `${prevEndStr}T23:59:59Z`),
      ]);
      pvPrevData = pvPrevRes.data || [];
      evPrevData = evPrevRes2.data || [];
    }

    // ── 3. Apply source/device filter to raw rows ────────────────────────────
    if ((hasSourceFilter || hasDeviceFilter) && pvData.length > 0) {
      const filterPV = (rows: any[]) =>
        rows.filter((pv) => {
          if (hasSourceFilter && !sourceMatchesFilter(classifySource(pv.referrer), sourceFilter)) return false;
          if (hasDeviceFilter && !deviceMatchesFilter(pv.user_agent, deviceFilter)) return false;
          return true;
        });
      pvData = filterPV(pvData);
      pvPrevData = filterPV(pvPrevData);
      const currentSessions = new Set<string>(pvData.map((pv: any) => pv.session_id || pv.id).filter(Boolean));
      const previousSessions = new Set<string>(pvPrevData.map((pv: any) => pv.session_id || pv.id).filter(Boolean));
      evData = evData.filter((ev) => !ev.session_id || currentSessions.has(ev.session_id));
      evPrevData = evPrevData.filter((ev) => !ev.session_id || previousSessions.has(ev.session_id));
    }

    // ── 4. Check if we have any data at all ─────────────────────────────────
    const hasRollupData = rollupOverview.length > 0;
    const hasRawData = pvData.length > 0;

    if (!hasRollupData && !hasRawData) {
      // No data at all — return empty state, not an error
      return new Response(
        JSON.stringify({
          client: {
            id: clientData.id,
            company_name: clientData.company_name,
            domain: clientData.domain,
            lead_value: (Number(clientData.lead_value) > 0 ? Number(clientData.lead_value) : 25),
            project: currentProject,
            projects,
          },
          summary: { totalVisitors: 0, totalViews: 0, totalLeads: 0, totalSessions: 0 },
          metrics: [],
          trafficSources: [],
          topPages: [],
          comparison: null,
          conversions: { whatsapp_clicks: 0, button_clicks: 0, form_submissions: 0, phone_clicks: 0, email_clicks: 0, changes: { whatsapp: 0, buttons: 0, forms: 0 }, recent: [] },
          devices: [],
          browsers: [],
          operatingSystems: [],
          countries: [],
          cities: [],
          engagement: { bounceRate: 0, avgSessionDuration: 0, totalSessions: 0, pagesPerSession: 0 },
          activeVisitors: 0,
          source: "custom_tracking",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LEAD_VALUE = (Number(clientData.lead_value) > 0 ? Number(clientData.lead_value) : 25);

    // ── 5. Build daily metrics map (rollup + raw merged) ─────────────────────
    // keyed by date string "YYYY-MM-DD"
    const dailyMap: Record<string, { visitors: number; views: number; sessions: number; bounces: number; total_duration: number }> = {};

    // From rollups
    for (const row of rollupOverview) {
      const d = row.date.split("T")[0];
      if (!dailyMap[d]) dailyMap[d] = { visitors: 0, views: 0, sessions: 0, bounces: 0, total_duration: 0 };
      dailyMap[d].visitors += row.visitors;
      dailyMap[d].views += row.views;
      dailyMap[d].sessions += row.sessions;
      dailyMap[d].bounces += row.bounces;
      dailyMap[d].total_duration += row.total_duration;
    }

    // From raw pageviews (recent window) — aggregate similarly to old code
    const rawDailyVisitors: Record<string, Set<string>> = {};
    const rawSessions: Record<string, { pages: number; firstTime: number; lastTime: number }> = {};
    const rawDeviceMap: Record<string, number> = {};
    const rawBrowserMap: Record<string, number> = {};
    const rawOsMap: Record<string, number> = {};
    const rawCountryMap: Record<string, number> = {};
    const rawCityMap: Record<string, number> = {};
    const rawRefMap: Record<string, Set<string>> = {};
    const rawPageMap: Record<string, number> = {};

    for (const pv of pvData) {
      const day = pv.created_at.split("T")[0];
      const sid = pv.session_id || pv.id;
      if (!rawDailyVisitors[day]) rawDailyVisitors[day] = new Set();
      rawDailyVisitors[day].add(sid);
      if (!dailyMap[day]) dailyMap[day] = { visitors: 0, views: 0, sessions: 0, bounces: 0, total_duration: 0 };
      dailyMap[day].views += 1;

      // Source
      const source = classifySource(pv.referrer);
      if (!rawRefMap[source]) rawRefMap[source] = new Set();
      rawRefMap[source].add(sid);

      // Page
      const pagePath = pv.page_path || "/";
      rawPageMap[pagePath] = (rawPageMap[pagePath] || 0) + 1;

      // Tech
      const ua = pv.user_agent || "";
      const device = parseDevice(ua);
      const browser = parseBrowser(ua);
      const os = parseOS(ua);
      rawDeviceMap[device] = (rawDeviceMap[device] || 0) + 1;
      rawBrowserMap[browser] = (rawBrowserMap[browser] || 0) + 1;
      rawOsMap[os] = (rawOsMap[os] || 0) + 1;
      if (pv.country) rawCountryMap[pv.country] = (rawCountryMap[pv.country] || 0) + 1;
      if (pv.city) rawCityMap[pv.city] = (rawCityMap[pv.city] || 0) + 1;

      // Sessions
      const pvTime = new Date(pv.created_at).getTime();
      if (!rawSessions[sid]) rawSessions[sid] = { pages: 0, firstTime: pvTime, lastTime: pvTime };
      rawSessions[sid].pages += 1;
      if (pvTime < rawSessions[sid].firstTime) rawSessions[sid].firstTime = pvTime;
      if (pvTime > rawSessions[sid].lastTime) rawSessions[sid].lastTime = pvTime;
    }

    // Merge raw sessions into dailyMap
    for (const [day, sids] of Object.entries(rawDailyVisitors)) {
      dailyMap[day].visitors += sids.size;
      dailyMap[day].sessions += sids.size;
      const sessList = [...sids].map(s => rawSessions[s]).filter(Boolean);
      dailyMap[day].bounces += sessList.filter(s => s.pages === 1).length;
      dailyMap[day].total_duration += sessList.reduce((sum, s) => sum + (s.lastTime - s.firstTime), 0);
    }

    // ── 6. Events daily map (rollup + raw merged) ───────────────────────────
    const eventsByDay: Record<string, { whatsapp: number; forms: number; buttons: number }> = {};
    const totalEventCounts: Record<string, number> = {};

    for (const row of rollupEvents) {
      const d = row.date.split("T")[0];
      if (!eventsByDay[d]) eventsByDay[d] = { whatsapp: 0, forms: 0, buttons: 0 };
      totalEventCounts[row.event_type] = (totalEventCounts[row.event_type] || 0) + row.count;
      if (row.event_type === "whatsapp_click") eventsByDay[d].whatsapp += row.count;
      else if (row.event_type === "form_submit") eventsByDay[d].forms += row.count;
      else if (row.event_type === "button_click") eventsByDay[d].buttons += row.count;
    }

    for (const ev of evData) {
      const day = ev.created_at.split("T")[0];
      if (!eventsByDay[day]) eventsByDay[day] = { whatsapp: 0, forms: 0, buttons: 0 };
      totalEventCounts[ev.event_type] = (totalEventCounts[ev.event_type] || 0) + 1;
      if (ev.event_type === "whatsapp_click") eventsByDay[day].whatsapp++;
      else if (ev.event_type === "form_submit") eventsByDay[day].forms++;
      else if (ev.event_type === "button_click") eventsByDay[day].buttons++;
    }

    // ── 7. Build metrics array ───────────────────────────────────────────────
    const metrics = Object.entries(dailyMap)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, d]) => {
        const dayEvents = eventsByDay[date] || { whatsapp: 0, forms: 0, buttons: 0 };
        const dayLeads = dayEvents.whatsapp + dayEvents.forms;
        return {
          date,
          visitors: d.visitors,
          views: d.views,
          leads: dayLeads,
          conversion_rate: d.visitors > 0 ? Number(((dayLeads / d.visitors) * 100).toFixed(2)) : 0,
          estimated_value: dayLeads * LEAD_VALUE,
          whatsapp_clicks: dayEvents.whatsapp,
          form_submissions: dayEvents.forms,
          button_clicks: dayEvents.buttons,
        };
      });

    // ── 8. Summary totals ────────────────────────────────────────────────────
    const totalVisitors = Object.values(dailyMap).reduce((s, d) => s + d.visitors, 0);
    const totalViews = Object.values(dailyMap).reduce((s, d) => s + d.views, 0);
    const totalSessionsAll = Object.values(dailyMap).reduce((s, d) => s + d.sessions, 0);
    const currLeadsTotal = (totalEventCounts["whatsapp_click"] || 0) + (totalEventCounts["form_submit"] || 0);

    // ── 9. Traffic sources (rollup + raw merged) ─────────────────────────────
    const mergedRefMap: Record<string, number> = {};
    for (const row of rollupOverview) {
      mergedRefMap[row.source] = (mergedRefMap[row.source] || 0) + row.visitors;
    }
    for (const [source, sids] of Object.entries(rawRefMap)) {
      mergedRefMap[source] = (mergedRefMap[source] || 0) + sids.size;
    }
    const trafficTotal = Object.values(mergedRefMap).reduce((s, v) => s + v, 0);
    const colorMap: Record<string, string> = {
      Google: "hsl(var(--chart-blue))",
      "Redes Sociais": "hsl(var(--chart-purple))",
      Direto: "hsl(var(--chart-green))",
    };
    const trafficSources = Object.entries(mergedRefMap)
      .map(([source, visitors]) => ({
        source,
        visitors,
        percentage: trafficTotal > 0 ? Math.round((visitors / trafficTotal) * 100) : 0,
        color: colorMap[source] || "hsl(var(--chart-orange))",
      }))
      .sort((a, b) => b.visitors - a.visitors);

    // ── 10. Top pages (rollup + raw merged) ──────────────────────────────────
    const mergedPageMap: Record<string, { views: number; visitors: number; bounces: number; sessions: number; total_duration: number }> = {};
    for (const row of rollupPages) {
      const p = row.page_path;
      if (!mergedPageMap[p]) mergedPageMap[p] = { views: 0, visitors: 0, bounces: 0, sessions: 0, total_duration: 0 };
      mergedPageMap[p].views += row.views;
      mergedPageMap[p].visitors += row.visitors;
      mergedPageMap[p].bounces += row.bounces;
      mergedPageMap[p].sessions += row.sessions;
      mergedPageMap[p].total_duration += row.total_duration;
    }
    for (const [path, views] of Object.entries(rawPageMap)) {
      if (!mergedPageMap[path]) mergedPageMap[path] = { views: 0, visitors: 0, bounces: 0, sessions: 0, total_duration: 0 };
      mergedPageMap[path].views += views;
    }
    const nameMap: Record<string, string> = {
      "/": "Página Inicial",
      "/servicos": "Serviços",
      "/contato": "Contato",
      "/sobre": "Sobre Nós",
      "/portfolio": "Portfólio",
      "/diagnostico": "Diagnóstico",
    };
    const topPages = Object.entries(mergedPageMap)
      .map(([path, d]) => {
        const avgSeconds = d.sessions > 0 ? Math.round(d.total_duration / d.sessions / 1000) : 0;
        const mins = Math.floor(avgSeconds / 60);
        const secs = avgSeconds % 60;
        return {
          path,
          name: nameMap[path] || path,
          views: d.views,
          avgTime: `${mins}:${String(secs).padStart(2, "0")}`,
          bounceRate: d.sessions > 0 ? Number(((d.bounces / d.sessions) * 100).toFixed(1)) : 0,
        };
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 10);

    // ── 11. Devices / Geo (rollup + raw merged) ──────────────────────────────
    const mergedDeviceMap: Record<string, number> = {};
    const mergedCountryMap: Record<string, number> = {};
    const mergedCityMap: Record<string, number> = {};

    for (const row of rollupOverview) {
      mergedDeviceMap[row.device] = (mergedDeviceMap[row.device] || 0) + row.visitors;
    }
    for (const row of rollupGeo) {
      if (row.country && row.country !== "Unknown") mergedCountryMap[row.country] = (mergedCountryMap[row.country] || 0) + row.visitors;
      if (row.city && row.city !== "Unknown") mergedCityMap[row.city] = (mergedCityMap[row.city] || 0) + row.visitors;
    }
    for (const [k, v] of Object.entries(rawDeviceMap)) mergedDeviceMap[k] = (mergedDeviceMap[k] || 0) + v;
    for (const [k, v] of Object.entries(rawCountryMap)) mergedCountryMap[k] = (mergedCountryMap[k] || 0) + v;
    for (const [k, v] of Object.entries(rawCityMap)) mergedCityMap[k] = (mergedCityMap[k] || 0) + v;

    const toList = (map: Record<string, number>) => {
      const total = Object.values(map).reduce((s, v) => s + v, 0);
      return Object.entries(map)
        .map(([name, count]) => ({ name, count, percentage: total > 0 ? Math.round((count / total) * 100) : 0 }))
        .sort((a, b) => b.count - a.count);
    };
    const devices = toList(mergedDeviceMap);
    const countries = toList(mergedCountryMap);
    const cities = toList(mergedCityMap);
    const browsers = toList(rawBrowserMap);
    const operatingSystems = toList(rawOsMap);

    // ── 12. Engagement (from raw sessions; rollup sessions = approximation) ──
    const rawSessionList = Object.values(rawSessions);
    const rawTotalSessions = rawSessionList.length;
    const rawBounces = rawSessionList.filter(s => s.pages === 1).length;
    const rawTotalDuration = rawSessionList.reduce((sum, s) => sum + (s.lastTime - s.firstTime), 0);

    // Merge rollup engagement data
    const rollupTotalSessions = rollupOverview.reduce((s, r) => s + r.sessions, 0);
    const rollupTotalBounces = rollupOverview.reduce((s, r) => s + r.bounces, 0);
    const rollupTotalDuration = rollupOverview.reduce((s, r) => s + r.total_duration, 0);

    const combinedSessions = rollupTotalSessions + rawTotalSessions;
    const combinedBounces = rollupTotalBounces + rawBounces;
    const combinedDuration = rollupTotalDuration + rawTotalDuration;

    const bounceRate = combinedSessions > 0 ? Number(((combinedBounces / combinedSessions) * 100).toFixed(1)) : 0;
    const avgSessionDuration = combinedSessions > 0 ? Math.round(combinedDuration / combinedSessions / 1000) : 0;
    const pagesPerSession = combinedSessions > 0 ? Number((totalViews / combinedSessions).toFixed(1)) : 0;

    // ── 13. Comparison (previous period) ────────────────────────────────────
    const prevTotalVisitors = prevRollupOverview.reduce((s, r) => s + r.visitors, 0)
      + new Set(pvPrevData.map((pv: any) => pv.session_id || pv.id)).size;
    const prevTotalViews = prevRollupOverview.reduce((s, r) => s + r.views, 0) + pvPrevData.length;
    const prevLeadsTotal = (prevRollupEvents.reduce((s, r) => r.event_type === "whatsapp_click" || r.event_type === "form_submit" ? s + r.count : s, 0))
      + evPrevData.filter((e: any) => e.event_type === "whatsapp_click" || e.event_type === "form_submit").length;

    const calcChange = (curr: number, prev: number) =>
      prev > 0 ? Number(((curr - prev) / prev * 100).toFixed(1)) : curr > 0 ? 100 : 0;

    const currConv = totalVisitors > 0 ? Number(((currLeadsTotal / totalVisitors) * 100).toFixed(2)) : 0;
    const prevConv = prevTotalVisitors > 0 ? Number(((prevLeadsTotal / prevTotalVisitors) * 100).toFixed(2)) : 0;
    const currValue = currLeadsTotal * LEAD_VALUE;
    const prevValue = prevLeadsTotal * LEAD_VALUE;

    const comparison = {
      visitors: calcChange(totalVisitors, prevTotalVisitors),
      views: calcChange(totalViews, prevTotalViews),
      leads: calcChange(currLeadsTotal, prevLeadsTotal),
      conversionRate: Number((currConv - prevConv).toFixed(2)),
      estimatedValue: calcChange(currValue, prevValue),
      prevVisitors: prevTotalVisitors,
      prevViews: prevTotalViews,
      prevLeads: prevLeadsTotal,
      prevConversionRate: prevConv,
      prevEstimatedValue: prevValue,
    };

    // ── 14. Conversions detail ────────────────────────────────────────────────
    const recentConvEvents = evData
      .filter((e: any) => ["whatsapp_click","form_submit","button_click","phone_click","email_click"].includes(e.event_type))
      .map((e: any) => ({ type: e.event_type, label: e.event_label, page: e.page_path, time: e.created_at, metadata: e.metadata }))
      .sort((a: any, b: any) => new Date(b.time).getTime() - new Date(a.time).getTime())
      .slice(0, 20);

    const conversions = {
      whatsapp_clicks: totalEventCounts["whatsapp_click"] || 0,
      button_clicks: totalEventCounts["button_click"] || 0,
      form_submissions: totalEventCounts["form_submit"] || 0,
      phone_clicks: totalEventCounts["phone_click"] || 0,
      email_clicks: totalEventCounts["email_click"] || 0,
      changes: {
        whatsapp: calcChange(totalEventCounts["whatsapp_click"] || 0, prevRollupEvents.find(r => r.event_type === "whatsapp_click")?.count || 0 + evPrevData.filter((e: any) => e.event_type === "whatsapp_click").length),
        buttons: calcChange(totalEventCounts["button_click"] || 0, prevRollupEvents.find(r => r.event_type === "button_click")?.count || 0 + evPrevData.filter((e: any) => e.event_type === "button_click").length),
        forms: calcChange(totalEventCounts["form_submit"] || 0, prevRollupEvents.find(r => r.event_type === "form_submit")?.count || 0 + evPrevData.filter((e: any) => e.event_type === "form_submit").length),
      },
      recent: recentConvEvents,
    };

    // ── 15. Active visitors (real-time, always from raw) ─────────────────────
    const fiveMinAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count: activeNow } = await supabaseAdmin
      .from("pageviews")
      .select("session_id", { count: "exact", head: true })
      .eq("project_id", projectId)
      .gte("created_at", fiveMinAgo);

    return new Response(
      JSON.stringify({
        client: {
          id: clientData.id,
          company_name: clientData.company_name,
          domain: clientData.domain,
          lead_value: LEAD_VALUE,
          project: currentProject,
          projects,
        },
        summary: {
          totalVisitors,
          totalViews,
          totalLeads: currLeadsTotal,
          totalSessions: combinedSessions,
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
        engagement: {
          bounceRate,
          avgSessionDuration,
          totalSessions: combinedSessions,
          pagesPerSession,
        },
        activeVisitors: activeNow || 0,
        source: "custom_tracking",
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
