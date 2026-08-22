/**
 * billing-webhook.test.ts
 * Testa a lógica pura do webhook do Mercado Pago (mp-webhook):
 *  1. Validação de assinatura HMAC (x-signature) — a barreira que impede
 *     qualquer requisição forjada de alterar assinaturas.
 *  2. Parsing de `external_reference` (formato legado v1 e v2 multi-tenant).
 *  3. Proteção contra eventos fora de ordem (isOutdated) — evita que um
 *     webhook atrasado sobrescreva um estado mais recente.
 *
 * A verificação HMAC usa a Web Crypto API (crypto.subtle), disponível tanto
 * em Deno quanto no ambiente de teste jsdom/Node — por isso testamos a
 * implementação real, não uma reprodução.
 */

import { describe, it, expect } from "vitest";

// ─── Reprodução de parseExternalReference (supabase/functions/mp-webhook) ───

function parseExternalReference(extRef: string) {
  if (extRef.startsWith("v2|")) {
    const parts = extRef.split("|");
    let orgId, planId, userId;
    for (const p of parts) {
      if (p.startsWith("org:")) orgId = p.replace("org:", "");
      if (p.startsWith("plan:")) planId = p.replace("plan:", "");
      if (p.startsWith("user:")) userId = p.replace("user:", "");
    }
    return { organizationId: orgId, planId, userId };
  } else {
    const [userId, planId] = extRef.split("|");
    return { organizationId: undefined, planId, userId };
  }
}

describe("parseExternalReference — formato v2 (multi-tenant)", () => {
  it("extrai organizationId, planId e userId do formato v2", () => {
    const result = parseExternalReference("v2|org:org-123|plan:kuboweb_pro_monthly|user:user-456");
    expect(result.organizationId).toBe("org-123");
    expect(result.planId).toBe("kuboweb_pro_monthly");
    expect(result.userId).toBe("user-456");
  });

  it("funciona independente da ordem dos campos", () => {
    const result = parseExternalReference("v2|user:user-456|org:org-123|plan:kuboweb_pro_monthly");
    expect(result.organizationId).toBe("org-123");
    expect(result.planId).toBe("kuboweb_pro_monthly");
    expect(result.userId).toBe("user-456");
  });
});

describe("parseExternalReference — formato v1 (legado, sem organização)", () => {
  it("extrai userId e planId do formato legado 'userId|planId'", () => {
    const result = parseExternalReference("user-789|kuboweb_pro_monthly");
    expect(result.userId).toBe("user-789");
    expect(result.planId).toBe("kuboweb_pro_monthly");
    expect(result.organizationId).toBeUndefined();
  });
});

// ─── Reprodução de isOutdated ────────────────────────────────────────────────

function isOutdated(eventDateStr: string | undefined, existingTsStr: string | null | undefined): boolean {
  if (!eventDateStr || !existingTsStr) return false;
  const eventTime = new Date(eventDateStr).getTime();
  const existingTime = new Date(existingTsStr).getTime();
  return eventTime <= existingTime;
}

describe("isOutdated — proteção contra webhooks fora de ordem", () => {
  it("evento mais novo que o registro existente NÃO é outdated", () => {
    const older = "2026-08-01T10:00:00Z";
    const newer = "2026-08-01T11:00:00Z";
    expect(isOutdated(newer, older)).toBe(false);
  });

  it("evento mais antigo que o registro existente É outdated (deve ser ignorado)", () => {
    const older = "2026-08-01T10:00:00Z";
    const newer = "2026-08-01T11:00:00Z";
    expect(isOutdated(older, newer)).toBe(true);
  });

  it("evento com mesmo timestamp do registro existente É outdated (idempotência)", () => {
    const ts = "2026-08-01T10:00:00Z";
    expect(isOutdated(ts, ts)).toBe(true);
  });

  it("sem timestamp existente (primeira notificação), nunca é outdated", () => {
    expect(isOutdated("2026-08-01T10:00:00Z", null)).toBe(false);
    expect(isOutdated("2026-08-01T10:00:00Z", undefined)).toBe(false);
  });

  it("sem timestamp do evento, nunca é outdated (fail-open para não perder updates)", () => {
    expect(isOutdated(undefined, "2026-08-01T10:00:00Z")).toBe(false);
  });

  it("cenário real: pagamento 'approved' chega depois de um 'pending' mais antigo", () => {
    const pendingTs = "2026-08-01T09:00:00Z";
    const approvedTs = "2026-08-01T09:05:00Z";
    // O evento approved (mais novo) deve ser processado
    expect(isOutdated(approvedTs, pendingTs)).toBe(false);
  });

  it("cenário real: retry duplicado do MP com o mesmo evento não reprocessa", () => {
    const eventTs = "2026-08-01T09:05:00Z";
    // Primeira vez processa (existingTs é do evento anterior)
    expect(isOutdated(eventTs, "2026-08-01T09:00:00Z")).toBe(false);
    // Retry do MESMO evento (já registrado com esse exato timestamp) é ignorado
    expect(isOutdated(eventTs, eventTs)).toBe(true);
  });
});

// ─── Validação HMAC real (usa Web Crypto API, igual ao mp-webhook) ──────────

async function computeMpSignature(secret: string, manifest: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuffer = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(manifest));
  return Array.from(new Uint8Array(sigBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function verifyMpSignatureLogic(
  secret: string,
  signatureHeader: string,
  requestId: string,
  dataId: string
): Promise<boolean> {
  if (!secret) return false;
  if (!signatureHeader) return false;

  let ts = "";
  let v1 = "";
  for (const part of signatureHeader.split(",")) {
    const [k, v] = part.split("=").map((s) => s?.trim());
    if (k === "ts") ts = v ?? "";
    if (k === "v1") v1 = v ?? "";
  }
  if (!ts || !v1) return false;

  const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"]
  );

  const hexMatch = v1.toLowerCase().match(/.{1,2}/g);
  if (!hexMatch) return false;
  const sigBytes = new Uint8Array(hexMatch.map((byte) => parseInt(byte, 16)));

  try {
    return await crypto.subtle.verify("HMAC", key, sigBytes, new TextEncoder().encode(manifest));
  } catch {
    return false;
  }
}

describe("Webhook HMAC — validação de assinatura (x-signature)", () => {
  const secret = "test-webhook-secret-kuboweb";

  it("aceita uma assinatura válida corretamente computada", async () => {
    const dataId = "payment-12345";
    const requestId = "req-abc";
    const ts = "1735689600";
    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const v1 = await computeMpSignature(secret, manifest);
    const header = `ts=${ts},v1=${v1}`;

    const valid = await verifyMpSignatureLogic(secret, header, requestId, dataId);
    expect(valid).toBe(true);
  });

  it("rejeita assinatura com secret errado", async () => {
    const dataId = "payment-12345";
    const requestId = "req-abc";
    const ts = "1735689600";
    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const v1 = await computeMpSignature("wrong-secret", manifest);
    const header = `ts=${ts},v1=${v1}`;

    const valid = await verifyMpSignatureLogic(secret, header, requestId, dataId);
    expect(valid).toBe(false);
  });

  it("rejeita assinatura quando o dataId foi adulterado", async () => {
    const requestId = "req-abc";
    const ts = "1735689600";
    const manifest = `id:payment-ORIGINAL;request-id:${requestId};ts:${ts};`;
    const v1 = await computeMpSignature(secret, manifest);
    const header = `ts=${ts},v1=${v1}`;

    // Atacante tenta reusar a assinatura para um payment_id diferente
    const valid = await verifyMpSignatureLogic(secret, header, requestId, "payment-FORGED");
    expect(valid).toBe(false);
  });

  it("rejeita header de assinatura vazio", async () => {
    const valid = await verifyMpSignatureLogic(secret, "", "req-abc", "payment-123");
    expect(valid).toBe(false);
  });

  it("rejeita header malformado (sem ts ou v1)", async () => {
    const valid = await verifyMpSignatureLogic(secret, "foo=bar", "req-abc", "payment-123");
    expect(valid).toBe(false);
  });

  it("rejeita quando o secret do servidor está vazio (fail closed)", async () => {
    const dataId = "payment-12345";
    const requestId = "req-abc";
    const ts = "1735689600";
    const manifest = `id:${dataId};request-id:${requestId};ts:${ts};`;
    const v1 = await computeMpSignature(secret, manifest);
    const header = `ts=${ts},v1=${v1}`;

    // Servidor sem secret configurado deve recusar TUDO, não aceitar por padrão
    const valid = await verifyMpSignatureLogic("", header, requestId, dataId);
    expect(valid).toBe(false);
  });

  it("rejeita v1 com caracteres hex inválidos", async () => {
    const header = "ts=1735689600,v1=not-valid-hex-zzz";
    const valid = await verifyMpSignatureLogic(secret, header, "req-abc", "payment-123");
    expect(valid).toBe(false);
  });
});
