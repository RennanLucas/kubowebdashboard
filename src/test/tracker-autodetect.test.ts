/**
 * tracker-autodetect.test.ts
 * Valida a detecao automatica nativa de WhatsApp, formularios, botoes, telefone e e-mail
 * executada pelo script real gerado por tracker-script/index.ts no browser.
 */

/* eslint-disable @typescript-eslint/ban-ts-comment */
import { describe, it, expect, beforeEach, vi } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";

const SOURCE_PATH = path.resolve(
  process.cwd(),
  "supabase/functions/tracker-script/index.ts"
);

function extractScript(): string {
  const src = readFileSync(SOURCE_PATH, "utf-8");
  const match = src.match(/const script = `([\s\S]*)`;/);
  if (!match) throw new Error("Nao foi possivel extrair o script do tracker-script/index.ts");
  return match[1]
    .split("${pid}").join("test-project")
    .split("${trackUrl}").join("https://example.supabase.co/functions/v1/track")
    .split("${JSON.stringify(clarityProjectId)}").join('""')
    .split("${JSON.stringify(BOT_UA_PATTERN.source)}").join(JSON.stringify("bot"))
    .split("${JSON.stringify(BOT_UA_ALLOWLIST.source)}").join(JSON.stringify("$^"))
    .split('${consentRequired ? "true" : "false"}').join("false");
}

const ORIGINAL_PUSH_STATE = history.pushState.bind(history);

function loadTracker() {
  history.pushState = ORIGINAL_PUSH_STATE;
  // @ts-expect-error
  delete window.kuboweb;
  // @ts-expect-error
  delete window._kw;
  document.body.innerHTML = "";
  const script = extractScript();
  const fn = new Function(script);
  fn.call(window);
}

function getQueue(): any[] {
  const q = localStorage.getItem("_kwq");
  return q ? JSON.parse(q) : [];
}

beforeEach(() => {
  localStorage.clear();
  sessionStorage.clear();
  navigator.sendBeacon = vi.fn(() => true);
  vi.stubGlobal("fetch", vi.fn(() => Promise.resolve({ ok: true })));
  loadTracker();
});

describe("Auto-deteccao nativa de conversoes", () => {
  it.each([
    ["whatsapp://send?phone=5511999998888", "Conversar", true],
    ["https://waxme.example", "Conversar", false],
    ["https://example.com", "Fale no zap", true],
    ["https://example.com", "zapato", false],
  ])("classifica corretamente %s (%s)", (href, label, expected) => {
    const a = document.createElement("a");
    a.href = href;
    a.textContent = label;
    a.addEventListener("click", (event) => event.preventDefault());
    document.body.appendChild(a);
    a.click();
    expect(getQueue().some((event) => event.event_type === "whatsapp_click")).toBe(expected);
  });

  it("detecta automaticamente links wa.me como whatsapp_click", () => {
    const a = document.createElement("a");
    a.href = "https://wa.me/5511999998888?text=Ola";
    a.textContent = "Fale no WhatsApp";
    document.body.appendChild(a);

    a.click();

    const queue = getQueue();
    const waEvent = queue.find((ev) => ev.event_type === "whatsapp_click");
    expect(waEvent).toBeDefined();
    expect(waEvent.event_label).toBe("whatsapp_auto");
    expect(waEvent.metadata.text).toBe("Fale no WhatsApp");
  });

  it("detecta links api.whatsapp.com como whatsapp_click", () => {
    const a = document.createElement("a");
    a.href = "https://api.whatsapp.com/send?phone=5511999998888";
    a.textContent = "Iniciar Conversa";
    document.body.appendChild(a);

    a.click();

    const queue = getQueue();
    const waEvent = queue.find((ev) => ev.event_type === "whatsapp_click");
    expect(waEvent).toBeDefined();
  });

  it("detecta botao com classe contendo whatsapp como whatsapp_click", () => {
    const btn = document.createElement("button");
    btn.className = "btn-whatsapp-floating";
    btn.textContent = "Atendimento";
    document.body.appendChild(btn);

    btn.click();

    const queue = getQueue();
    const waEvent = queue.find((ev) => ev.event_type === "whatsapp_click");
    expect(waEvent).toBeDefined();
  });

  it("detecta links tel: como phone_click", () => {
    const a = document.createElement("a");
    a.href = "tel:+551133334444";
    a.textContent = "Ligue Agora";
    document.body.appendChild(a);

    a.click();

    const queue = getQueue();
    const phoneEvent = queue.find((ev) => ev.event_type === "phone_click");
    expect(phoneEvent).toBeDefined();
    expect(phoneEvent.event_label).toBe("phone_auto");
  });

  it("detecta links mailto: como email_click", () => {
    const a = document.createElement("a");
    a.href = "mailto:contato@empresa.com.br";
    a.textContent = "Envie um e-mail";
    document.body.appendChild(a);

    a.click();

    const queue = getQueue();
    const emailEvent = queue.find((ev) => ev.event_type === "email_click");
    expect(emailEvent).toBeDefined();
    expect(emailEvent.event_label).toBe("email_auto");
  });

  it("detecta botao comum como button_click", () => {
    const btn = document.createElement("button");
    btn.textContent = "Solicitar Orcamento";
    document.body.appendChild(btn);

    btn.click();

    const queue = getQueue();
    const btnEvent = queue.find((ev) => ev.event_type === "button_click");
    expect(btnEvent).toBeDefined();
    expect(btnEvent.event_label).toBe("Solicitar Orcamento");
  });

  it("detecta submissao de formulario como form_submit", () => {
    const form = document.createElement("form");
    form.id = "contato-principal";
    form.action = "/api/lead";
    document.body.appendChild(form);

    const event = new Event("submit", { bubbles: true, cancelable: true });
    form.dispatchEvent(event);

    const queue = getQueue();
    const formEvent = queue.find((ev) => ev.event_type === "form_submit");
    expect(formEvent).toBeDefined();
    expect(formEvent.event_label).toBe("contato-principal");
  });

  it("ignora cliques em elementos com data-kw-no-track", () => {
    const a = document.createElement("a");
    a.href = "https://wa.me/5511999998888";
    a.textContent = "Ignorado";
    a.setAttribute("data-kw-no-track", "true");
    document.body.appendChild(a);

    const queueBefore = getQueue().length;
    a.click();
    const queueAfter = getQueue().length;

    expect(queueAfter).toBe(queueBefore);
  });
});
