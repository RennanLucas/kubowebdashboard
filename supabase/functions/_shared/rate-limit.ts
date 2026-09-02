/**
 * Rate limiting para Edge Functions
 *
 * LIMITAÇÃO: Este rate limiter é por-isolate (in-memory), não global.
 * Cada região/worker tem seu próprio contador. Para rate limiting global,
 * seria necessário Upstash Redis ou similar.
 *
 * Para SaaS em produção com múltiplas regiões, considere migrar para Upstash.
 */

interface RateLimitRecord {
  count: number;
  windowStart: number;
}

interface RateLimitState {
  users: Map<string, RateLimitRecord>;
  ips: Map<string, RateLimitRecord>;
  projects: Map<string, RateLimitRecord>;
}

const WINDOW_MS = 60_000; // 1 minuto

// Estado global do isolate
const state: RateLimitState = {
  users: new Map(),
  ips: new Map(),
  projects: new Map(),
};

/**
 * Verifica se uma requisição deve ser rate-limited
 *
 * @param identifier - user_id, IP, ou project_id
 * @param limit - número máximo de requisições por janela
 * @param type - tipo de identificador para isolamento de namespace
 * @returns true se permitido, false se rate limited
 */
export function checkRateLimit(
  identifier: string | null,
  limit: number,
  type: "user" | "ip" | "project" = "user"
): { allowed: boolean; remaining: number; resetAt: number } {
  if (!identifier) {
    return { allowed: true, remaining: limit, resetAt: Date.now() + WINDOW_MS };
  }

  const now = Date.now();
  const map = type === "user" ? state.users : type === "ip" ? state.ips : state.projects;

  const record = map.get(identifier);

  // Nova janela
  if (!record || now - record.windowStart >= WINDOW_MS) {
    map.set(identifier, { count: 1, windowStart: now });
    return {
      allowed: true,
      remaining: limit - 1,
      resetAt: now + WINDOW_MS,
    };
  }

  // Dentro da janela
  record.count++;

  if (record.count > limit) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: record.windowStart + WINDOW_MS,
    };
  }

  return {
    allowed: true,
    remaining: limit - record.count,
    resetAt: record.windowStart + WINDOW_MS,
  };
}

/**
 * Retorna resposta 429 com headers apropriados.
 *
 * `limit` é opcional para manter compatibilidade com as chamadas existentes,
 * mas quando informado o header X-RateLimit-Limit reflete o limite real da
 * função (que varia de 5 a 200 dependendo do endpoint).
 */
export function rateLimitResponse(
  resetAt: number,
  headers: Record<string, string> = {},
  limit?: number,
): Response {
  const retryAfter = Math.ceil((resetAt - Date.now()) / 1000);

  return new Response(
    JSON.stringify({
      error: "Too Many Requests",
      message: "Você excedeu o limite de requisições. Tente novamente em alguns segundos.",
      retry_after_seconds: retryAfter,
    }),
    {
      status: 429,
      headers: {
        ...headers,
        "Content-Type": "application/json",
        "Retry-After": String(retryAfter),
        ...(limit !== undefined ? { "X-RateLimit-Limit": String(limit) } : {}),
        "X-RateLimit-Reset": new Date(resetAt).toISOString(),
      },
    }
  );
}

/**
 * Cleanup periódico (executado automaticamente a cada 5 minutos)
 * Remove entradas expiradas para evitar memory leak
 */
function cleanup() {
  const now = Date.now();
  const maps = [state.users, state.ips, state.projects];

  for (const map of maps) {
    for (const [key, record] of map.entries()) {
      if (now - record.windowStart >= WINDOW_MS * 2) {
        map.delete(key);
      }
    }
  }
}

// Cleanup automático a cada 5 minutos
setInterval(cleanup, 5 * 60_000);
