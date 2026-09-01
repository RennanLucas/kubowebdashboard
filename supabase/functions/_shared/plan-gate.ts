import type { SupabaseClient } from "@supabase/supabase-js";
import { resolveTier, limitsForTier, type PlanTier } from "./plans.ts";

export async function resolveProjectTier(
  supabaseAdmin: SupabaseClient,
  organizationId: string,
  userId: string
): Promise<{ tier: PlanTier; maxHistoryDays: number }> {
  const { data: orgSub } = await supabaseAdmin
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("organization_id", organizationId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: userSub } = await supabaseAdmin
    .from("subscriptions")
    .select("status, current_period_end")
    .eq("user_id", userId)
    .is("organization_id", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const orgTier = resolveTier(orgSub);
  const userTier = resolveTier(userSub);
  const finalTier = orgTier === "pro" || userTier === "pro" ? "pro" : "free";
  const limits = limitsForTier(finalTier);
  return { tier: finalTier, maxHistoryDays: limits.maxHistoryDays };
}

export function enforceHistoryLimit(requestedDays: number, maxHistoryDays: number): number {
  if (requestedDays > maxHistoryDays) {
    throw new Error(`HISTORY_LIMIT_EXCEEDED: O limite de historico do plano foi excedido. (${maxHistoryDays} dias maximo)`);
  }
  return requestedDays;
}

/**
 * Lê `?days=` com um piso seguro.
 *
 * `parseInt(null || "30")` devolve 30, mas `parseInt("abc")` devolve NaN — e
 * `NaN > maxHistoryDays` é false, então enforceHistoryLimit deixa passar. O NaN
 * então propaga até `startDate.setDate(... - (NaN - 1))`, e o `toISOString()`
 * seguinte lança RangeError: `?days=abc` virava 500. Aqui o valor inválido cai
 * no default e o gate de plano continua vendo o número pedido (sem clamp), para
 * que um pedido acima do plano ainda receba 403 em vez de ser silenciosamente
 * reduzido.
 */
export function parseDaysParam(raw: string | null, fallback = 30): number {
  const parsed = Number.parseInt(raw ?? "", 10);
  if (!Number.isFinite(parsed) || parsed < 1) return fallback;
  return parsed;
}

export function enforcePremiumFeature(tier: PlanTier, featureName: string) {
  if (tier !== "pro") {
    throw new Error(`PLAN_REQUIRED: A funcionalidade ${featureName} e exclusiva do plano Pro.`);
  }
}

/**
 * Traduz uma exceção do handler em resposta HTTP.
 *
 * Os erros de plano (`PLAN_REQUIRED` / `*_LIMIT_EXCEEDED`) são intencionalmente
 * legíveis pelo cliente — o frontend mostra a mensagem e oferece upgrade.
 * Qualquer outra exceção é interna (erro de Postgres, bug, timeout) e a
 * mensagem original fica só no log: devolvê-la revelava nomes de tabela,
 * constraint e detalhes de query para quem chamasse o endpoint.
 */
export function errorResponse(
  error: unknown,
  headers: Record<string, string>,
  context: string,
): Response {
  const message = error instanceof Error ? error.message : String(error);
  const isPlanRequired = message.includes("PLAN_REQUIRED");
  const isLimitExceeded = message.includes("LIMIT_EXCEEDED");

  if (!isPlanRequired && !isLimitExceeded) {
    console.error(`[${context}] unexpected error`, error);
  }

  const status = isPlanRequired ? 402 : isLimitExceeded ? 403 : 500;
  const body = isPlanRequired || isLimitExceeded ? message : "Erro interno";

  return new Response(JSON.stringify({ error: body }), {
    status,
    headers: { ...headers, "Content-Type": "application/json" },
  });
}
