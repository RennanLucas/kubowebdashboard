import type { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";

export async function checkSharedRateLimit(
  admin: SupabaseClient,
  scope: string,
  identifier: string,
  limit: number,
  windowSeconds = 60,
) {
  if (!identifier) throw new Error("RATE_LIMIT_UNAVAILABLE");
  const digest = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(identifier),
  );
  const hash = [...new Uint8Array(digest)].map((byte) =>
    byte.toString(16).padStart(2, "0")
  ).join("");
  let response;
  try {
    response = await admin.rpc("consume_request_limit", {
      p_scope: scope,
      p_subject_hash: hash,
      p_limit: limit,
      p_window_seconds: windowSeconds,
    });
  } catch {
    throw new Error("RATE_LIMIT_UNAVAILABLE");
  }
  const { data, error } = response;
  const result = Array.isArray(data) ? data[0] : null;
  const resetAt = Date.parse(result?.reset_at);
  if (
    error || typeof result?.allowed !== "boolean" ||
    !Number.isFinite(result?.remaining) || !Number.isFinite(resetAt)
  ) {
    // Never silently fall back to per-worker memory when the shared store fails.
    throw new Error("RATE_LIMIT_UNAVAILABLE");
  }
  return {
    allowed: result.allowed,
    remaining: result.remaining as number,
    resetAt,
  };
}
