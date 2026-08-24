// @vitest-environment node
// Pure report generator — no DOM, no clock beyond the header date.
import { describe, it, expect } from "vitest";
import {
  generateLocalInsights,
  generateInsightDetails,
  type InsightsInput,
} from "@/lib/local-insights";

/**
 * local-insights.test.ts covers the report's shape. This file covers its
 * *rules*: the thresholds that decide what a client is told about their own
 * traffic. Every threshold is exercised on both sides, because a rule that
 * only ever fires one way is a rule nobody has actually checked — and these
 * strings go straight into a client-facing PDF.
 */

const input = (overrides: Partial<InsightsInput> = {}): InsightsInput => ({
  days: 30,
  metrics: [],
  conversions: { whatsapp_clicks: 0, form_submissions: 0, button_clicks: 0 },
  trafficSources: [],
  topPages: [],
  ...overrides,
});

/** Drives healthScore's four inputs without touching anything else. */
const health = (over: {
  visitors?: number;
  leads?: number;
  bounce?: number;
  visitorsChange?: number;
  leadsChange?: number;
}) =>
  generateLocalInsights(
    input({
      summary: {
        totalVisitors: over.visitors ?? 1000,
        totalLeads: over.leads ?? 10,
        totalViews: 0,
        totalSessions: 0,
      },
      engagement: { bounce_rate: over.bounce ?? 0 },
      comparison: {
        visitorsChange: over.visitorsChange ?? 0,
        leadsChange: over.leadsChange ?? 0,
      },
    }),
  );

describe("health score bands", () => {
  it("awards the ceiling when every signal is positive, and clamps at 100", () => {
    // 50 base +20 conversion +10 bounce +10 visitors +10 leads = 100
    const out = health({
      visitors: 1000,
      leads: 50, // 5% conversion
      bounce: 20,
      visitorsChange: 50,
      leadsChange: 50,
    });
    expect(out).toContain("🟢 **Excelente** (100/100)");
  });

  it("floors at zero rather than going negative when every signal is bad", () => {
    // 50 base -15 conversion -10 bounce -15 visitors -15 leads = -5 -> 0
    const out = health({
      visitors: 1000,
      leads: 1, // 0.1% conversion
      bounce: 90,
      visitorsChange: -50,
      leadsChange: -50,
    });
    expect(out).toContain("🔴 **Crítico** (0/100)");
  });

  it("reads a neutral period as merely estável", () => {
    // 1% conversion sits in the dead zone (>=0.5, <1.5): no adjustment at all.
    const out = health({ visitors: 1000, leads: 10 });
    expect(out).toContain("🟡 **Estável** (50/100)");
  });

  it("gives partial credit for a mid conversion rate", () => {
    // 2% -> +10 only, not the +20 reserved for >=3%.
    const out = health({ visitors: 1000, leads: 20 });
    expect(out).toContain("(60/100)");
  });

  it("drops to atenção once two signals go bad", () => {
    // 50 -15 conversion -10 bounce = 25, the bottom of the atenção band.
    const out = health({ visitors: 1000, leads: 1, bounce: 90 });
    expect(out).toContain("🔴 **Atenção** (25/100)");
  });

  it("does not treat a missing bounce rate as a perfect one", () => {
    // bounce === 0 means "no data", so it must not earn the <40% bonus.
    expect(health({ bounce: 0 })).toContain("(50/100)");
    expect(health({ bounce: 39 })).toContain("(60/100)");
  });

  it("ignores a bounce rate sitting between the two thresholds", () => {
    expect(health({ bounce: 55 })).toContain("(50/100)");
  });
});

describe("executive summary rows", () => {
  it("omits the comparison rows when there is nothing to compare against", () => {
    const out = generateLocalInsights(input());
    expect(out).not.toContain("Variação de tráfego (vs período anterior)");
    expect(out).not.toContain("Variação de leads (vs período anterior)");
  });

  it("shows each comparison row independently and signs it", () => {
    const up = generateLocalInsights(
      input({ comparison: { visitorsChange: 12.34, leadsChange: 0 } }),
    );
    expect(up).toContain("| Variação de tráfego (vs período anterior) | **+12.3%** |");
    expect(up).not.toContain("Variação de leads");

    const down = generateLocalInsights(
      input({ comparison: { visitorsChange: 0, leadsChange: -8.5 } }),
    );
    expect(down).toContain("| Variação de leads (vs período anterior) | **-8.5%** |");
    expect(down).not.toContain("Variação de tráfego");
  });

  it("sums estimated_value even when the backend sends it as a string", () => {
    // The column arrives as numeric from Postgres and as a string through
    // some serialisers; a silent NaN here would zero out the client's pipeline.
    const out = generateLocalInsights(
      input({
        metrics: [
          { date: "2026-08-01", visitors: 10, leads: 1, estimated_value: "100.50" },
          { date: "2026-08-02", visitors: 10, leads: 1, estimated_value: 50 },
        ],
      }),
    );
    expect(out).toContain("150,50");
    expect(out).not.toContain("NaN");
  });

  it("divides by days and by totals without producing NaN on an empty period", () => {
    const out = generateLocalInsights(input({ days: 0 }));
    expect(out).not.toContain("NaN");
    expect(out).toContain("| Taxa de conversão | **0.00%** |");
  });
});

describe("highlights", () => {
  it("celebrates growth only once it clears 10%, not at exactly 10%", () => {
    const at = generateLocalInsights(input({ comparison: { visitorsChange: 10, leadsChange: 10 } }));
    expect(at).not.toContain("Crescimento expressivo de tráfego");
    expect(at).not.toContain("Leads cresceram");

    const over = generateLocalInsights(
      input({ comparison: { visitorsChange: 10.1, leadsChange: 10.1 } }),
    );
    expect(over).toContain("Crescimento expressivo de tráfego");
    expect(over).toContain("Leads cresceram");
  });

  it("praises a conversion rate only from 3% up", () => {
    const under = generateLocalInsights(
      input({ summary: { totalVisitors: 1000, totalLeads: 29, totalViews: 0, totalSessions: 0 } }),
    );
    expect(under).not.toContain("acima da média de mercado");

    const at = generateLocalInsights(
      input({ summary: { totalVisitors: 1000, totalLeads: 30, totalViews: 0, totalSessions: 0 } }),
    );
    expect(at).toContain("acima da média de mercado");
  });

  it("skips the geographic highlight when the country row has no name", () => {
    const nameless = generateLocalInsights(input({ countries: [{ visitors: 500 }] }));
    expect(nameless).not.toContain("Concentração geográfica");

    const named = generateLocalInsights(input({ countries: [{ country: "Brasil", visitors: 500 }] }));
    expect(named).toContain("Concentração geográfica em **Brasil** (500 visitantes)");
  });

  it("accepts the alternate country field names the endpoints use", () => {
    expect(generateLocalInsights(input({ countries: [{ name: "Portugal", value: 42 }] }))).toContain(
      "**Portugal** (42 visitantes)",
    );
    expect(generateLocalInsights(input({ countries: [{ label: "Chile", visitors: 7 }] }))).toContain(
      "**Chile** (7 visitantes)",
    );
  });

  it("falls back through the page-name fields and then to a generic label", () => {
    expect(generateLocalInsights(input({ topPages: [{ page_path: "/a", views: 5 }] }))).toContain("`/a`");
    expect(generateLocalInsights(input({ topPages: [{ path: "/b", visitors: 5 }] }))).toContain("`/b`");
    expect(generateLocalInsights(input({ topPages: [{ name: "/c" }] }))).toContain("`/c`");
    expect(generateLocalInsights(input({ topPages: [{ views: 5 }] }))).toContain("`página principal`");
  });

  it("falls back to a wait-and-see note when nothing qualifies", () => {
    const out = generateLocalInsights(input());
    expect(out).toContain("volume de dados ainda é insuficiente");
    expect(out).toContain("7–14 dias");
  });
});

/** A period with nothing wrong with it, so each risk can be introduced alone. */
const calm = (over: Partial<InsightsInput> = {}) =>
  generateLocalInsights(
    input({
      summary: { totalVisitors: 1000, totalLeads: 50, totalViews: 0, totalSessions: 0 },
      conversions: { whatsapp_clicks: 10, form_submissions: 0, button_clicks: 0 },
      engagement: { bounce_rate: 50, avg_time_on_page: 30 },
      trafficSources: [
        { source: "Google", visitors: 50 },
        { source: "Direct", visitors: 50 },
      ],
      ...over,
    }),
  );

describe("risk warnings", () => {
  it("reports no critical risk when every threshold is respected", () => {
    expect(calm()).toContain("Nenhum risco crítico identificado");
  });

  it("warns about a drop only past -15%, not at exactly -15%", () => {
    const at = calm({ comparison: { visitorsChange: -15, leadsChange: -15 } });
    expect(at).not.toContain("Queda relevante de tráfego");
    expect(at).not.toContain("Redução de leads");

    const past = calm({ comparison: { visitorsChange: -15.1, leadsChange: -15.1 } });
    expect(past).toContain("Queda relevante de tráfego (-15.1%)");
    expect(past).toContain("Redução de leads (-15.1%)");
  });

  it("requires more than 100 visitors before calling a conversion rate low", () => {
    const thin = calm({
      summary: { totalVisitors: 100, totalLeads: 0, totalViews: 0, totalSessions: 0 },
    });
    expect(thin).not.toContain("abaixo da referência de mercado");

    const enough = calm({
      summary: { totalVisitors: 101, totalLeads: 0, totalViews: 0, totalSessions: 0 },
    });
    expect(enough).toContain("abaixo da referência de mercado");
  });

  it("flags a high bounce rate strictly above 70%", () => {
    expect(calm({ engagement: { bounce_rate: 70 } })).not.toContain("Taxa de rejeição alta");
    expect(calm({ engagement: { bounce_rate: 70.1 } })).toContain("Taxa de rejeição alta (70.1%)");
  });

  it("reads the bounce rate under either field name", () => {
    expect(calm({ engagement: { bounceRate: 80 } })).toContain("Taxa de rejeição alta (80.0%)");
  });

  it("flags a short visit but treats a missing time as unknown, not as zero seconds", () => {
    expect(calm({ engagement: { avg_time_on_page: 14 } })).toContain("apenas **14s**");
    expect(calm({ engagement: { avg_time_on_page: 15 } })).not.toContain("Tempo médio na página");
    expect(calm({ engagement: { avg_time_on_page: 0 } })).not.toContain("Tempo médio na página");
    expect(calm({ engagement: { avgSessionDuration: 9 } })).toContain("apenas **9s**");
  });

  it("suspects broken tracking only above 50 visitors with zero conversions", () => {
    const zero = { whatsapp_clicks: 0, form_submissions: 0, button_clicks: 0 };
    const quiet = calm({
      conversions: zero,
      summary: { totalVisitors: 50, totalLeads: 0, totalViews: 0, totalSessions: 0 },
    });
    expect(quiet).not.toContain("script de tracking");

    const busy = calm({
      conversions: zero,
      summary: { totalVisitors: 51, totalLeads: 0, totalViews: 0, totalSessions: 0 },
    });
    expect(busy).toContain("Nenhuma conversão registrada");
    expect(busy).toContain("script de tracking");
  });

  it("calls out channel concentration strictly above 70%", () => {
    const at = calm({
      trafficSources: [
        { source: "Google", visitors: 70 },
        { source: "Direct", visitors: 30 },
      ],
    });
    expect(at).not.toContain("Alta dependência de um único canal");

    const over = calm({
      trafficSources: [
        { source: "Google", visitors: 71 },
        { source: "Direct", visitors: 29 },
      ],
    });
    expect(over).toContain("Alta dependência de um único canal** (Google = 71.0%)");
  });
});

describe("acquisition and conversion tables", () => {
  it("ranks at most five channels and computes each share", () => {
    const out = generateLocalInsights(
      input({
        trafficSources: [
          { source: "Google", visitors: 500 },
          { source: "Instagram", visitors: 250 },
          { source: "Direct", visitors: 150 },
          { source: "Facebook", visitors: 50 },
          { source: "Bing", visitors: 40 },
          { source: "Reddit", visitors: 10 },
        ],
      }),
    );
    expect(out).toContain("| 1 | Google | 500 | 50.0% |");
    expect(out).toContain("| 2 | Instagram | 250 | 25.0% |");
    expect(out).toContain("| 5 | Bing | 40 | 4.0% |");
    expect(out).not.toContain("Reddit");
  });

  it("breaks conversions down by type and shares them out", () => {
    const out = generateLocalInsights(
      input({ conversions: { whatsapp_clicks: 1, form_submissions: 1, button_clicks: 2 } }),
    );
    expect(out).toContain("| Cliques em WhatsApp | 1 | 25.0% |");
    expect(out).toContain("| Envios de formulário | 1 | 25.0% |");
    expect(out).toContain("| Cliques em CTAs/botões | 2 | 50.0% |");
  });

  it("says so plainly when no conversion was recorded", () => {
    const out = generateLocalInsights(input());
    expect(out).toContain("_Nenhuma conversão registrada no período._");
  });
});

describe("seasonality — weekday patterns", () => {
  const day = (date: string, visitors: number) => ({
    date,
    visitors,
    leads: 0,
    estimated_value: 0,
  });

  it("needs at least three distinct weekdays before naming a best day", () => {
    const two = generateLocalInsights(
      input({ metrics: [day("2026-08-03", 100), day("2026-08-04", 50)] }),
    );
    expect(two).not.toContain("Melhor dia da semana");
    expect(two).toContain("Padrões de sazonalidade ainda não estão estatisticamente significativos");

    const three = generateLocalInsights(
      input({
        metrics: [day("2026-08-03", 100), day("2026-08-04", 50), day("2026-08-05", 50)],
      }),
    );
    expect(three).toContain("**Melhor dia da semana:** Segunda");
  });

  it("ignores rows with no date or an unparseable one", () => {
    const out = generateLocalInsights(
      input({
        metrics: [
          { visitors: 999, leads: 0, estimated_value: 0 },
          day("not-a-date", 999),
          day("2026-08-03", 100),
          day("2026-08-04", 50),
          day("2026-08-05", 50),
        ],
      }),
    );
    // The two junk rows still count toward totals but must not skew any weekday.
    expect(out).toContain("**Melhor dia da semana:** Segunda");
  });

  it("names the worst day only when it is well below the average", () => {
    const shallow = generateLocalInsights(
      input({
        metrics: [day("2026-08-03", 100), day("2026-08-04", 50), day("2026-08-05", 50)],
      }),
    );
    // Worst (50) vs overall average (66.7): not below the 70% cut, so silent.
    expect(shallow).not.toContain("Dia de menor performance");

    const steep = generateLocalInsights(
      input({
        metrics: [day("2026-08-03", 100), day("2026-08-04", 100), day("2026-08-05", 10)],
      }),
    );
    expect(steep).toContain("**Dia de menor performance:** Quarta");
  });

  it("separates a weekday audience from a weekend one, and stays quiet when they match", () => {
    const d = (date: string, visitors: number) => ({ date, visitors, leads: 0, estimated_value: 0 });
    const weekdayHeavy = generateLocalInsights(
      input({
        metrics: [
          d("2026-08-02", 10), // Domingo
          d("2026-08-01", 10), // Sábado
          d("2026-08-03", 100),
          d("2026-08-04", 100),
          d("2026-08-05", 100),
        ],
      }),
    );
    expect(weekdayHeavy).toContain("**Perfil B2B/profissional:** dias úteis registram +900.0%");

    const weekendHeavy = generateLocalInsights(
      input({
        metrics: [
          d("2026-08-02", 100),
          d("2026-08-01", 100),
          d("2026-08-03", 10),
          d("2026-08-04", 10),
          d("2026-08-05", 10),
        ],
      }),
    );
    expect(weekendHeavy).toContain("**Perfil consumidor/lazer:** finais de semana registram +900.0%");

    const flat = generateLocalInsights(
      input({
        metrics: [
          d("2026-08-02", 100),
          d("2026-08-01", 100),
          d("2026-08-03", 100),
          d("2026-08-04", 100),
          d("2026-08-05", 100),
        ],
      }),
    );
    // Within 30% of each other: claiming either profile would be noise.
    expect(flat).not.toContain("Perfil B2B");
    expect(flat).not.toContain("Perfil consumidor");
  });
});

describe("seasonality — period-over-period trend", () => {
  /** 14 dated days, flat within each half, so the trend is exact. */
  const series = (first: number, second: number) =>
    Array.from({ length: 14 }, (_, i) => ({
      date: `2026-08-${String(i + 1).padStart(2, "0")}`,
      visitors: i < 7 ? first : second,
      leads: 0,
      estimated_value: 0,
    }));

  it("needs 14 days of data before comparing halves", () => {
    const thirteen = generateLocalInsights(input({ metrics: series(10, 100).slice(0, 13) }));
    expect(thirteen).not.toContain("Tendência");
    expect(thirteen).not.toContain("Tráfego estável");

    expect(generateLocalInsights(input({ metrics: series(10, 100) }))).toContain("**Tendência ascendente:**");
  });

  it("calls the direction past ±15% and stability inside it", () => {
    expect(generateLocalInsights(input({ metrics: series(10, 100) }))).toContain(
      "segunda metade do período cresceu +900.0%",
    );
    expect(generateLocalInsights(input({ metrics: series(100, 10) }))).toContain(
      "**Tendência descendente:** segunda metade do período recuou -90.0%",
    );
    expect(generateLocalInsights(input({ metrics: series(100, 110) }))).toContain(
      "**Tráfego estável** ao longo do período (variação de +10.0%)",
    );
  });

  it("says nothing rather than dividing by an empty first half", () => {
    const out = generateLocalInsights(input({ metrics: series(0, 100) }));
    expect(out).not.toContain("Tendência");
    expect(out).not.toContain("Tráfego estável");
    expect(out).not.toContain("NaN");
  });

  it("survives 14 undated rows without emitting NaN", () => {
    const undated = Array.from({ length: 14 }, () => ({
      visitors: 50,
      leads: 0,
      estimated_value: 0,
    }));
    const out = generateLocalInsights(input({ metrics: undated }));
    expect(out).not.toContain("NaN");
    expect(out).toContain("Padrões de sazonalidade ainda não estão estatisticamente significativos");
  });
});

describe("seasonality — hour of day", () => {
  const hourly = (points: Array<[number, number]>) =>
    generateLocalInsights(
      input({ hourlyDistribution: points.map(([hour, visitors]) => ({ hour, visitors })) }),
    );

  it("ignores an hourly series that is present but empty of traffic", () => {
    const out = hourly([
      [0, 0],
      [13, 0],
    ]);
    expect(out).not.toContain("Horários de pico");
    expect(out).not.toContain("Período mais ativo");
    expect(out).toContain("Padrões de sazonalidade ainda não estão estatisticamente significativos");
  });

  it("names the three busiest hours, zero-padded and ranked", () => {
    const out = hourly([
      [14, 100],
      [9, 40],
      [20, 30],
      [3, 5],
    ]);
    expect(out).toContain("**Horários de pico:** 14h, 09h, 20h");
    expect(out).not.toContain("03h");
  });

  it("buckets each boundary hour into the right part of the day", () => {
    // 0, 6, 12 and 18 are the exact edges of the four buckets.
    expect(hourly([[0, 100], [6, 1]])).toContain("**Período mais ativo:** Madrugada (00–06h) concentra 99%");
    expect(hourly([[6, 100], [0, 1]])).toContain("**Período mais ativo:** Manhã (06–12h) concentra 99%");
    expect(hourly([[12, 100], [0, 1]])).toContain("**Período mais ativo:** Tarde (12–18h) concentra 99%");
    expect(hourly([[18, 100], [0, 1]])).toContain("**Período mais ativo:** Noite (18–24h) concentra 99%");
  });
});

describe("recommendations", () => {
  it("promotes whichever conversion path is actually winning", () => {
    const whatsapp = generateLocalInsights(
      input({ conversions: { whatsapp_clicks: 10, form_submissions: 5, button_clicks: 0 } }),
    );
    expect(whatsapp).toContain("**WhatsApp lidera as conversões.**");
    expect(whatsapp).not.toContain("**Formulários performam bem.**");

    const forms = generateLocalInsights(
      input({ conversions: { whatsapp_clicks: 5, form_submissions: 10, button_clicks: 0 } }),
    );
    expect(forms).toContain("**Formulários performam bem.**");
  });

  it("breaks a tie between WhatsApp and forms in favour of forms", () => {
    const tie = generateLocalInsights(
      input({ conversions: { whatsapp_clicks: 5, form_submissions: 5, button_clicks: 0 } }),
    );
    expect(tie).not.toContain("**WhatsApp lidera as conversões.**");
    expect(tie).toContain("**Formulários performam bem.**");
  });

  it("recognises search and social channels by name, case-insensitively", () => {
    const seo = generateLocalInsights(input({ trafficSources: [{ source: "google / orgânico", visitors: 10 }] }));
    expect(seo).toContain("**SEO orgânico está performando.**");

    for (const source of ["Instagram Stories", "Facebook Ads", "TikTok"]) {
      expect(generateLocalInsights(input({ trafficSources: [{ source, visitors: 10 }] }))).toContain(
        "**Redes sociais convertem.**",
      );
    }

    const neither = generateLocalInsights(input({ trafficSources: [{ source: "Newsletter", visitors: 10 }] }));
    expect(neither).not.toContain("**SEO orgânico está performando.**");
    expect(neither).not.toContain("**Redes sociais convertem.**");
  });

  it("prioritises mobile only when mobile actually leads", () => {
    expect(generateLocalInsights(input({ devices: [{ device: "Mobile" }] }))).toContain(
      "**Audiência majoritariamente mobile.**",
    );
    expect(generateLocalInsights(input({ devices: [{ device: "Desktop" }] }))).not.toContain(
      "**Audiência majoritariamente mobile.**",
    );
  });

  it("advises on bounce at 60%, ten points before it becomes a warning", () => {
    expect(generateLocalInsights(input({ engagement: { bounce_rate: 60 } }))).not.toContain("**Reduza a rejeição:**");
    const out = generateLocalInsights(input({ engagement: { bounce_rate: 61 } }));
    expect(out).toContain("**Reduza a rejeição:**");
    // 61% advises but does not yet alarm — the warning section starts above 70.
    expect(out).not.toContain("Taxa de rejeição alta");
  });

  it("suggests A/B testing only with enough traffic to read the result", () => {
    const thin = generateLocalInsights(
      input({ summary: { totalVisitors: 200, totalLeads: 1, totalViews: 0, totalSessions: 0 } }),
    );
    expect(thin).not.toContain("**Implemente testes A/B**");

    const enough = generateLocalInsights(
      input({ summary: { totalVisitors: 201, totalLeads: 1, totalViews: 0, totalSessions: 0 } }),
    );
    expect(enough).toContain("**Implemente testes A/B**");
  });

  it("pushes diversification above 60% share, before the 70% alarm", () => {
    const at = generateLocalInsights(
      input({
        trafficSources: [
          { source: "Bing", visitors: 60 },
          { source: "Direct", visitors: 40 },
        ],
      }),
    );
    expect(at).not.toContain("**Diversifique aquisição:**");

    const over = generateLocalInsights(
      input({
        trafficSources: [
          { source: "Bing", visitors: 61 },
          { source: "Direct", visitors: 39 },
        ],
      }),
    );
    expect(over).toContain("**Diversifique aquisição:** desenvolva pelo menos um canal secundário relevante para reduzir dependência de Bing");
  });

  it("falls back to a maintenance cadence when no rule applies", () => {
    expect(generateLocalInsights(input())).toContain("Mantenha cadência de produção de conteúdo");
  });
});

describe("next steps", () => {
  it("names the real channel and device when known", () => {
    const out = generateLocalInsights(
      input({
        trafficSources: [{ source: "Instagram", visitors: 10 }],
        devices: [{ device: "Mobile" }],
        summary: { totalVisitors: 1000, totalLeads: 25, totalViews: 0, totalSessions: 0 },
      }),
    );
    expect(out).toContain("além de Instagram");
    expect(out).toContain("(prioridade: Mobile)");
    // Target = current rate + 20%: 2.50% -> 3.00%
    expect(out).toContain("**3.00%** (crescimento de 20% sobre a taxa atual)");
  });

  it("degrades to generic wording with no channel or device on record", () => {
    const out = generateLocalInsights(input());
    expect(out).toContain("além de seu canal principal");
    expect(out).not.toContain("(prioridade:");
    expect(out).toContain("**0.00%** (crescimento de 20%");
  });
});

describe("generateInsightDetails", () => {
  const titles = (i: InsightsInput) => generateInsightDetails(i).map((d) => d.title);
  const find = (i: InsightsInput, needle: string) =>
    generateInsightDetails(i).find((d) => d.title.includes(needle));

  it("still emits the device card on empty input, using its placeholder name", () => {
    const details = generateInsightDetails(input());
    expect(details).toHaveLength(1);
    expect(details[0].title).toBe("Dispositivo dominante: dispositivo principal");
  });

  it("treats a moderate leading channel as a template instead of a risk", () => {
    const balanced = input({
      trafficSources: [
        { source: "Google", visitors: 50 },
        { source: "Direct", visitors: 50 },
      ],
    });
    const detail = find(balanced, "Google");
    expect(detail!.recommendation).toContain("como referência para replicar campanhas");
    expect(detail!.recommendation).not.toContain("Reduza a dependência");
    expect(detail!.sources).toEqual([
      { label: "Canal líder", value: "Google" },
      { label: "Visitantes do canal", value: "50" },
      { label: "Participação no tráfego", value: "50.0%" },
    ]);
  });

  it("credits whichever conversion type led", () => {
    expect(
      titles(input({ conversions: { whatsapp_clicks: 1, form_submissions: 10, button_clicks: 2 } })),
    ).toContain("Conversão mais forte: Formulários");
    expect(
      titles(input({ conversions: { whatsapp_clicks: 1, form_submissions: 2, button_clicks: 10 } })),
    ).toContain("Conversão mais forte: CTAs");
    expect(
      titles(input({ conversions: { whatsapp_clicks: 10, form_submissions: 2, button_clicks: 1 } })),
    ).toContain("Conversão mais forte: WhatsApp");
  });

  it("omits the funnel card when there is neither a bounce rate nor a conversion", () => {
    const t = titles(input());
    expect(t).not.toContain("Sinal de fricção no funil");
    expect(t).not.toContain("Eficiência do funil monitorada");
  });

  it("calls the funnel healthy only above 1% conversion and at or below 70% bounce", () => {
    const healthy = input({
      summary: { totalVisitors: 1000, totalLeads: 20, totalViews: 0, totalSessions: 0 },
      engagement: { bounce_rate: 50 },
    });
    const card = find(healthy, "funil")!;
    expect(card.title).toBe("Eficiência do funil monitorada");
    expect(card.reason).toContain("A taxa de conversão atual é 2.00%");
    expect(card.recommendation).toContain("replicar padrões que já estão funcionando");
  });

  it("flags friction from a weak conversion rate even when bounce looks fine", () => {
    const weak = input({
      summary: { totalVisitors: 1000, totalLeads: 5, totalViews: 0, totalSessions: 0 },
      engagement: { bounce_rate: 50 },
    });
    const card = find(weak, "funil")!;
    expect(card.title).toBe("Sinal de fricção no funil");
    // Bounce is not the problem here, so the reason must quote the rate.
    expect(card.reason).toContain("A taxa de conversão atual é 0.50%");
    expect(card.recommendation).toContain("Teste headline, oferta, CTA");
  });

  it("flags friction from a high bounce rate and quotes the bounce instead", () => {
    const bouncy = input({
      summary: { totalVisitors: 1000, totalLeads: 50, totalViews: 0, totalSessions: 0 },
      engagement: { bounce_rate: 80 },
    });
    const card = find(bouncy, "funil")!;
    expect(card.title).toBe("Sinal de fricção no funil");
    expect(card.reason).toContain("taxa de rejeição está em 80.0%");
  });

  it("labels a missing bounce rate as unknown rather than as 0%", () => {
    const noBounce = input({
      summary: { totalVisitors: 1000, totalLeads: 20, totalViews: 0, totalSessions: 0 },
    });
    const card = find(noBounce, "funil")!;
    expect(card.sources).toContainEqual({ label: "Taxa de rejeição", value: "Sem dados" });
  });

  it("reads a decline in either metric as something to investigate", () => {
    const bothDown = find(input({ comparison: { visitorsChange: -10, leadsChange: -5 } }), "Variação")!;
    expect(bothDown.recommendation).toContain("Revise mudanças recentes");

    // Traffic up but leads down still counts as a decline worth explaining.
    const mixed = find(input({ comparison: { visitorsChange: 10, leadsChange: -5 } }), "Variação")!;
    expect(mixed.recommendation).toContain("Revise mudanças recentes");

    const bothUp = find(input({ comparison: { visitorsChange: 10, leadsChange: 5 } }), "Variação")!;
    expect(bothUp.recommendation).toContain("Mapeie as ações recentes");
    expect(bothUp.reason).toContain("O tráfego variou +10.0% e os leads variaram +5.0%");
  });

  it("omits the variation card when nothing moved", () => {
    expect(titles(input({ comparison: { visitorsChange: 0, leadsChange: 0 } }))).not.toContain(
      "Variação em relação ao período anterior",
    );
  });

  it("omits the peak-hour card when the busiest hour saw no traffic", () => {
    expect(titles(input({ hourlyDistribution: [{ hour: 14, visitors: 0 }] })).join()).not.toContain(
      "Janela de maior atenção",
    );

    const busy = find(
      input({
        hourlyDistribution: [
          { hour: 14, visitors: 10 },
          { hour: 9, visitors: 5 },
        ],
      }),
      "Janela de maior atenção",
    )!;
    expect(busy.title).toBe("Janela de maior atenção: 14h");
    expect(busy.sources).toContainEqual({ label: "Amostra horária", value: "2 faixas" });
  });

  it("sums the metrics when no summary is supplied", () => {
    const card = find(
      input({
        metrics: [
          { date: "2026-08-01", visitors: 10, leads: 1, estimated_value: 0 },
          { date: "2026-08-02", visitors: 10, leads: 1, estimated_value: 0 },
        ],
      }),
      "Dispositivo dominante",
    )!;
    expect(card.sources).toContainEqual({ label: "Visitantes totais", value: "20" });
    expect(card.sources).toContainEqual({ label: "Leads gerados", value: "2" });
  });
});
