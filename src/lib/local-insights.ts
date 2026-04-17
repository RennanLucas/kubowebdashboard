// Analisador local de insights — gera análises baseadas em regras, sem IA, sem custo.

interface Metric {
  visitors: number;
  leads: number;
  estimated_value: number | string;
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
}

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
    recomendacoes.push(`🎯 Otimize \`${topPage.page_path}\` com CTAs mais visíveis — é onde está sua maior audiência.`);
  if (topSource && topSource.source.toLowerCase().includes("google"))
    recomendacoes.push(`🔍 Tráfego orgânico está forte — invista em mais conteúdo SEO sobre temas similares.`);
  if (topSource && (topSource.source.toLowerCase().includes("instagram") || topSource.source.toLowerCase().includes("facebook")))
    recomendacoes.push(`📱 Redes sociais trazem bons resultados — aumente frequência de posts com link para o site.`);
  if (topDevice && topDevice.device.toLowerCase().includes("mobile"))
    recomendacoes.push(`📱 Maioria acessa por mobile — priorize otimizações de velocidade e UX mobile-first.`);
  if (bounce > 60)
    recomendacoes.push(`⚡ Reduza tempo de carregamento e melhore a primeira dobra para baixar a rejeição.`);
  if (conversionRate < 2 && totalVisitors > 200)
    recomendacoes.push(`🧪 Teste A/B em headlines e CTAs principais — pequenas mudanças podem dobrar conversão.`);
  if (recomendacoes.length === 0)
    recomendacoes.push(`Continue produzindo conteúdo consistente e monitorando os KPIs semanalmente.`);

  // === PRÓXIMOS PASSOS ===
  const proximos = [
    `1. Revisar a página \`${topPage?.page_path || "principal"}\` e otimizar CTAs.`,
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
    `💡 **RECOMENDAÇÕES PRÁTICAS**`,
    ...recomendacoes.map((r) => `• ${r}`),
    ``,
    `🚀 **PRÓXIMOS PASSOS**`,
    ...proximos,
  ].join("\n");
}
