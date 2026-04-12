import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function getCountryFromHeaders(req: Request): string | null {
  // Try multiple Cloudflare / proxy headers (case-insensitive in Deno)
  const candidates = [
    "cf-ipcountry",
    "x-country",
    "x-vercel-ip-country",
    "x-real-ip-country",
  ];
  for (const h of candidates) {
    const val = req.headers.get(h);
    if (val && val !== "XX" && val !== "T1") return val.toUpperCase();
  }
  return null;
}

async function getGeoFromIP(req: Request): Promise<{ country: string | null; city: string | null }> {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
               req.headers.get("x-real-ip") ||
               req.headers.get("cf-connecting-ip");
    if (!ip || ip === "127.0.0.1" || ip.startsWith("10.") || ip.startsWith("192.168.")) return { country: null, city: null };

    const res = await fetch(`https://ipapi.co/${ip}/json/`, {
      signal: AbortSignal.timeout(2000),
    });
    if (res.ok) {
      const data = await res.json();
      const country = data.country_code && data.country_code.length === 2 ? data.country_code.toUpperCase() : null;
      const city = data.city || null;
      return { country, city };
    }
  } catch {
    // Geo lookup failed silently
  }
  return { country: null, city: null };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405, headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const { type, pid, path, ref, sid, event_type, event_label, metadata } = body;

    if (!pid || typeof pid !== "string") {
      return new Response(JSON.stringify({ error: "Missing pid" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userAgent = req.headers.get("user-agent") || null;
    
    // Try headers first, then fallback to IP geo lookup
    let country = getCountryFromHeaders(req);
    if (!country) {
      country = await getCountryFromIP(req);
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (type === "event" && event_type) {
      const { error } = await supabaseAdmin.from("events").insert({
        project_id: pid,
        event_type: event_type,
        event_label: event_label || null,
        page_path: path || "/",
        session_id: sid || null,
        metadata: metadata || {},
      });

      if (error) {
        console.error("Event insert error:", error.message);
        return new Response(JSON.stringify({ error: "Failed to record event" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      const { error } = await supabaseAdmin.from("pageviews").insert({
        project_id: pid,
        page_path: path || "/",
        referrer: ref || null,
        user_agent: userAgent,
        country: country,
        session_id: sid || null,
      });

      if (error) {
        console.error("Insert error:", error.message);
        return new Response(JSON.stringify({ error: "Failed to record" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Track error:", e);
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
