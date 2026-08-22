import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { z } from "https://esm.sh/zod@3.23.8";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Rate Limiting in-memory (Per Edge Isolate)
// Atenção: Esta é uma camada de contenção por isolate e não garante limite global entre todas as instâncias Edge.
const ipLimits = new Map<string, { count: number; expiresAt: number }>();
const pidLimits = new Map<string, { count: number; expiresAt: number }>();

function checkRateLimit(ip: string | null, pids: string[]): { allowed: boolean; reason?: string } {
  const now = Date.now();
  
  if (ip) {
    let ipRec = ipLimits.get(ip);
    if (!ipRec || ipRec.expiresAt < now) {
      ipRec = { count: 0, expiresAt: now + 60000 };
    }
    ipRec.count++;
    ipLimits.set(ip, ipRec);
    if (ipRec.count > 100) return { allowed: false, reason: "IP_RATE_LIMITED" };
  }

  for (const pid of pids) {
    let pidRec = pidLimits.get(pid);
    if (!pidRec || pidRec.expiresAt < now) {
      pidRec = { count: 0, expiresAt: now + 60000 };
    }
    pidRec.count++;
    pidLimits.set(pid, pidRec);
    if (pidRec.count > 1000) return { allowed: false, reason: "PROJECT_RATE_LIMITED" };
  }

  return { allowed: true };
}

// Zod Schemas for Payload Validation
const eventSchema = z.object({
  type: z.enum(["event", "pageview"]).optional().default("pageview"),
  pid: z.string().min(10).max(100),
  path: z.string().max(1000).optional().default("/"),
  ref: z.string().max(1000).optional(),
  sid: z.string().max(200).optional(),
  event_id: z.string().uuid().optional(), // Idempotency key for deduplication
  event_type: z.string().max(200).optional(),
  event_label: z.string().max(1000).optional(),
  metadata: z.record(z.unknown()).optional(),
});

// Cache for plan status
interface ProjectStatus {
  active: boolean;
  reason?: 'NOT_FOUND' | 'INACTIVE' | 'ERROR';
}

const planCache = new Map<string, { status: ProjectStatus; expiresAt: number }>();

async function isProjectActive(pid: string, supabaseAdmin: SupabaseClient): Promise<ProjectStatus> {
  const now = Date.now();
  const cached = planCache.get(pid);
  if (cached && cached.expiresAt > now) {
    return cached.status;
  }

  try {
    const { data: projectData } = await supabaseAdmin
      .from("projects")
      .select("organization_id, clients(user_id)")
      .eq("id", pid)
      .maybeSingle();

    if (!projectData) {
      const status: ProjectStatus = { active: false, reason: 'NOT_FOUND' };
      planCache.set(pid, { status, expiresAt: now + 5 * 60 * 1000 });
      return status;
    }

    let isActive = true;

    // 1. Tenta a assinatura da Organização (Fase 3 Multi-tenant)
    if (projectData.organization_id) {
      const { data: orgSub } = await supabaseAdmin
        .from("subscriptions")
        .select("status")
        .eq("organization_id", projectData.organization_id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (orgSub) {
        isActive = !["canceled", "unpaid"].includes(orgSub.status);
      }
    } else if (projectData.clients?.user_id) {
      // 2. Fallback de Migração: Usa a assinatura legada do user_id do client
      const { data: subData } = await supabaseAdmin
        .from("subscriptions")
        .select("status, organization_id")
        .eq("user_id", projectData.clients.user_id)
        .is("organization_id", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (subData && ["canceled", "unpaid"].includes(subData.status)) {
        isActive = false;
      }
    }

    const status: ProjectStatus = { active: isActive, reason: isActive ? undefined : 'INACTIVE' };
    planCache.set(pid, { status, expiresAt: now + 5 * 60 * 1000 });
    return status;
  } catch (e) {
    // Fail closed: qualquer erro resulta em DENY de tracking.
    return { active: false, reason: 'ERROR' };
  }
}

function getIP(req: Request): string | null {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
         req.headers.get("x-real-ip") ||
         req.headers.get("cf-connecting-ip") || null;
}

function getCountryFromHeaders(req: Request): string | null {
  const candidates = ["cf-ipcountry", "x-country", "x-vercel-ip-country", "x-real-ip-country"];
  for (const h of candidates) {
    const val = req.headers.get(h);
    if (val && val !== "XX" && val !== "T1") return val.toUpperCase();
  }
  return null;
}

async function getGeoFromIP(req: Request): Promise<{ country: string | null; city: string | null }> {
  try {
    const ip = getIP(req);
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
  } catch (_err) { 
    // Ignore IP fetching errors
  }
  return { country: null, city: null };
}

function jsonResponse(body: unknown, status: number = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: { code: "METHOD_NOT_ALLOWED", message: "Only POST allowed" } }, 405);
  }

  let body;
  try {
    // Limits body size theoretically, req.json() buffers.
    body = await req.json();
  } catch (e) {
    return jsonResponse({ error: { code: "BAD_REQUEST", message: "Invalid JSON body" } }, 400);
  }

  try {
    // Normalization
    const payloadEvents = Array.isArray(body.events) ? body.events : [body];
    
    // Batch limit: max 30 events per request
    if (payloadEvents.length > 30) {
      return jsonResponse({ error: { code: "PAYLOAD_TOO_LARGE", message: "Max 30 events per batch" } }, 413);
    }
    
    if (payloadEvents.length === 0) {
      return jsonResponse({ ok: true });
    }

    // Validation via Zod
    const parsedEvents: z.infer<typeof eventSchema>[] = [];
    for (const ev of payloadEvents) {
      const result = eventSchema.safeParse(ev);
      if (!result.success) {
        console.error(JSON.stringify({ event: "validation_failed", errors: result.error.errors }));
        return jsonResponse({ error: { code: "UNPROCESSABLE_ENTITY", message: "Invalid event format" } }, 422);
      }
      parsedEvents.push(result.data);
    }

    // Identify unique PIDs
    const pids = [...new Set(parsedEvents.map(e => e.pid))];
    const ip = getIP(req);

    // Rate Limiting
    const rateLimit = checkRateLimit(ip, pids);
    if (!rateLimit.allowed) {
      console.error(JSON.stringify({ event: "tracking_rejected", code: rateLimit.reason, ip, pids }));
      return jsonResponse({ error: { code: "RATE_LIMITED", message: "Too many requests" } }, 429);
    }

    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const userAgent = req.headers.get("user-agent") || null;
    let country = getCountryFromHeaders(req);
    let city: string | null = null;
    if (!country) {
      const geo = await getGeoFromIP(req);
      country = geo.country;
      city = geo.city;
    }

    const activePids = new Set<string>();
    let lastReason: 'NOT_FOUND' | 'INACTIVE' | 'ERROR' | undefined = undefined;
    
    for (const pid of pids) {
      const status = await isProjectActive(pid, supabaseAdmin);
      if (status.active) {
        activePids.add(pid);
      } else {
        lastReason = status.reason;
      }
    }

    if (activePids.size === 0) {
      if (lastReason === 'NOT_FOUND') {
        return jsonResponse({ error: { code: "PROJECT_NOT_FOUND", message: "Project not found" } }, 404);
      } else if (lastReason === 'INACTIVE') {
        return jsonResponse({ error: { code: "PROJECT_INACTIVE", message: "Project or subscription is inactive" } }, 403);
      } else {
        return jsonResponse({ error: { code: "PROJECT_VALIDATION_ERROR", message: "Error validating project" } }, 500);
      }
    }

    const eventsToInsert = [];
    const pageviewsToInsert = [];

    for (const ev of parsedEvents) {
      if (!activePids.has(ev.pid)) continue;

      if (ev.type === "event" && ev.event_type) {
        eventsToInsert.push({
          project_id: ev.pid,
          event_type: ev.event_type,
          event_label: ev.event_label || null,
          page_path: ev.path,
          session_id: ev.sid || null,
          metadata: ev.metadata || {},
          ...(ev.event_id ? { event_id: ev.event_id } : {}),
        });
      } else if (ev.type === "pageview") {
        // Extrair UTMs do campo metadata (enviado pelo tracker client)
        const meta = (ev.metadata || {}) as Record<string, unknown>;
        pageviewsToInsert.push({
          project_id: ev.pid,
          page_path: ev.path,
          referrer: ev.ref || null,
          user_agent: userAgent,
          country: country,
          city: city,
          session_id: ev.sid || null,
          ...(ev.event_id ? { event_id: ev.event_id } : {}),
          ...(meta.utm_source ? { utm_source: String(meta.utm_source) } : {}),
          ...(meta.utm_medium ? { utm_medium: String(meta.utm_medium) } : {}),
          ...(meta.utm_campaign ? { utm_campaign: String(meta.utm_campaign) } : {}),
          ...(meta.utm_term ? { utm_term: String(meta.utm_term) } : {}),
          ...(meta.utm_content ? { utm_content: String(meta.utm_content) } : {}),
        });
      }
    }

    let inserted = 0;

    if (eventsToInsert.length > 0) {
      // ignoreDuplicates: true → ON CONFLICT DO NOTHING (deduplication via event_id unique constraint)
      const { error } = await supabaseAdmin.from("events").insert(eventsToInsert, { ignoreDuplicates: true });
      if (error) {
        console.error(JSON.stringify({ event: "db_insert_error", target: "events", details: error.message }));
        return jsonResponse({ error: { code: "INTERNAL_ERROR", message: "Failed to store events" } }, 500);
      }
      inserted += eventsToInsert.length;
    }
    
    if (pageviewsToInsert.length > 0) {
      // ignoreDuplicates: true → ON CONFLICT DO NOTHING (deduplication via event_id unique constraint)
      const { error } = await supabaseAdmin.from("pageviews").insert(pageviewsToInsert, { ignoreDuplicates: true });
      if (error) {
        console.error(JSON.stringify({ event: "db_insert_error", target: "pageviews", details: error.message }));
        return jsonResponse({ error: { code: "INTERNAL_ERROR", message: "Failed to store pageviews" } }, 500);
      }
      inserted += pageviewsToInsert.length;
    }

    return jsonResponse({ ok: true, processed: inserted });
  } catch (e: unknown) {
    console.error(JSON.stringify({ event: "internal_error", details: (e as Error)?.message || "Unknown error" }));
    return jsonResponse({ error: { code: "INTERNAL_ERROR", message: "Internal server error" } }, 500);
  }
});
