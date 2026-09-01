import { test, expect } from "@playwright/test";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://mgiwqgmgipyysbgmhyrh.supabase.co";

// Mock JWT válido (role: authenticated) — será rejeitado por falta de dados reais, mas serve para testar rate limit
const MOCK_JWT = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYXV0aGVudGljYXRlZCIsInN1YiI6InRlc3QtdXNlciJ9.mock";

test.describe("Rate limiting em endpoints autenticados", () => {
  test("get-dashboard-pages: bloqueia após 20 req/min", async ({ request }) => {
    const endpoint = `${SUPABASE_URL}/functions/v1/get-dashboard-pages`;

    let lastResponse;
    for (let i = 0; i < 22; i++) {
      lastResponse = await request.post(endpoint, {
        headers: { Authorization: `Bearer ${MOCK_JWT}` },
        data: { projectId: "test-project", days: 7 },
      });

      // Primeiras 20 podem retornar 401 (sem dados) ou 200, mas não 429
      if (i < 20) {
        expect([200, 401, 403]).toContain(lastResponse.status());
      }
    }

    // Após 20 requisições, deve retornar 429
    expect(lastResponse!.status()).toBe(429);
    const body = await lastResponse!.json().catch(() => ({}));
    expect(body.error).toMatch(/too many requests/i);
    expect(lastResponse!.headers()["retry-after"]).toBeTruthy();
  });

  test("create-mp-preference: bloqueia após 5 req/min", async ({ request }) => {
    const endpoint = `${SUPABASE_URL}/functions/v1/create-mp-preference`;

    let lastResponse;
    for (let i = 0; i < 7; i++) {
      lastResponse = await request.post(endpoint, {
        headers: { Authorization: `Bearer ${MOCK_JWT}` },
        data: { planId: "pro", returnUrl: "https://kuboweb.com.br" },
      });

      if (i < 5) {
        expect([200, 401, 403, 400]).toContain(lastResponse.status());
      }
    }

    expect(lastResponse!.status()).toBe(429);
  });

  test("create-invite: bloqueia após 10 req/min", async ({ request }) => {
    const endpoint = `${SUPABASE_URL}/functions/v1/create-invite`;

    let lastResponse;
    for (let i = 0; i < 12; i++) {
      lastResponse = await request.post(endpoint, {
        headers: { Authorization: `Bearer ${MOCK_JWT}` },
        data: { organizationId: "test-org", email: "test@example.com", role: "viewer" },
      });

      if (i < 10) {
        expect([200, 401, 403, 400]).toContain(lastResponse.status());
      }
    }

    expect(lastResponse!.status()).toBe(429);
  });

  test("rate limit isola usuários diferentes", async ({ request }) => {
    const endpoint = `${SUPABASE_URL}/functions/v1/get-dashboard-pages`;

    // Esgota limite do usuário A
    for (let i = 0; i < 21; i++) {
      await request.post(endpoint, {
        headers: { Authorization: `Bearer user-A-token-mock` },
        data: { projectId: "test", days: 7 },
      });
    }

    const blockedA = await request.post(endpoint, {
      headers: { Authorization: `Bearer user-A-token-mock` },
      data: { projectId: "test", days: 7 },
    });
    expect(blockedA.status()).toBe(429);

    // Usuário B não deve estar bloqueado
    const allowedB = await request.post(endpoint, {
      headers: { Authorization: `Bearer user-B-token-mock` },
      data: { projectId: "test", days: 7 },
    });
    expect([200, 401, 403]).toContain(allowedB.status());
    expect(allowedB.status()).not.toBe(429);
  });

  test("mp-webhook: bloqueia após 100 req/min por IP", async ({ request }) => {
    const endpoint = `${SUPABASE_URL}/functions/v1/mp-webhook`;

    // Webhook não usa JWT, usa validação de assinatura MP
    // Todos serão rejeitados (assinatura inválida), mas podemos testar o rate limit
    let lastResponse;
    for (let i = 0; i < 102; i++) {
      lastResponse = await request.post(endpoint, {
        data: { type: "payment", data: { id: "12345" } },
      });

      // Primeiras 100: rejeitadas por assinatura (401) ou aceitas se de alguma forma passarem
      if (i < 100) {
        expect([200, 401]).toContain(lastResponse.status());
      }
    }

    // Após 100, deve ser 429 por rate limit
    expect(lastResponse!.status()).toBe(429);
  });
});
