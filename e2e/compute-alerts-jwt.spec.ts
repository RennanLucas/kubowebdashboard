import { test, expect } from "@playwright/test";

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || "https://mgiwqgmgipyysbgmhyrh.supabase.co";
const ENDPOINT = `${SUPABASE_URL}/functions/v1/compute-alerts`;

test.describe("compute-alerts JWT validation", () => {
  test("rejeita requisição sem Authorization", async ({ request }) => {
    const res = await request.post(ENDPOINT);
    expect(res.status()).toBe(401);
  });

  test("rejeita token vazio", async ({ request }) => {
    const res = await request.post(ENDPOINT, {
      headers: { Authorization: "Bearer " },
    });
    expect(res.status()).toBe(401);
  });

  test("rejeita JWT falso sem assinatura", async ({ request }) => {
    const fakeJwt = "eyJhbGciOiJub25lIn0.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.fake";
    const res = await request.post(ENDPOINT, {
      headers: { Authorization: `Bearer ${fakeJwt}` },
    });
    expect(res.status()).toBe(401);
    const body = await res.json().catch(() => ({}));
    expect(body.error).toMatch(/unauthorized/i);
  });

  test("rejeita JWT adulterado com assinatura inválida", async ({ request }) => {
    const tamperedJwt =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjAwMDAwMDAwfQ.FAKE_SIGNATURE_TAMPERED";
    const res = await request.post(ENDPOINT, {
      headers: { Authorization: `Bearer ${tamperedJwt}` },
    });
    expect(res.status()).toBe(401);
  });

  test("rejeita JWT expirado", async ({ request }) => {
    const expiredJwt =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiZXhwIjoxNTAwMDAwMDAwfQ.fake";
    const res = await request.post(ENDPOINT, {
      headers: { Authorization: `Bearer ${expiredJwt}` },
    });
    expect(res.status()).toBe(401);
  });

  test("rejeita JWT de usuário comum (role: authenticated)", async ({ request }) => {
    const userJwt =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYXV0aGVudGljYXRlZCIsInN1YiI6IjEyMzQ1Njc4OTAifQ.fake";
    const res = await request.post(ENDPOINT, {
      headers: { Authorization: `Bearer ${userJwt}` },
    });
    expect(res.status()).toBe(401);
  });

  test("rejeita token aleatório", async ({ request }) => {
    const res = await request.post(ENDPOINT, {
      headers: { Authorization: "Bearer random-invalid-token-12345" },
    });
    expect(res.status()).toBe(401);
  });

});
