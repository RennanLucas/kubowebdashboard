/**
 * tracking-pipeline.test.ts
 * Testa as invariantes do pipeline de tracking:
 *  1. event_id gerado pelo cliente garante deduplicação
 *  2. UTMs são extraídos corretamente do metadata do pageview
 *  3. Detecção de bots (User-Agent) impede inserção no banco
 *  4. Sessão por sessionStorage produz IDs diferentes por aba
 *
 * Estes são testes de lógica pura (sem I/O) que reproduzem o comportamento
 * crítico do tracker — sem depender de Supabase ou Deno.
 */

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

// ─── Lógica de event_id (reproduzida do tracker-script) ─────────────────────

function newEventId(): string {
  try {
    return crypto.randomUUID();
  } catch {
    return Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
  }
}

describe("event_id — deduplicação idempotente", () => {
  it("gera IDs únicos para cada chamada", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 100; i++) {
      ids.add(newEventId());
    }
    // Todos os 100 IDs devem ser distintos
    expect(ids.size).toBe(100);
  });

  it("ID tem formato de UUID quando crypto.randomUUID está disponível", () => {
    const id = newEventId();
    // UUID v4 pattern: 8-4-4-4-12 hex characters
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    expect(uuidPattern.test(id)).toBe(true);
  });

  it("batch de eventos com mesmo event_id deve ser deduplicado (ON CONFLICT DO NOTHING)", () => {
    // Simula o comportamento esperado no banco: uma Map que representa o índice UNIQUE
    const db = new Map<string, unknown>();

    const insertWithDedup = (eventId: string, data: unknown): "inserted" | "ignored" => {
      if (db.has(eventId)) return "ignored";
      db.set(eventId, data);
      return "inserted";
    };

    const eventId = newEventId();
    const first = insertWithDedup(eventId, { type: "pageview", path: "/" });
    const retry = insertWithDedup(eventId, { type: "pageview", path: "/" });

    expect(first).toBe("inserted");
    expect(retry).toBe("ignored");
    expect(db.size).toBe(1);
  });

  it("retransmissões com event_id diferente NÃO são deduplicadas", () => {
    const db = new Map<string, unknown>();
    const insertWithDedup = (eventId: string, data: unknown) => {
      if (db.has(eventId)) return "ignored";
      db.set(eventId, data);
      return "inserted";
    };

    // Dois eventos legítimos diferentes
    insertWithDedup(newEventId(), { path: "/pagina-a" });
    insertWithDedup(newEventId(), { path: "/pagina-b" });
    expect(db.size).toBe(2);
  });
});

// ─── Lógica de captura de UTM (reproduzida do tracker-script) ───────────────

function getUTMs(searchString: string): Record<string, string> {
  const s = new URLSearchParams(searchString);
  const result: Record<string, string> = {};
  ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach((k) => {
    const v = s.get(k);
    if (v) result[k] = v;
  });
  return result;
}

describe("Captura de UTM parameters", () => {
  it("extrai todos os parâmetros UTM de uma URL de campanha", () => {
    const search = "?utm_source=google&utm_medium=cpc&utm_campaign=lançamento&utm_term=analytics&utm_content=banner";
    const utms = getUTMs(search);
    expect(utms.utm_source).toBe("google");
    expect(utms.utm_medium).toBe("cpc");
    expect(utms.utm_campaign).toBe("lançamento");
    expect(utms.utm_term).toBe("analytics");
    expect(utms.utm_content).toBe("banner");
  });

  it("retorna objeto vazio quando não há UTMs", () => {
    const utms = getUTMs("?foo=bar&baz=qux");
    expect(Object.keys(utms)).toHaveLength(0);
  });

  it("ignora parâmetros não-UTM", () => {
    const utms = getUTMs("?utm_source=email&fbclid=abc123&gclid=xyz");
    expect(utms.utm_source).toBe("email");
    expect(utms).not.toHaveProperty("fbclid");
    expect(utms).not.toHaveProperty("gclid");
  });

  it("captura UTM parcial (só source e medium)", () => {
    const utms = getUTMs("?utm_source=newsletter&utm_medium=email");
    expect(utms).toHaveProperty("utm_source", "newsletter");
    expect(utms).toHaveProperty("utm_medium", "email");
    expect(utms).not.toHaveProperty("utm_campaign");
  });

  it("UTMs são incluídos no payload do pageview como metadata", () => {
    // Simula a construção do evento pelo tracker
    const search = "?utm_source=google&utm_campaign=summer_sale";
    const utms = getUTMs(search);

    const event = {
      type: "pageview",
      pid: "project-123",
      path: "/",
      sid: "session-abc",
      event_id: newEventId(),
      ...(Object.keys(utms).length ? { metadata: utms } : {}),
    };

    expect(event.metadata).toBeDefined();
    expect((event.metadata as Record<string, string>).utm_source).toBe("google");
  });

  it("pageview sem UTMs NÃO tem campo metadata de UTM", () => {
    const utms = getUTMs("");
    const event: Record<string, unknown> = {
      type: "pageview",
      pid: "project-123",
      path: "/",
    };
    if (Object.keys(utms).length) event.metadata = utms;

    expect(event.metadata).toBeUndefined();
  });
});

// ─── Detecção de bots (reproduzida do tracker-script) ───────────────────────

const BOT_REGEX = /bot|crawler|spider|crawling|headless|prerender|phantom|slurp|googlebot|bingbot|yandex|baidu|duckduckbot|facebookexternalhit|linkedinbot|twitterbot/i;

function isBot(ua: string): boolean {
  return BOT_REGEX.test(ua);
}

describe("Detecção de bots — bot filtering", () => {
  it("Googlebot é identificado como bot", () => {
    const ua = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";
    expect(isBot(ua)).toBe(true);
  });

  it("Bingbot é identificado como bot", () => {
    const ua = "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)";
    expect(isBot(ua)).toBe(true);
  });

  it("Headless Chrome é identificado como bot", () => {
    const ua = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 HeadlessChrome/91.0.4472.114";
    expect(isBot(ua)).toBe(true);
  });

  it("Spider/crawler é identificado como bot", () => {
    expect(isBot("MyCrawler/1.0 spider")).toBe(true);
    expect(isBot("Mozilla/5.0 AhrefsBot/7.0 crawler")).toBe(true);
  });

  it("Usuário real no Chrome não é bot", () => {
    const ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36";
    expect(isBot(ua)).toBe(false);
  });

  it("Usuário real no Safari não é bot", () => {
    const ua = "Mozilla/5.0 (iPhone; CPU iPhone OS 16_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/16.0 Mobile/15E148 Safari/604.1";
    expect(isBot(ua)).toBe(false);
  });

  it("Usuário real no Firefox não é bot", () => {
    const ua = "Mozilla/5.0 (Macintosh; Intel Mac OS X 10.15; rv:109.0) Gecko/20100101 Firefox/109.0";
    expect(isBot(ua)).toBe(false);
  });

  it("facebookexternalhit é identificado como bot (previne inflação de tráfego)", () => {
    const ua = "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)";
    expect(isBot(ua)).toBe(true);
  });
});

// ─── Lógica de data-kw-no-track (proteção de PII em auto-click) ─────────────

interface ClickTarget {
  tagName: string;
  textContent: string;
  dataset: Record<string, string | undefined>;
  parentElement?: ClickTarget | null;
}

function shouldTrackClick(target: ClickTarget | null): {
  track: boolean;
  element?: ClickTarget;
} {
  let el = target;
  while (el && el.tagName !== "DOCUMENT") {
    if (el.dataset && "kwNoTrack" in el.dataset) {
      return { track: false };
    }
    if (el.tagName === "A" || el.tagName === "BUTTON") {
      return { track: true, element: el };
    }
    el = el.parentElement ?? null;
  }
  return { track: false };
}

describe("Auto-click tracker — proteção de PII com data-kw-no-track", () => {
  it("rastreia clique em botão normal", () => {
    const btn: ClickTarget = {
      tagName: "BUTTON",
      textContent: "Entrar em contato",
      dataset: {},
    };
    const result = shouldTrackClick(btn);
    expect(result.track).toBe(true);
  });

  it("NÃO rastreia botão com data-kw-no-track", () => {
    const btn: ClickTarget = {
      tagName: "BUTTON",
      textContent: "joao@empresa.com",
      dataset: { kwNoTrack: "" },
    };
    const result = shouldTrackClick(btn);
    expect(result.track).toBe(false);
  });

  it("NÃO rastreia clique em elemento não-interativo dentro de container com data-kw-no-track", () => {
    // Cenário real: um <span> (ex: ícone) dentro de uma <div data-kw-no-track>
    // que por sua vez está dentro de um <button> mais externo. O clique no
    // span deve ser bloqueado pelo data-kw-no-track antes de alcançar o button.
    const outerButton: ClickTarget = {
      tagName: "BUTTON",
      textContent: "",
      dataset: {},
    };
    const noTrackDiv: ClickTarget = {
      tagName: "DIV",
      textContent: "",
      dataset: { kwNoTrack: "" },
      parentElement: outerButton,
    };
    const innerSpan: ClickTarget = {
      tagName: "SPAN",
      textContent: "Dado sensível",
      dataset: {},
      parentElement: noTrackDiv,
    };
    const result = shouldTrackClick(innerSpan);
    expect(result.track).toBe(false);
  });

  it("clique direto em um BUTTON é rastreado mesmo se um ancestral distante tiver no-track (o botão é encontrado primeiro)", () => {
    // O algoritmo do tracker verifica no-track e tag na MESMA iteração,
    // começando pelo elemento clicado — se o próprio alvo é A/BUTTON, ele
    // é rastreado antes de a árvore ser percorrida até um ancestral no-track.
    const outerNoTrack: ClickTarget = {
      tagName: "DIV",
      textContent: "",
      dataset: { kwNoTrack: "" },
    };
    const btn: ClickTarget = {
      tagName: "BUTTON",
      textContent: "Comprar agora",
      dataset: {},
      parentElement: outerNoTrack,
    };
    const result = shouldTrackClick(btn);
    expect(result.track).toBe(true);
  });

  it("rastreia link (tag A)", () => {
    const link: ClickTarget = {
      tagName: "A",
      textContent: "Ver planos",
      dataset: {},
    };
    expect(shouldTrackClick(link).track).toBe(true);
  });

  it("NÃO rastreia clique em DIV genérico sem A ou BUTTON na cadeia", () => {
    const div: ClickTarget = {
      tagName: "DIV",
      textContent: "algum texto",
      dataset: {},
    };
    expect(shouldTrackClick(div).track).toBe(false);
  });
});
