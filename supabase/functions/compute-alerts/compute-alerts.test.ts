/**
 * Teste de regressão para P0: JWT validation vulnerability
 *
 * Garante que compute-alerts NUNCA aceite JWTs falsos, adulterados ou sem assinatura.
 * Apenas service_role key exato deve passar.
 */

import { assertEquals } from "https://deno.land/std@0.168.0/testing/asserts.ts";

const FUNCTION_URL = Deno.env.get("FUNCTION_URL") || "http://localhost:54321/functions/v1/compute-alerts";
const VALID_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "test-service-key";

Deno.test("compute-alerts: rejeita requisição sem Authorization", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  assertEquals(res.status, 401);
  const body = await res.json();
  assertEquals(body.error, "Unauthorized");
});

Deno.test("compute-alerts: rejeita token vazio", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Authorization": "Bearer ",
      "Content-Type": "application/json",
    },
  });
  assertEquals(res.status, 401);
});

Deno.test("compute-alerts: rejeita JWT falso com role=service_role", async () => {
  // JWT com header {alg: "none"} e payload {role: "service_role"}
  const fakeJwt = "eyJhbGciOiJub25lIn0.eyJyb2xlIjoic2VydmljZV9yb2xlIn0.";

  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${fakeJwt}`,
      "Content-Type": "application/json",
    },
  });
  assertEquals(res.status, 401);
});

Deno.test("compute-alerts: rejeita JWT adulterado", async () => {
  // JWT válido com assinatura modificada
  const tamperedJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiaWF0IjoxNjAwMDAwMDAwfQ.FAKE_SIGNATURE_TAMPERED";

  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${tamperedJwt}`,
      "Content-Type": "application/json",
    },
  });
  assertEquals(res.status, 401);
});

Deno.test("compute-alerts: rejeita JWT expirado", async () => {
  // JWT com exp no passado
  const expiredJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoic2VydmljZV9yb2xlIiwiZXhwIjoxNTAwMDAwMDAwfQ.fake";

  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${expiredJwt}`,
      "Content-Type": "application/json",
    },
  });
  assertEquals(res.status, 401);
});

Deno.test("compute-alerts: rejeita JWT de usuário comum", async () => {
  // JWT com role=authenticated (usuário comum)
  const userJwt = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYXV0aGVudGljYXRlZCIsInN1YiI6IjEyMzQ1Njc4OTAifQ.fake";

  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${userJwt}`,
      "Content-Type": "application/json",
    },
  });
  assertEquals(res.status, 401);
});

Deno.test("compute-alerts: rejeita token inválido aleatório", async () => {
  const randomToken = "random-invalid-token-12345";

  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${randomToken}`,
      "Content-Type": "application/json",
    },
  });
  assertEquals(res.status, 401);
});

Deno.test("compute-alerts: aceita service_role key correto", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${VALID_SERVICE_KEY}`,
      "Content-Type": "application/json",
    },
  });

  // Deve passar autenticação (200 ou erro de lógica de negócio, não 401)
  assertEquals(res.status !== 401, true);
});

Deno.test("compute-alerts: rejeita service_role key com caractere extra", async () => {
  const res = await fetch(FUNCTION_URL, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${VALID_SERVICE_KEY}x`,
      "Content-Type": "application/json",
    },
  });
  assertEquals(res.status, 401);
});
