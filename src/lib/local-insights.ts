// Analisador local de insights — gera análises baseadas em regras, sem IA, sem custo.

interface Metric {
  date?: string;
  visitors: number;
  leads: number;
  estimated_value: number | string;
}

export interface HourlyPoint {
  hour: number; // 0-23
  visitors: number;
}

interface TrafficSource {
  source: string;
  visitors: number;
}

export interface InsightsInput {
  days: number;
  metrics: Metric[];
  conversions: { whatsapp_clicks: number; form_submissions: number; button_clicks: number };
  trafficSources: TrafficSource[];
  topPages: any[];
  engagement?: any;
  comparison?: any;
  devices?: any[];
  countries?: any[];
  hourlyDistribution?: HourlyPoint[];
}

const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const fmt = (n: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(n);

const fmtBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

const pct = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;

export function generateLocalInsights(input: InsightsInput): string {
  const totalVisitors = input.metrics.reduce((s, m) => s + (m.visitors || 0), 0);
  const totalLeads = input.metrics.reduce((s, m) => s + (m.leads || 0), 0);
  const totalValue = input.metrics.reduce((s, m) => s + Number(m.estimated_value || 0), 0);
  const conversionRate = totalVisitors > 0 ? (totalLeads / totalVisitors) * 100 : 0;
  const totalConversions =
    (input.conversions?.whatsapp_clicks || 0) +
    (input.conversions?.form_submissions || 0) +
    (input.conversions?.button_clicks || 0);

  const topSource = input.trafficSources?.[0];
  const topPage: any = input.topPages?.[0];
  const topPagePath = topPage?.page_path || topPage?.path || topPage?.name || "principal";
  const topPageViews = topPage?.views ?? topPage?.visitors ?? 0;
  const topCountry: any = input.countries?.[0];
  const topCountryName = topCountry?.country || topCountry?.name || topCountry?.label || "";
  const topCountryVisitors = topCountry?.visitors ?? topCountry?.value ?? 0;
  const topDevice: any = input.devices?.[0];
  const topDeviceName = topDevice?.device || topDevice?.name || topDevice?.label || "";

  const visitorsChange = input.comparison?.visitorsChange ?? 0;
  const leadsChange = input.comparison?.leadsChange ?? 0;

  const bounce = input.engagement?.bounce_rate ?? input.engagement?.bounceRate ?? 0;
  const avgTime = input.engagement?.avg_time_on_page ?? input.engagement?.avgSessionDuration ?? 0;

  // === RESUMO EXECUTIVO ===
  let resumo = `Nos últimos ${input.days} dias, seu site recebeu **${fmt(totalVisitors)} visitantes** `;
  resumo += `e gerou **${fmt(totalLeads)} leads**, com valor estimado de **${fmtBRL(totalValue)}**. `;
  resumo += `Taxa de conversão de **${conversionRate.toFixed(2)}%**.`;

  // === DESTAQUES ===
  const destaques: string[] = [];
  if (visitorsChange > 10)
    destaques.push(`📈 Tráfego cresceu ${pct(visitorsChange)} vs período anterior — ótimo sinal!`);
  if (leadsChange > 10)
    destaques.push(`🎯 Leads aumentaram ${pct(leadsChange)} — sua estratégia está funcionando.`);
  if (topSource)
    destaques.push(`🚀 **${topSource.source}** é seu canal #1 com ${fmt(topSource.visitors)} visitantes.`);
  if (topPage)
    destaques.push(`📄 Página mais vista: \`${topPagePath}\` (${fmt(topPageViews)} views).`);
  if (conversionRate >= 3)
    destaques.push(`✨ Taxa de conversão ${conversionRate.toFixed(2)}% está acima da média do mercado (1-3%).`);
  if (topCountry && topCountryName)
    destaques.push(`🌎 Maior audiência em **${topCountryName}** (${fmt(topCountryVisitors)} visitantes).`);
  if (destaques.length === 0)
    destaques.push("Continue acompanhando — ainda está coletando dados suficientes para destaques.");

  // === PONTOS DE ATENÇÃO ===
  const atencao: string[] = [];
  if (visitorsChange < -15)
    atencao.push(`⚠️ Queda significativa de tráfego (${pct(visitorsChange)}). Revise campanhas e SEO.`);
  if (leadsChange < -15)
    atencao.push(`⚠️ Leads caíram ${pct(leadsChange)}. Verifique formulários e CTAs.`);
  if (conversionRate < 1 && totalVisitors > 100)
    atencao.push(`⚠️ Conversão abaixo de 1% (${conversionRate.toFixed(2)}%). Otimize CTAs e proposta de valor.`);
  if (bounce > 70)
    atencao.push(`⚠️ Taxa de rejeição alta (${bounce.toFixed(1)}%). Conteúdo pode não estar engajando.`);
  if (avgTime > 0 && avgTime < 15)
    atencao.push(`⚠️ Tempo médio na página muito baixo (${avgTime.toFixed(0)}s). Melhore o conteúdo above-the-fold.`);
  if (totalConversions === 0 && totalVisitors > 50)
    atencao.push(`⚠️ Nenhuma conversão registrada. Verifique se o tracking de eventos está instalado corretamente.`);
  if (topSource && input.trafficSources.length === 1)
    atencao.push(`⚠️ Você depende 100% de um único canal (${topSource.source}). Diversifique para reduzir risco.`);
  if (atencao.length === 0)
    atencao.push("✅ Nenhum problema crítico detectado. Mantenha o monitoramento.");

  // === RECOMENDAÇÕES ===
  const recomendacoes: string[] = [];
  if (input.conversions?.whatsapp_clicks > input.conversions?.form_submissions)
    recomendacoes.push(`💬 WhatsApp converte mais que formulário — destaque ainda mais o botão de WhatsApp.`);
  else if (input.conversions?.form_submissions > 0)
    recomendacoes.push(`📝 Formulários estão performando — teste reduzir campos para aumentar conversão.`);
  if (topPage)
    recomendacoes.push(`🎯 Otimize \`${topPagePath}\` com CTAs mais visíveis — é onde está sua maior audiência.`);
  if (topSource && topSource.source.toLowerCase().includes("google"))
    recomendacoes.push(`🔍 Tráfego orgânico está forte — invista em mais conteúdo SEO sobre temas similares.`);
  if (topSource && (topSource.source.toLowerCase().includes("instagram") || topSource.source.toLowerCase().includes("facebook")))
    recomendacoes.push(`📱 Redes sociais trazem bons resultados — aumente frequência de posts com link para o site.`);
  if (topDevice && topDeviceName.toLowerCase().includes("mobile"))
    recomendacoes.push(`📱 Maioria acessa por mobile — priorize otimizações de velocidade e UX mobile-first.`);
  if (bounce > 60)
    recomendacoes.push(`⚡ Reduza tempo de carregamento e melhore a primeira dobra para baixar a rejeição.`);
  if (conversionRate < 2 && totalVisitors > 200)
    recomendacoes.push(`🧪 Teste A/B em headlines e CTAs principais — pequenas mudanças podem dobrar conversão.`);
  if (recomendacoes.length === 0)
    recomendacoes.push(`Continue produzindo conteúdo consistente e monitorando os KPIs semanalmente.`);

  // === SAZONALIDADE: melhor dia da semana ===
  const sazonalidade: string[] = [];
  const byWeekday: { sum: number; count: number }[] = Array.from({ length: 7 }, () => ({ sum: 0, count: 0 }));
  for (const m of input.metrics) {
    if (!m.date) continue;
    // Parse YYYY-MM-DD como local para evitar shift de timezone
    const [y, mo, d] = m.date.split("-").map(Number);
    if (!y || !mo || !d) continue;
    const wd = new Date(y, mo - 1, d).getDay();
    byWeekday[wd].sum += m.visitors || 0;
    byWeekday[wd].count += 1;
  }
  const weekdayAvgs = byWeekday.map((b, i) => ({
    day: DAY_NAMES[i],
    avg: b.count > 0 ? b.sum / b.count : 0,
    count: b.count,
  }));
  const validDays = weekdayAvgs.filter((w) => w.count > 0);
  if (validDays.length >= 3) {
    const best = [...validDays].sort((a, b) => b.avg - a.avg)[0];
    const worst = [...validDays].sort((a, b) => a.avg - b.avg)[0];
    const overallAvg = validDays.reduce((s, w) => s + w.avg, 0) / validDays.length;
    sazonalidade.push(
      `📅 **Melhor dia da semana:** ${best.day} (média de ${fmt(best.avg)} visitantes/dia, ${pct(((best.avg - overallAvg) / overallAvg) * 100)} vs média).`,
    );
    if (worst.day !== best.day && worst.avg < overallAvg * 0.7) {
      sazonalidade.push(
        `📉 **Dia mais fraco:** ${worst.day} (média de ${fmt(worst.avg)} visitantes/dia). Considere campanhas específicas.`,
      );
    }
    // Diferença fim de semana vs dias úteis
    const weekend = [weekdayAvgs[0], weekdayAvgs[6]].filter((w) => w.count > 0);
    const weekdays = weekdayAvgs.slice(1, 6).filter((w) => w.count > 0);
    if (weekend.length > 0 && weekdays.length > 0) {
      const weAvg = weekend.reduce((s, w) => s + w.avg, 0) / weekend.length;
      const wdAvg = weekdays.reduce((s, w) => s + w.avg, 0) / weekdays.length;
      if (wdAvg > weAvg * 1.3) {
        sazonalidade.push(`💼 Tráfego de **dias úteis ${pct(((wdAvg - weAvg) / weAvg) * 100)} maior** que fim de semana — público B2B/profissional.`);
      } else if (weAvg > wdAvg * 1.3) {
        sazonalidade.push(`🏖️ Tráfego de **fim de semana ${pct(((weAvg - wdAvg) / wdAvg) * 100)} maior** que dias úteis — público consumidor/lazer.`);
      }
    }
  }

  // === SAZONALIDADE: tendência semana a semana ===
  if (input.metrics.length >= 14) {
    const sorted = [...input.metrics]
      .filter((m) => m.date)
      .sort((a, b) => (a.date! < b.date! ? -1 : 1));
    const half = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, half).reduce((s, m) => s + (m.visitors || 0), 0) / half;
    const secondHalf = sorted.slice(half).reduce((s, m) => s + (m.visitors || 0), 0) / (sorted.length - half);
    if (firstHalf > 0) {
      const trend = ((secondHalf - firstHalf) / firstHalf) * 100;
      if (trend > 15) sazonalidade.push(`📈 **Tendência ascendente:** segunda metade do período cresceu ${pct(trend)} vs primeira metade.`);
      else if (trend < -15) sazonalidade.push(`📉 **Tendência descendente:** segunda metade do período caiu ${pct(trend)} vs primeira metade.`);
      else sazonalidade.push(`➡️ **Tráfego estável** ao longo do período (variação de ${pct(trend)}).`);
    }
  }

  // === HORÁRIOS DE PICO ===
  if (input.hourlyDistribution && input.hourlyDistribution.length > 0) {
    const totalHourly = input.hourlyDistribution.reduce((s, h) => s + h.visitors, 0);
    if (totalHourly > 0) {
      const sorted = [...input.hourlyDistribution].sort((a, b) => b.visitors - a.visitors);
      const top3 = sorted.slice(0, 3).map((h) => `${String(h.hour).padStart(2, "0")}h`);
      sazonalidade.push(`⏰ **Horários de pico:** ${top3.join(", ")} concentram a maior parte do tráfego.`);

      // Períodos do dia
      const buckets = { madrugada: 0, manha: 0, tarde: 0, noite: 0 };
      for (const h of input.hourlyDistribution) {
        if (h.hour >= 0 && h.hour < 6) buckets.madrugada += h.visitors;
        else if (h.hour < 12) buckets.manha += h.visitors;
        else if (h.hour < 18) buckets.tarde += h.visitors;
        else buckets.noite += h.visitors;
      }
      const periodNames: Record<string, string> = {
        madrugada: "🌙 Madrugada (00-06h)",
        manha: "☀️ Manhã (06-12h)",
        tarde: "🌤️ Tarde (12-18h)",
        noite: "🌆 Noite (18-24h)",
      };
      const bestPeriod = Object.entries(buckets).sort((a, b) => b[1] - a[1])[0];
      sazonalidade.push(
        `${periodNames[bestPeriod[0]]} é o período mais ativo (${((bestPeriod[1] / totalHourly) * 100).toFixed(0)}% das visitas).`,
      );
    }
  } else {
    sazonalidade.push(`💡 Dica: dados horários ainda não disponíveis para detectar horários de pico exatos.`);
  }

  if (sazonalidade.length === 0) {
    sazonalidade.push("Continue coletando dados — em alguns dias será possível detectar padrões de sazonalidade.");
  }

  // === PRÓXIMOS PASSOS ===
  const proximos = [
    `1. Revisar a página \`${topPagePath}\` e otimizar CTAs.`,
    `2. Configurar alertas para quedas >20% em tráfego ou leads.`,
    `3. Diversificar canais de aquisição além de ${topSource?.source || "seu canal principal"}.`,
    `4. Analisar comportamento por dispositivo e ajustar UX onde necessário.`,
    `5. Definir meta de conversão para o próximo período (sugestão: ${(conversionRate * 1.2).toFixed(2)}%).`,
  ];

  return [
    `📊 **RESUMO EXECUTIVO**`,
    resumo,
    ``,
    `🎯 **PRINCIPAIS DESTAQUES**`,
    ...destaques.map((d) => `• ${d}`),
    ``,
    `⚠️ **PONTOS DE ATENÇÃO**`,
    ...atencao.map((a) => `• ${a}`),
    ``,
    `📅 **SAZONALIDADE & PADRÕES**`,
    ...sazonalidade.map((s) => `• ${s}`),
    ``,
    `💡 **RECOMENDAÇÕES PRÁTICAS**`,
    ...recomendacoes.map((r) => `• ${r}`),
    ``,
    `🚀 **PRÓXIMOS PASSOS**`,
    ...proximos,
  ].join("\n");
}

