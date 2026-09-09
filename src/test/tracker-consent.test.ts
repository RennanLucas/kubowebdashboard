/**
 * tracker-consent.test.ts
 * Executa o JS efetivamente gerado por `tracker-script/index.ts` dentro de um
 * ambiente jsdom, para validar o comportamento real da Consent API (LGPD) —
 * não apenas a lógica reproduzida, mas o script que roda no navegador do
 * cliente final.
 *
 * O template do Edge Function é lido do arquivo fonte e os placeholders
 * (`${pid}`, `${trackUrl}`, `${consentRequired ...}`) são substituídos, do
 * mesmo jeito que o Deno.serve faz em produção.
 */

/* eslint-disable @typescript-eslint/ban-ts-comment */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const SOURCE_PATH = path.resolve(
  process.cwd(),
  "supabase/functions/tracker-script/index.ts"
);

function extractScript(consentRequired: boolean, clarityProjectId = ""): string {
  const src = readFileSync(SOURCE_PATH, "utf-8");
  const match = src.match(/const script = `([\s\S]*)`;/);
  if (!match) throw new Error("Não foi possível extrair o script do tracker-script/index.ts");
  return match[1]
    .split("${pid}").join("test-project")
    .split("${trackUrl}").join("https://example.supabase.co/functions/v1/track")
    .split("${JSON.stringify(clarityProjectId)}").join(JSON.stringify(clarityProjectId))
    .split("${JSON.stringify(BOT_UA_PATTERN.source)}").join(JSON.stringify("bot"))
    .split("${JSON.stringify(BOT_UA_ALLOWLIST.source)}").join(JSON.stringify("$^"))
    .split('${consentRequired ? "true" : "false"}').join(consentRequired ? "true" : "false");
}

const ORIGINAL_PUSH_STATE = history.pushState.bind(history);

function loadTracker(consentRequired: boolean, clarityProjectId = "") {
  // Cada carregamento do tracker monkey-patcha history.pushState. Como o jsdom
  // compartilha `window`/`history` entre os testes do mesmo arquivo, restauramos
  // o pushState original antes de cada load para evitar acumular wrappers de
  // execuções anteriores (o que faria closures antigas disparar eventos "fantasma").
  history.pushState = ORIGINAL_PUSH_STATE;
  // @ts-expect-error - propriedade injetada dinamicamente pelo tracker
  delete window.kuboweb;
  // @ts-expect-error
  delete window._kw;
  // @ts-expect-error - propriedade opcional injetada pela integração do Clarity
  delete window.clarity;
  document.querySelectorAll('script[src*="clarity.ms/tag/"]').forEach((node) => node.remove());
  const script = extractScript(consentRequired, clarityProjectId);
  const fn = new Function(script);
  fn.call(window);
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  navigator.sendBeacon = vi.fn(() => true);
  vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: true })));
});

// ─── Modo padrão (sem consent=required) ─────────────────────────────────────

describe("Consent API — modo padrão (opt-out)", () => {
  it("rastreia automaticamente por padrão (comportamento atual preservado)", () => {
    loadTracker(false);
    // Uma fila deve ter sido criada em localStorage após o pageview inicial
    const q = localStorage.getItem("_kwq");
    expect(q).not.toBeNull();
    expect(JSON.parse(q!).length).toBeGreaterThan(0);
  });

  it("window.kuboweb.hasConsent() retorna null quando nenhuma decisão foi tomada", () => {
    loadTracker(false);
    // @ts-expect-error - API injetada no window pelo script
    expect(window.kuboweb.hasConsent()).toBeNull();
  });

  it("consent(false) interrompe a coleta e apaga dados locais existentes", () => {
    loadTracker(false);
    expect(localStorage.getItem("_kwq")).not.toBeNull();

    // @ts-expect-error
    window.kuboweb.consent(false);

    expect(localStorage.getItem("_kwq")).toBeNull();
    expect(sessionStorage.getItem("_kws")).toBeNull();
    expect(localStorage.getItem("_kwc")).toBe("denied");
  });

  it("após consent(false), novos eventos NÃO são enfileirados", () => {
    loadTracker(false);
    // @ts-expect-error
    window.kuboweb.consent(false);

    // Simula uma navegação SPA que dispararia um novo pageview
    history.pushState({}, "", "/nova-pagina");

    expect(localStorage.getItem("_kwq")).toBeNull();
  });

  it("consent(true) após uma negação anterior retoma a coleta", () => {
    loadTracker(false);
    // @ts-expect-error
    window.kuboweb.consent(false);
    expect(localStorage.getItem("_kwq")).toBeNull();

    // @ts-expect-error
    window.kuboweb.consent(true);

    const q = localStorage.getItem("_kwq");
    expect(q).not.toBeNull();
    expect(JSON.parse(q!).length).toBeGreaterThan(0);
    // @ts-expect-error
    expect(window.kuboweb.hasConsent()).toBe("granted");
  });
});

// ─── Modo estrito (consent=required) ────────────────────────────────────────

describe("Consent API — modo estrito (opt-in obrigatório via ?consent=required)", () => {
  it("NÃO rastreia nada até consent(true) ser chamado", () => {
    loadTracker(true);
    expect(localStorage.getItem("_kwq")).toBeNull();
    expect(sessionStorage.getItem("_kws")).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("hasConsent() retorna null antes de qualquer decisão", () => {
    loadTracker(true);
    // @ts-expect-error
    expect(window.kuboweb.hasConsent()).toBeNull();
  });

  it("consent(true) libera a coleta e dispara o pageview inicial", () => {
    loadTracker(true);
    expect(localStorage.getItem("_kwq")).toBeNull();

    // @ts-expect-error
    window.kuboweb.consent(true);

    const q = localStorage.getItem("_kwq");
    expect(q).not.toBeNull();
    expect(JSON.parse(q!).length).toBeGreaterThan(0);
  });

  it("navegação SPA antes do consentimento não gera eventos", () => {
    loadTracker(true);
    history.pushState({}, "", "/outra-pagina");
    expect(localStorage.getItem("_kwq")).toBeNull();
    expect(sessionStorage.getItem("_kws")).toBeNull();
    expect(fetch).not.toHaveBeenCalled();
  });

  it("consent(false) explícito mantém bloqueio e não lança erro", () => {
    loadTracker(true);
    // @ts-expect-error
    expect(() => window.kuboweb.consent(false)).not.toThrow();
    expect(localStorage.getItem("_kwq")).toBeNull();
    // @ts-expect-error
    expect(window.kuboweb.hasConsent()).toBe("denied");
  });

  it("não carrega o Clarity antes do consentimento e carrega depois da autorização", () => {
    loadTracker(true, "clarity-test-123");
    expect(document.querySelector('script[src*="clarity.ms/tag/"]')).toBeNull();

    // @ts-expect-error
    window.kuboweb.consent(true);

    const clarityScript = document.querySelector('script[src*="clarity.ms/tag/"]');
    expect(clarityScript).not.toBeNull();
    expect(clarityScript?.getAttribute("src")).toContain("clarity-test-123");
  });
});

// ─── Persistência entre "carregamentos de página" ───────────────────────────

describe("Consent API — persistência da decisão entre carregamentos", () => {
  it("decisão 'denied' persiste e bloqueia coleta num carregamento simulado seguinte", () => {
    loadTracker(false);
    // @ts-expect-error
    window.kuboweb.consent(false);

    // Simula um novo carregamento de página (novo <script>), sessionStorage
    // de aba permanece, localStorage (onde _kwc mora) também permanece.
    loadTracker(false);

    // Não deve ter recriado a fila, pois o consentimento negado persiste
    expect(localStorage.getItem("_kwq")).toBeNull();
  });

  it("decisão 'granted' em modo estrito persiste entre carregamentos", () => {
    loadTracker(true);
    // @ts-expect-error
    window.kuboweb.consent(true);
    expect(localStorage.getItem("_kwq")).not.toBeNull();

    // Novo carregamento simulado — a decisão já estava salva antes do load,
    // então o pageview inicial já deve disparar automaticamente.
    localStorage.removeItem("_kwq"); // limpa fila do load anterior p/ isolar o teste
    loadTracker(true);

    const q = localStorage.getItem("_kwq");
    expect(q).not.toBeNull();
    expect(JSON.parse(q!).length).toBeGreaterThan(0);
  });
});
