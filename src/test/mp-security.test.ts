// @vitest-environment node
import { describe, expect, it } from "vitest";
import { getMpConfig } from "../../supabase/functions/_shared/mp-config";
import { verifyMpSignature } from "../../supabase/functions/mp-webhook/_signature";
import { checkoutUrlFromResponse } from "@/lib/payment-checkout";

function envOf(values: Record<string, string | undefined>) {
  return (name: string) => values[name];
}

async function sign(secret: string, dataId: string, requestId: string, ts: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`id:${dataId};request-id:${requestId};ts:${ts};`),
  );
  return Array.from(new Uint8Array(signed), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

describe("Mercado Pago environment isolation", () => {
  it("never falls back from sandbox to live credentials", () => {
    expect(getMpConfig(envOf({
      PAYMENTS_ENVIRONMENT: "sandbox",
      MERCADO_PAGO_ACCESS_TOKEN: "live-token",
      MP_WEBHOOK_SECRET: "live-secret",
    }))).toEqual({ environment: "sandbox", token: undefined, secret: undefined });
  });

  it("never falls back from live to sandbox credentials", () => {
    expect(getMpConfig(envOf({
      PAYMENTS_ENVIRONMENT: "live",
      MP_SANDBOX_ACCESS_TOKEN: "test-token",
      MP_SANDBOX_WEBHOOK_SECRET: "test-secret",
    }))).toEqual({ environment: "live", token: undefined, secret: undefined });
  });

  it("selects only the credentials for the configured environment", () => {
    expect(getMpConfig(envOf({
      PAYMENTS_ENVIRONMENT: "sandbox",
      MP_SANDBOX_ACCESS_TOKEN: "test-token",
      MP_SANDBOX_WEBHOOK_SECRET: "test-secret",
      MERCADO_PAGO_ACCESS_TOKEN: "live-token",
      MP_WEBHOOK_SECRET: "live-secret",
    }))).toEqual({ environment: "sandbox", token: "test-token", secret: "test-secret" });
  });

  it("rejects an unknown environment", () => {
    expect(() => getMpConfig(envOf({ PAYMENTS_ENVIRONMENT: "preview" }))).toThrow("PAYMENTS_ENVIRONMENT_INVALID");
  });
});

describe("real Mercado Pago signature verifier", () => {
  const secret = "webhook-secret";
  const requestId = "request-ABC_123";
  const ts = "1788748800";

  it("accepts a correctly signed, case-preserved data.id", async () => {
    const dataId = "AbC_123";
    const v1 = await sign(secret, dataId, requestId, ts);
    const request = new Request("https://example.test/webhook?data.id=AbC_123", {
      headers: { "x-request-id": requestId, "x-signature": `ts=${ts},v1=${v1}` },
    });
    await expect(verifyMpSignature(request, dataId, secret)).resolves.toBe(true);
  });

  it("rejects a signature if data.id casing is changed", async () => {
    const v1 = await sign(secret, "AbC_123", requestId, ts);
    const request = new Request("https://example.test/webhook", {
      headers: { "x-request-id": requestId, "x-signature": `ts=${ts},v1=${v1}` },
    });
    await expect(verifyMpSignature(request, "abc_123", secret)).resolves.toBe(false);
  });

  it.each([
    "ts=1788748800,ts=1788748801,v1=" + "a".repeat(64),
    "ts=1788748800,v1=" + "a".repeat(63),
    "ts=not-a-time,v1=" + "a".repeat(64),
    "v1=" + "a".repeat(64),
  ])("rejects malformed signature headers", async (signature) => {
    const request = new Request("https://example.test/webhook", {
      headers: { "x-request-id": requestId, "x-signature": signature },
    });
    await expect(verifyMpSignature(request, "AbC_123", secret)).resolves.toBe(false);
  });
});

describe("checkout redirect validation", () => {
  it("accepts the Mercado Pago URL only from the current environment", () => {
    expect(checkoutUrlFromResponse({
      environment: "live",
      url: "https://www.mercadopago.com.br/subscriptions/checkout?id=abc",
    })).toContain("mercadopago.com.br/subscriptions/checkout");
  });

  it("blocks sandbox/live mismatches before navigation", () => {
    expect(() => checkoutUrlFromResponse({
      environment: "sandbox",
      url: "https://www.mercadopago.com.br/subscriptions/checkout?id=abc",
    })).toThrow(/ambiente diferente/);
  });

  it("blocks an untrusted redirect URL", () => {
    expect(() => checkoutUrlFromResponse({
      environment: "live",
      url: "https://example.test/fake-checkout",
    })).toThrow(/endereço de pagamento inválido/);
  });
});
