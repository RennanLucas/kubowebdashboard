import { describe, it, expect } from "vitest";
import {
  generateLocalInsights,
  generateInsightDetails,
  type InsightsInput,
} from "@/lib/local-insights";

function baseInput(overrides: Partial<InsightsInput> = {}): InsightsInput {
  return {
    days: 30,
    metrics: [],
    conversions: { whatsapp_clicks: 0, form_submissions: 0, button_clicks: 0 },
    trafficSources: [],
    topPages: [],
    ...overrides,
  };
}

describe("generateLocalInsights", () => {
  it("does not throw on minimal/empty input and returns a string", () => {
    const out = generateLocalInsights(baseInput());
    expect(typeof out).toBe("string");
    expect(out.length).toBeGreaterThan(0);
  });

  it("renders all eight report sections", () => {
    const out = generateLocalInsights(baseInput());
    expect(out).toContain("# Relatório de Performance");
    expect(out).toContain("## 1. Resumo Executivo");
    expect(out).toContain("## 2. Principais Destaques");
    expect(out).toContain("## 3. Pontos de Atenção");
    expect(out).toContain("## 4. Canais de Aquisição");
    expect(out).toContain("## 5. Conversões por Tipo");
    expect(out).toContain("## 6. Sazonalidade & Padrões Temporais");
    expect(out).toContain("## 7. Recomendações Práticas");
    expect(out).toContain("## 8. Próximos Passos");
  });

  it("computes conversion rate from the summary override", () => {
    const out = generateLocalInsights(
      baseInput({
        summary: { totalVisitors: 1000, totalLeads: 30, totalViews: 2000, totalSessions: 1000 },
      }),
    );
    // 30 / 1000 * 100 = 3.00%
    expect(out).toContain("| Taxa de conversão | **3.00%** |");
  });

  it("computes conversion rate by summing metrics when no summary is given", () => {
    const out = generateLocalInsights(
      baseInput({
        metrics: [
          { date: "2026-08-01", visitors: 500, leads: 10, estimated_value: 0 },
          { date: "2026-08-02", visitors: 500, leads: 10, estimated_value: 0 },
        ],
      }),
    );
    // 20 / 1000 * 100 = 2.00%
    expect(out).toContain("| Taxa de conversão | **2.00%** |");
  });

  it("reports a healthy score for a strong conversion rate", () => {
    const out = generateLocalInsights(
      baseInput({
        summary: { totalVisitors: 1000, totalLeads: 30, totalViews: 2000, totalSessions: 1000 },
      }),
    );
    // base 50 + 20 (conversionRate >= 3) = 70 -> "Saudável"
    expect(out).toContain("70/100");
    expect(out).toContain("Saudável");
  });

  it("flags a tracking problem when there is traffic but zero conversions", () => {
    const out = generateLocalInsights(
      baseInput({
        summary: { totalVisitors: 100, totalLeads: 0, totalViews: 300, totalSessions: 100 },
      }),
    );
    expect(out).toContain("script de tracking");
  });

  it("warns about over-dependence on a single channel", () => {
    const out = generateLocalInsights(
      baseInput({
        trafficSources: [
          { source: "Google", visitors: 90 },
          { source: "Direct", visitors: 10 },
        ],
      }),
    );
    expect(out).toContain("Alta dependência de um único canal");
  });

  it("shows guidance placeholders when data is insufficient", () => {
    const out = generateLocalInsights(baseInput());
    expect(out).toContain("insuficiente");
    expect(out).toContain("_Sem dados suficientes de origem de tráfego._");
  });

  it("lists traffic sources in the acquisition table", () => {
    const out = generateLocalInsights(
      baseInput({
        trafficSources: [
          { source: "Instagram", visitors: 120 },
          { source: "Google", visitors: 80 },
        ],
      }),
    );
    expect(out).toContain("Instagram");
    expect(out).toContain("Google");
  });
});

describe("generateInsightDetails", () => {
  const richInput = baseInput({
    summary: { totalVisitors: 1000, totalLeads: 50, totalViews: 2000, totalSessions: 1000 },
    trafficSources: [
      { source: "Google", visitors: 70 },
      { source: "Direct", visitors: 30 },
    ],
    topPages: [{ page_path: "/home", views: 500 }],
    conversions: { whatsapp_clicks: 10, form_submissions: 5, button_clicks: 2 },
    devices: [{ device: "Mobile" }],
    engagement: { bounce_rate: 80 },
    comparison: { visitorsChange: 20, leadsChange: 10 },
    hourlyDistribution: [
      { hour: 14, visitors: 100 },
      { hour: 9, visitors: 40 },
    ],
  });

  it("returns an array capped at 6 items", () => {
    const details = generateInsightDetails(richInput);
    expect(Array.isArray(details)).toBe(true);
    expect(details.length).toBe(6);
  });

  it("every detail has the required shape", () => {
    const details = generateInsightDetails(richInput);
    for (const d of details) {
      expect(typeof d.title).toBe("string");
      expect(d.title.length).toBeGreaterThan(0);
      expect(typeof d.reason).toBe("string");
      expect(d.reason.length).toBeGreaterThan(0);
      expect(typeof d.recommendation).toBe("string");
      expect(d.recommendation.length).toBeGreaterThan(0);
      expect(Array.isArray(d.sources)).toBe(true);
      expect(d.sources.length).toBeGreaterThan(0);
      for (const s of d.sources) {
        expect(typeof s.label).toBe("string");
        expect(typeof s.value).toBe("string");
      }
    }
  });

  it("recommends diversifying when one channel dominates (>60% share)", () => {
    const details = generateInsightDetails(
      baseInput({
        trafficSources: [
          { source: "Google", visitors: 80 },
          { source: "Direct", visitors: 20 },
        ],
      }),
    );
    const channelDetail = details.find((d) => d.title.includes("Google"));
    expect(channelDetail).toBeDefined();
    expect(channelDetail!.recommendation).toContain("Reduza a dependência");
  });

  it("does not throw and returns at most 6 details for empty input", () => {
    const details = generateInsightDetails(baseInput());
    expect(Array.isArray(details)).toBe(true);
    expect(details.length).toBeLessThanOrEqual(6);
  });
});
