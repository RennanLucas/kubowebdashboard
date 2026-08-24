// Pure, dependency-free tracking-ingest logic extracted from index.ts so it can
// be unit-tested without booting Deno.serve. Nothing here imports a URL module
// (no supabase-js, no zod), which is what lets Vitest load this file directly.
// index.ts imports these back in — the runtime behavior is unchanged.

// ---------------------------------------------------------------------------
// Rate limiting (per Edge isolate, in-memory)
// ---------------------------------------------------------------------------

export const RATE_LIMIT_WINDOW_MS = 60000;
export const IP_MAX_PER_WINDOW = 100;
export const PROJECT_MAX_PER_WINDOW = 1000;

interface RateBucket {
  count: number;
  expiresAt: number;
}

export interface RateLimitState {
  ipLimits: Map<string, RateBucket>;
  pidLimits: Map<string, RateBucket>;
}

export function createRateLimitState(): RateLimitState {
  return { ipLimits: new Map(), pidLimits: new Map() };
}

// Module-level singleton preserves the original "one map per isolate" behavior.
// Atenção: contenção por isolate, não garante limite global entre instâncias Edge.
const defaultState = createRateLimitState();

export function checkRateLimit(
  ip: string | null,
  pids: string[],
  state: RateLimitState = defaultState,
): { allowed: boolean; reason?: string } {
  const now = Date.now();

  if (ip) {
    let ipRec = state.ipLimits.get(ip);
    if (!ipRec || ipRec.expiresAt < now) {
      ipRec = { count: 0, expiresAt: now + RATE_LIMIT_WINDOW_MS };
    }
    ipRec.count++;
    state.ipLimits.set(ip, ipRec);
    if (ipRec.count > IP_MAX_PER_WINDOW) return { allowed: false, reason: "IP_RATE_LIMITED" };
  }

  for (const pid of pids) {
    let pidRec = state.pidLimits.get(pid);
    if (!pidRec || pidRec.expiresAt < now) {
      pidRec = { count: 0, expiresAt: now + RATE_LIMIT_WINDOW_MS };
    }
    pidRec.count++;
    state.pidLimits.set(pid, pidRec);
    if (pidRec.count > PROJECT_MAX_PER_WINDOW) return { allowed: false, reason: "PROJECT_RATE_LIMITED" };
  }

  return { allowed: true };
}

// ---------------------------------------------------------------------------
// Request header parsing
// ---------------------------------------------------------------------------

export function getIP(req: Request): string | null {
  return req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
         req.headers.get("x-real-ip") ||
         req.headers.get("cf-connecting-ip") || null;
}

export function getCountryFromHeaders(req: Request): string | null {
  const candidates = ["cf-ipcountry", "x-country", "x-vercel-ip-country", "x-real-ip-country"];
  for (const h of candidates) {
    const val = req.headers.get(h);
    if (val && val !== "XX" && val !== "T1") return val.toUpperCase();
  }
  return null;
}

// ---------------------------------------------------------------------------
// Event -> DB row normalization (UTM extraction, event/pageview split)
// ---------------------------------------------------------------------------

export interface TrackEvent {
  type: "event" | "pageview";
  pid: string;
  path: string;
  ref?: string;
  sid?: string;
  event_id?: string;
  event_type?: string;
  event_label?: string;
  metadata?: Record<string, unknown>;
}

export interface RequestContext {
  userAgent: string | null;
  country: string | null;
  city: string | null;
}

export interface EventRow {
  project_id: string;
  event_type: string;
  event_label: string | null;
  page_path: string;
  session_id: string | null;
  metadata: Record<string, unknown>;
  event_id?: string;
}

export interface PageviewRow {
  project_id: string;
  page_path: string;
  referrer: string | null;
  user_agent: string | null;
  country: string | null;
  city: string | null;
  session_id: string | null;
  event_id?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
}

export function buildRowsFromEvents(
  events: TrackEvent[],
  activePids: Set<string>,
  ctx: RequestContext,
): { eventsToInsert: EventRow[]; pageviewsToInsert: PageviewRow[] } {
  const eventsToInsert: EventRow[] = [];
  const pageviewsToInsert: PageviewRow[] = [];

  for (const ev of events) {
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
        user_agent: ctx.userAgent,
        country: ctx.country,
        city: ctx.city,
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

  return { eventsToInsert, pageviewsToInsert };
}
