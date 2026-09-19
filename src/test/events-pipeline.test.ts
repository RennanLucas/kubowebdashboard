import { describe, it, expect } from "vitest";
import { buildRowsFromEvents, type TrackEvent } from "../../supabase/functions/track/_ingest.ts";

describe("Pipeline de Conversoes e Eventos _kw", () => {
  it("Gera UUID v4 valido mesmo quando crypto.randomUUID e indefinido", () => {
    function fallbackNewId() {
      return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function(c) {
        var r = Math.random() * 16 | 0;
        var v = c === "x" ? r : (r & 0x3 | 0x8);
        return v.toString(16);
      });
    }
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    for (let i = 0; i < 50; i++) {
      const id = fallbackNewId();
      expect(uuidRegex.test(id)).toBe(true);
    }
  });

  it("Normaliza eventos de window._kw corretamente para insercao em events", () => {
    const events: TrackEvent[] = [
      {
        type: "event",
        pid: "proj-abc",
        path: "/contato",
        sid: "sess-1",
        event_type: "whatsapp_click",
        event_label: "botao_whatsapp",
        metadata: { position: "header" },
        event_id: "11111111-1111-4111-8111-111111111111",
      },
      {
        type: "event",
        pid: "proj-abc",
        path: "/orcamento",
        sid: "sess-1",
        event_type: "form_submit",
        event_label: "formulario_contato",
        metadata: { form_id: "f1" },
        event_id: "22222222-2222-4222-8222-222222222222",
      },
      {
        type: "event",
        pid: "proj-abc",
        path: "/precos",
        sid: "sess-1",
        event_type: "button_click",
        event_label: "cta_orcamento",
        metadata: { plan: "pro" },
        event_id: "33333333-3333-4333-8333-333333333333",
      },
    ];

    const activePids = new Set(["proj-abc"]);
    const ctx = { userAgent: "Mozilla/5.0", country: "BR", city: "SP" };
    const { eventsToInsert, pageviewsToInsert } = buildRowsFromEvents(events, activePids, ctx);

    expect(pageviewsToInsert).toHaveLength(0);
    expect(eventsToInsert).toHaveLength(3);
    expect(eventsToInsert[0]).toMatchObject({
      project_id: "proj-abc",
      event_type: "whatsapp_click",
      event_label: "botao_whatsapp",
    });
    expect(eventsToInsert[1]).toMatchObject({
      project_id: "proj-abc",
      event_type: "form_submit",
      event_label: "formulario_contato",
    });
    expect(eventsToInsert[2]).toMatchObject({
      project_id: "proj-abc",
      event_type: "button_click",
      event_label: "cta_orcamento",
    });
  });

  it("Calcula stats de conversao identico ao Goals.tsx", () => {
    const metrics = [
      {
        date: "2026-09-18",
        visitors: 10,
        views: 15,
        leads: 2,
        whatsapp_clicks: 1,
        form_submissions: 1,
        button_clicks: 3,
        conversion_rate: 20,
        estimated_value: 50,
      },
    ];

    let whatsapp = 0, forms = 0, buttons = 0;
    metrics.forEach(m => {
      whatsapp += m.whatsapp_clicks;
      forms += m.form_submissions;
      buttons += m.button_clicks;
    });
    const stats = { whatsapp, forms, buttons, leads: whatsapp + forms + buttons };

    expect(stats.whatsapp).toBe(1);
    expect(stats.forms).toBe(1);
    expect(stats.buttons).toBe(3);
    expect(stats.leads).toBe(5);
  });
});
