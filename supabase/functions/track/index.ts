import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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
    const cfCountry = req.headers.get("cf-ipcountry") || 
                      req.headers.get("x-country") || null;

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    if (type === "event" && event_type) {
      // Insert into events table
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
      // Insert pageview (default behavior)
      const { error } = await supabaseAdmin.from("pageviews").insert({
        project_id: pid,
        page_path: path || "/",
        referrer: ref || null,
        user_agent: userAgent,
        country: cfCountry,
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