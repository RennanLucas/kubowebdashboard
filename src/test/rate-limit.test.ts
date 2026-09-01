import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

// O módulo de rate limit usa setInterval no import; mockamos timers para evitar leak
describe("rate-limit shared module", () => {
  let checkRateLimit: typeof import("../../supabase/functions/_shared/rate-limit.ts").checkRateLimit;
  let rateLimitResponse: typeof import("../../supabase/functions/_shared/rate-limit.ts").rateLimitResponse;

  beforeEach(async () => {
    vi.useFakeTimers();
    vi.resetModules();
    const mod = await import("../../supabase/functions/_shared/rate-limit.ts");
    checkRateLimit = mod.checkRateLimit;
    rateLimitResponse = mod.rateLimitResponse;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("permite a primeira requisição", () => {
    const r = checkRateLimit("user-1", 20, "user");
    expect(r.allowed).toBe(true);
    expect(r.remaining).toBe(19);
  });

  it("permite requisições dentro do limite", () => {
    for (let i = 0; i < 20; i++) {
      const r = checkRateLimit("user-2", 20, "user");
      expect(r.allowed).toBe(true);
    }
  });

  it("bloqueia ao ultrapassar o limite", () => {
    let last;
    for (let i = 0; i < 21; i++) {
      last = checkRateLimit("user-3", 20, "user");
    }
    expect(last!.allowed).toBe(false);
    expect(last!.remaining).toBe(0);
  });

  it("retorna 429 após ultrapassar (várias tentativas)", () => {
    for (let i = 0; i < 25; i++) {
      const r = checkRateLimit("user-4", 20, "user");
      if (i >= 20) expect(r.allowed).toBe(false);
    }
  });

  it("recupera após a janela de 60s expirar", () => {
    for (let i = 0; i < 21; i++) checkRateLimit("user-5", 20, "user");
    expect(checkRateLimit("user-5", 20, "user").allowed).toBe(false);

    // Avança 61 segundos
    vi.advanceTimersByTime(61_000);

    const afterWindow = checkRateLimit("user-5", 20, "user");
    expect(afterWindow.allowed).toBe(true);
  });

  it("isola usuários diferentes", () => {
    for (let i = 0; i < 21; i++) checkRateLimit("user-A", 20, "user");
    expect(checkRateLimit("user-A", 20, "user").allowed).toBe(false);

    // Usuário B não é afetado
    expect(checkRateLimit("user-B", 20, "user").allowed).toBe(true);
  });

  it("isola namespaces (user vs ip vs project)", () => {
    for (let i = 0; i < 21; i++) checkRateLimit("same-id", 20, "user");
    expect(checkRateLimit("same-id", 20, "user").allowed).toBe(false);

    // Mesmo identificador em namespace diferente não é bloqueado
    expect(checkRateLimit("same-id", 20, "ip").allowed).toBe(true);
    expect(checkRateLimit("same-id", 20, "project").allowed).toBe(true);
  });

  it("respeita limites customizados (5 req/min)", () => {
    let last;
    for (let i = 0; i < 6; i++) last = checkRateLimit("checkout-user", 5, "user");
    expect(last!.allowed).toBe(false);
  });

  it("permite identificador nulo (sem bloqueio)", () => {
    const r = checkRateLimit(null, 20, "user");
    expect(r.allowed).toBe(true);
  });

  it("rateLimitResponse retorna 429 com Retry-After", async () => {
    const resetAt = Date.now() + 30_000;
    const res = rateLimitResponse(resetAt, {});
    expect(res.status).toBe(429);
    expect(res.headers.get("Retry-After")).toBeTruthy();
    const body = await res.json();
    expect(body.error).toBe("Too Many Requests");
  });
});
