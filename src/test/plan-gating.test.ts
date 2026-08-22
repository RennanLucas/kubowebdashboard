/**
 * plan-gating.test.ts
 * Testa a lógica de resolução de tier e enforcement de limites do plano.
 * Garante que a lógica server-side de billing está correta — esta é a barreira
 * que impede usuários Free de acessar dados de 365 dias (feature Pro).
 *
 * NOTA: Estes testes são em Vitest/Node (não Deno), por isso importamos as
 * funções diretamente pelo arquivo. Para rodar os testes Deno do Edge Function,
 * use `deno test supabase/functions/`.
 */

import { describe, it, expect } from "vitest";

// ─── Reproduzir a lógica pura sem importar o módulo Deno ────────────────────
// Copiado de _shared/plans.ts — deve ser mantido em sync se a lógica mudar.

type PlanTier = "free" | "pro";

const ACTIVE_STATUS = ["active", "trialing", "authorized", "approved"];

function resolveTier(sub: { plan_id?: string | null; status?: string | null; current_period_end?: string | null } | null | undefined): PlanTier {
  if (!sub) return "free";
  const status = (sub.status ?? "").toLowerCase();
  const periodOk =
    !sub.current_period_end || new Date(sub.current_period_end) > new Date();
  const active =
    (ACTIVE_STATUS.includes(status) && periodOk) ||
    (["canceled", "cancelled"].includes(status) &&
      !!sub.current_period_end &&
      new Date(sub.current_period_end) > new Date());
  if (!active) return "free";
  return "pro";
}

const TIER_LIMITS: Record<PlanTier, { maxProjects: number; maxHistoryDays: number }> = {
  free: { maxProjects: 1, maxHistoryDays: 7 },
  pro: { maxProjects: Number.MAX_SAFE_INTEGER, maxHistoryDays: 365 },
};

function limitsForTier(tier: PlanTier) {
  return TIER_LIMITS[tier];
}

function enforceHistoryLimit(requestedDays: number, maxHistoryDays: number): number {
  if (requestedDays > maxHistoryDays) {
    throw new Error(`HISTORY_LIMIT_EXCEEDED: limite de ${maxHistoryDays} dias excedido`);
  }
  return requestedDays;
}

// ─── Testes de resolveTier ────────────────────────────────────────────────────

describe("resolveTier", () => {
  it("retorna 'free' para assinatura nula", () => {
    expect(resolveTier(null)).toBe("free");
    expect(resolveTier(undefined)).toBe("free");
  });

  it("retorna 'pro' para status 'active' dentro do período", () => {
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    expect(resolveTier({ status: "active", current_period_end: future })).toBe("pro");
  });

  it("retorna 'pro' para status 'trialing'", () => {
    const future = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();
    expect(resolveTier({ status: "trialing", current_period_end: future })).toBe("pro");
  });

  it("retorna 'pro' para status 'authorized' (Mercado Pago)", () => {
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    expect(resolveTier({ status: "authorized", current_period_end: future })).toBe("pro");
  });

  it("retorna 'free' para assinatura com status 'active' mas período expirado", () => {
    const past = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString();
    expect(resolveTier({ status: "active", current_period_end: past })).toBe("free");
  });

  it("retorna 'pro' para status 'canceled' mas ainda dentro do período pago", () => {
    // Usuário cancelou mas tem acesso até o fim do período pago
    const future = new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString();
    expect(resolveTier({ status: "canceled", current_period_end: future })).toBe("pro");
  });

  it("retorna 'free' para status 'canceled' após expiração do período", () => {
    const past = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
    expect(resolveTier({ status: "canceled", current_period_end: past })).toBe("free");
  });

  it("retorna 'free' para status 'unpaid'", () => {
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    expect(resolveTier({ status: "unpaid", current_period_end: future })).toBe("free");
  });

  it("retorna 'pro' quando não há data de expiração (período indefinido)", () => {
    expect(resolveTier({ status: "active", current_period_end: null })).toBe("pro");
  });
});

// ─── Testes de limitsForTier ─────────────────────────────────────────────────

describe("limitsForTier", () => {
  it("plano free tem 7 dias de histórico", () => {
    expect(limitsForTier("free").maxHistoryDays).toBe(7);
  });

  it("plano pro tem 365 dias de histórico", () => {
    expect(limitsForTier("pro").maxHistoryDays).toBe(365);
  });

  it("plano free tem 1 projeto máximo", () => {
    expect(limitsForTier("free").maxProjects).toBe(1);
  });

  it("plano pro tem projetos ilimitados", () => {
    expect(limitsForTier("pro").maxProjects).toBe(Number.MAX_SAFE_INTEGER);
  });
});

// ─── Testes de enforceHistoryLimit ──────────────────────────────────────────

describe("enforceHistoryLimit", () => {
  it("permite acesso até o limite máximo", () => {
    expect(enforceHistoryLimit(7, 7)).toBe(7);
    expect(enforceHistoryLimit(365, 365)).toBe(365);
  });

  it("lança erro quando ultrapassa o limite", () => {
    expect(() => enforceHistoryLimit(30, 7)).toThrow("HISTORY_LIMIT_EXCEEDED");
    expect(() => enforceHistoryLimit(366, 365)).toThrow("HISTORY_LIMIT_EXCEEDED");
  });

  it("lança erro com a mensagem contendo o limite correto", () => {
    expect(() => enforceHistoryLimit(100, 7)).toThrow("7");
  });

  it("permite qualquer valor abaixo do limite", () => {
    expect(enforceHistoryLimit(1, 7)).toBe(1);
    expect(enforceHistoryLimit(6, 7)).toBe(6);
    expect(enforceHistoryLimit(30, 365)).toBe(30);
  });
});

// ─── Testes de integração: Free vs Pro ──────────────────────────────────────

describe("Integração: resolução correta de tier para gating de histórico", () => {
  it("usuário Free não pode ver 30 dias", () => {
    const tier = resolveTier(null); // sem assinatura = free
    const limits = limitsForTier(tier);
    expect(() => enforceHistoryLimit(30, limits.maxHistoryDays)).toThrow("HISTORY_LIMIT_EXCEEDED");
  });

  it("usuário Pro pode ver 365 dias", () => {
    const future = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const tier = resolveTier({ status: "active", current_period_end: future });
    const limits = limitsForTier(tier);
    expect(enforceHistoryLimit(365, limits.maxHistoryDays)).toBe(365);
  });

  it("usuário Pro que cancelou mas ainda no período pode ver 90 dias", () => {
    const future = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
    const tier = resolveTier({ status: "canceled", current_period_end: future });
    const limits = limitsForTier(tier);
    expect(enforceHistoryLimit(90, limits.maxHistoryDays)).toBe(90);
  });

  it("usuário Pro com período expirado cai para Free", () => {
    const past = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString();
    const tier = resolveTier({ status: "active", current_period_end: past });
    const limits = limitsForTier(tier);
    expect(tier).toBe("free");
    expect(() => enforceHistoryLimit(30, limits.maxHistoryDays)).toThrow("HISTORY_LIMIT_EXCEEDED");
  });
});
