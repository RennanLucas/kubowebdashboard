// Analisador local de insights — relatório executivo baseado em regras, sem IA, sem custo.

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

export interface InsightDetail {
  title: string;
  reason: string;
  recommendation: string;
}

const DAY_NAMES = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

const fmt = (n: number) =>
  new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 }).format(n);

const fmtBRL = (n: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(n);

const pct = (n: number) => `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;

const healthScore = (
  conversionRate: number,
  bounce: number,
  visitorsChange: number,
  leadsChange: number,
): { score: number; label: string; color: string } => {
  let score = 50;
  if (conversionRate >= 3) score += 20;
  else if (conversionRate >= 1.5) score += 10;
  else if (conversionRate < 0.5) score -= 15;
  if (bounce > 0 && bounce < 40) score += 10;
  else if (bounce > 70) score -= 10;
  if (visitorsChange > 10) score += 10;
  else if (visitorsChange < -15) score -= 15;
  if (leadsChange > 10) score += 10;
  else if (leadsChange < -15) score -= 15;
  score = Math.max(0, Math.min(100, score));
  let label = "Crítico";
  if (score >= 80) label = "Excelente";
  else if (score >= 65) label = "Saudável";
  else if (score >= 45) label = "Estável";
  else if (score >= 25) label = "Atenção";
  return { score, label, color: score >= 65 ? "🟢" : score >= 45 ? "🟡" : "🔴" };
};

export function generateLocalInsights(input: InsightsInput): string {
  const totalVisitors = input.metrics.reduce((s, m) => s + (m.visitors || 0), 0);
  const totalLeads = input.metrics.reduce((s, m) => s + (m.leads || 0), 0);
  const totalValue = input.metrics.reduce((s, m) => s + Number(m.estimated_value || 0), 0);
  const conversionRate = totalVisitors > 0 ? (totalLeads / totalVisitors) * 100 : 0;
  const valuePerVisitor = totalVisitors > 0 ? totalValue / totalVisitors : 0;
  const valuePerLead = totalLeads > 0 ? totalValue / totalLeads : 0;
  const dailyAvgVisitors = input.days > 0 ? totalVisitors / input.days : 0;
  const dailyAvgLeads = input.days > 0 ? totalLeads / input.days : 0;
  const totalConversions =
    (input.conversions?.whatsapp_clicks || 0) +
    (input.conversions?.form_submissions || 0) +
    (input.conversions?.button_clicks || 0);

  const topSource = input.trafficSources?.[0];
  const totalSourceVisitors = (input.trafficSources || []).reduce((s, t) => s + (t.visitors || 0), 0);
  const topSourceShare = topSource && totalSourceVisitors > 0
    ? (topSource.visitors / totalSourceVisitors) * 100
    : 0;

  const topPage: any = input.topPages?.[0];
  const topPagePath = topPage?.page_path || topPage?.path || topPage?.name || "página principal";
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

  const health = healthScore(conversionRate, bounce, visitorsChange, leadsChange);

  // === CABEÇALHO ===
  const today = new Date().toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" });
  const header = [
    `# Relatório de Performance`,
    `**Período analisado:** últimos ${input.days} dias  •  **Gerado em:** ${today}`,
    ``,
    `**Saúde geral:** ${health.color} **${health.label}** (${health.score}/100)`,
  ].join("\n");

  // === RESUMO EXECUTIVO ===
  const resumo = [
    `## 1. Resumo Executivo`,
    ``,
    `Durante os últimos **${input.days} dias**, a operação digital registrou **${fmt(totalVisitors)} visitantes únicos** ` +
      `(média de ${fmt(dailyAvgVisitors)}/dia), gerando **${fmt(totalLeads)} leads qualificados** ` +
      `(média de ${fmt(dailyAvgLeads)}/dia) e um valor estimado de pipeline de **${fmtBRL(totalValue)}**.`,
    ``,
    `| Indicador | Valor |`,
    `| --- | --- |`,
    `| Visitantes únicos | **${fmt(totalVisitors)}** |`,
    `| Leads gerados | **${fmt(totalLeads)}** |`,
    `| Taxa de conversão | **${conversionRate.toFixed(2)}%** |`,
    `| Valor estimado | **${fmtBRL(totalValue)}** |`,
    `| Valor médio por lead | **${fmtBRL(valuePerLead)}** |`,
    `| Valor médio por visitante | **${fmtBRL(valuePerVisitor)}** |`,
    visitorsChange !== 0 ? `| Variação de tráfego (vs período anterior) | **${pct(visitorsChange)}** |` : "",
    leadsChange !== 0 ? `| Variação de leads (vs período anterior) | **${pct(leadsChange)}** |` : "",
  ].filter(Boolean).join("\n");

  // === DESTAQUES ===
  const destaques: string[] = [];
  if (visitorsChange > 10)
    destaques.push(`Crescimento expressivo de tráfego: **${pct(visitorsChange)}** frente ao período anterior, indicando boa receptividade das ações de aquisição.`);
  if (leadsChange > 10)
    destaques.push(`Leads cresceram **${pct(leadsChange)}**, evidenciando melhora na qualificação ou no funil de conversão.`);
  if (topSource)
    destaques.push(`**${topSource.source}** consolidou-se como principal canal, respondendo por **${topSourceShare.toFixed(1)}%** do tráfego total (${fmt(topSource.visitors)} visitantes).`);
  if (topPage)
    destaques.push(`A página \`${topPagePath}\` lidera o engajamento com **${fmt(topPageViews)} visualizações**, sendo o ativo digital mais relevante do período.`);
  if (conversionRate >= 3)
    destaques.push(`Taxa de conversão de **${conversionRate.toFixed(2)}%** está acima da média de mercado (1–3%), indicando um funil bem ajustado.`);
  if (topCountry && topCountryName)
    destaques.push(`Concentração geográfica em **${topCountryName}** (${fmt(topCountryVisitors)} visitantes) — boa oportunidade para campanhas localizadas.`);
  if (valuePerVisitor > 0)
    destaques.push(`Cada visitante gera, em média, **${fmtBRL(valuePerVisitor)}** em valor potencial de pipeline.`);
  if (destaques.length === 0)
    destaques.push("O volume de dados ainda é insuficiente para identificar destaques significativos. Recomenda-se manter o monitoramento por mais 7–14 dias.");

  // === PONTOS DE ATENÇÃO ===
  const atencao: string[] = [];
  if (visitorsChange < -15)
    atencao.push(`**Queda relevante de tráfego (${pct(visitorsChange)}).** Revise campanhas pagas ativas, indexação SEO e mudanças recentes em conteúdo.`);
  if (leadsChange < -15)
    atencao.push(`**Redução de leads (${pct(leadsChange)}).** Valide o funcionamento de formulários, integrações e CTAs principais.`);
  if (conversionRate < 1 && totalVisitors > 100)
    atencao.push(`Taxa de conversão de **${conversionRate.toFixed(2)}%** está abaixo da referência de mercado. Avalie clareza da proposta de valor e fricção no funil.`);
  if (bounce > 70)
    atencao.push(`**Taxa de rejeição alta (${bounce.toFixed(1)}%).** Indica desalinhamento entre expectativa do visitante e conteúdo entregue na primeira dobra.`);
  if (avgTime > 0 && avgTime < 15)
    atencao.push(`Tempo médio na página de apenas **${avgTime.toFixed(0)}s**. Reforce headline, prova social e clareza acima da dobra.`);
  if (totalConversions === 0 && totalVisitors > 50)
    atencao.push(`**Nenhuma conversão registrada** apesar do tráfego. Confirme se o script de tracking está corretamente instalado em todas as páginas.`);
  if (topSource && topSourceShare > 70)
    atencao.push(`**Alta dependência de um único canal** (${topSource.source} = ${topSourceShare.toFixed(1)}%). Diversificar reduz risco operacional.`);
  if (atencao.length === 0)
    atencao.push("Nenhum risco crítico identificado neste período. Continue monitorando indicadores semanalmente.");

  // === CANAIS DE AQUISIÇÃO ===
  const canais: string[] = [];
  if (input.trafficSources && input.trafficSources.length > 0) {
    const top5 = input.trafficSources.slice(0, 5);
    canais.push(`| # | Canal | Visitantes | Participação |`);
    canais.push(`| --- | --- | --- | --- |`);
    top5.forEach((s, i) => {
      const share = totalSourceVisitors > 0 ? (s.visitors / totalSourceVisitors) * 100 : 0;
      canais.push(`| ${i + 1} | ${s.source} | ${fmt(s.visitors)} | ${share.toFixed(1)}% |`);
    });
  } else {
    canais.push("_Sem dados suficientes de origem de tráfego._");
  }

  // === CONVERSÕES POR TIPO ===
  const convDetalhes: string[] = [];
  const w = input.conversions?.whatsapp_clicks || 0;
  const f = input.conversions?.form_submissions || 0;
  const b = input.conversions?.button_clicks || 0;
  if (w + f + b > 0) {
    convDetalhes.push(`| Tipo de evento | Total | Participação |`);
    convDetalhes.push(`| --- | --- | --- |`);
    const total = w + f + b;
    convDetalhes.push(`| Cliques em WhatsApp | ${fmt(w)} | ${((w / total) * 100).toFixed(1)}% |`);
    convDetalhes.push(`| Envios de formulário | ${fmt(f)} | ${((f / total) * 100).toFixed(1)}% |`);
    convDetalhes.push(`| Cliques em CTAs/botões | ${fmt(b)} | ${((b / total) * 100).toFixed(1)}% |`);
  } else {
    convDetalhes.push("_Nenhuma conversão registrada no período._");
  }

  // === SAZONALIDADE ===
  const sazonalidade: string[] = [];
  const byWeekday: { sum: number; count: number }[] = Array.from({ length: 7 }, () => ({ sum: 0, count: 0 }));
  for (const m of input.metrics) {
    if (!m.date) continue;
    const [y, mo, d] = m.date.split("-").map(Number);
    if (!y || !mo || !d) continue;
    const wd = new Date(y, mo - 1, d).getDay();
    byWeekday[wd].sum += m.visitors || 0;
    byWeekday[wd].count += 1;
  }
  const weekdayAvgs = byWeekday.map((bk, i) => ({
    day: DAY_NAMES[i],
    avg: bk.count > 0 ? bk.sum / bk.count : 0,
    count: bk.count,
  }));
  const validDays = weekdayAvgs.filter((wk) => wk.count > 0);
  if (validDays.length >= 3) {
    const best = [...validDays].sort((a, bb) => bb.avg - a.avg)[0];
    const worst = [...validDays].sort((a, bb) => a.avg - bb.avg)[0];
    const overallAvg = validDays.reduce((s, wk) => s + wk.avg, 0) / validDays.length;
    sazonalidade.push(`**Melhor dia da semana:** ${best.day} (média de ${fmt(best.avg)} visitantes/dia, ${pct(((best.avg - overallAvg) / overallAvg) * 100)} vs média geral).`);
    if (worst.day !== best.day && worst.avg < overallAvg * 0.7) {
      sazonalidade.push(`**Dia de menor performance:** ${worst.day} (${fmt(worst.avg)} visitantes/dia). Avalie campanhas específicas para reativar este dia.`);
    }
    const weekend = [weekdayAvgs[0], weekdayAvgs[6]].filter((wk) => wk.count > 0);
    const weekdays = weekdayAvgs.slice(1, 6).filter((wk) => wk.count > 0);
    if (weekend.length > 0 && weekdays.length > 0) {
      const weAvg = weekend.reduce((s, wk) => s + wk.avg, 0) / weekend.length;
      const wdAvg = weekdays.reduce((s, wk) => s + wk.avg, 0) / weekdays.length;
      if (wdAvg > weAvg * 1.3) {
        sazonalidade.push(`**Perfil B2B/profissional:** dias úteis registram ${pct(((wdAvg - weAvg) / weAvg) * 100)} mais tráfego que finais de semana.`);
      } else if (weAvg > wdAvg * 1.3) {
        sazonalidade.push(`**Perfil consumidor/lazer:** finais de semana registram ${pct(((weAvg - wdAvg) / wdAvg) * 100)} mais tráfego que dias úteis.`);
      }
    }
  }

  if (input.metrics.length >= 14) {
    const sorted = [...input.metrics].filter((m) => m.date).sort((a, bb) => (a.date! < bb.date! ? -1 : 1));
    const half = Math.floor(sorted.length / 2);
    const firstHalf = sorted.slice(0, half).reduce((s, m) => s + (m.visitors || 0), 0) / half;
    const secondHalf = sorted.slice(half).reduce((s, m) => s + (m.visitors || 0), 0) / (sorted.length - half);
    if (firstHalf > 0) {
      const trend = ((secondHalf - firstHalf) / firstHalf) * 100;
      if (trend > 15) sazonalidade.push(`**Tendência ascendente:** segunda metade do período cresceu ${pct(trend)} vs primeira metade — momentum positivo.`);
      else if (trend < -15) sazonalidade.push(`**Tendência descendente:** segunda metade do período recuou ${pct(trend)} vs primeira metade — atenção à desaceleração.`);
      else sazonalidade.push(`**Tráfego estável** ao longo do período (variação de ${pct(trend)}).`);
    }
  }

  if (input.hourlyDistribution && input.hourlyDistribution.length > 0) {
    const totalHourly = input.hourlyDistribution.reduce((s, h) => s + h.visitors, 0);
    if (totalHourly > 0) {
      const sortedH = [...input.hourlyDistribution].sort((a, bb) => bb.visitors - a.visitors);
      const top3 = sortedH.slice(0, 3).map((h) => `${String(h.hour).padStart(2, "0")}h`);
      sazonalidade.push(`**Horários de pico:** ${top3.join(", ")} — concentre publicações, anúncios e disparos nestas janelas.`);
      const buckets = { madrugada: 0, manha: 0, tarde: 0, noite: 0 };
      for (const h of input.hourlyDistribution) {
        if (h.hour >= 0 && h.hour < 6) buckets.madrugada += h.visitors;
        else if (h.hour < 12) buckets.manha += h.visitors;
        else if (h.hour < 18) buckets.tarde += h.visitors;
        else buckets.noite += h.visitors;
      }
      const periodNames: Record<string, string> = {
        madrugada: "Madrugada (00–06h)",
        manha: "Manhã (06–12h)",
        tarde: "Tarde (12–18h)",
        noite: "Noite (18–24h)",
      };
      const bestPeriod = Object.entries(buckets).sort((a, bb) => bb[1] - a[1])[0];
      sazonalidade.push(`**Período mais ativo:** ${periodNames[bestPeriod[0]]} concentra ${((bestPeriod[1] / totalHourly) * 100).toFixed(0)}% das visitas.`);
    }
  }

  if (sazonalidade.length === 0) {
    sazonalidade.push("Padrões de sazonalidade ainda não estão estatisticamente significativos. Recomenda-se reanálise após 14+ dias de coleta.");
  }

  // === RECOMENDAÇÕES ===
  const recomendacoes: string[] = [];
  if (w > f && w > 0)
    recomendacoes.push(`**WhatsApp lidera as conversões.** Reforce a presença do botão flutuante em todas as páginas de produto/serviço.`);
  else if (f > 0)
    recomendacoes.push(`**Formulários performam bem.** Teste reduzir o número de campos para validar ganho marginal de conversão.`);
  if (topPage)
    recomendacoes.push(`**Otimize \`${topPagePath}\`** — adicione CTAs acima da dobra, prova social e teste variações de headline.`);
  if (topSource && /google/i.test(topSource.source))
    recomendacoes.push(`**SEO orgânico está performando.** Amplie o cluster de conteúdo em torno dos termos que já trazem tráfego.`);
  if (topSource && /(instagram|facebook|tiktok)/i.test(topSource.source))
    recomendacoes.push(`**Redes sociais convertem.** Aumente frequência e teste formatos de vídeo curto com CTA direto para o site.`);
  if (topDevice && /mobile/i.test(topDeviceName))
    recomendacoes.push(`**Audiência majoritariamente mobile.** Priorize Core Web Vitals, peso de imagens e UX de toque.`);
  if (bounce > 60)
    recomendacoes.push(`**Reduza a rejeição:** otimize tempo de carregamento, melhore a primeira dobra e revise alinhamento entre anúncio e landing.`);
  if (conversionRate < 2 && totalVisitors > 200)
    recomendacoes.push(`**Implemente testes A/B** em headlines, CTAs e provas sociais — pequenas mudanças podem dobrar a taxa de conversão.`);
  if (topSourceShare > 60)
    recomendacoes.push(`**Diversifique aquisição:** desenvolva pelo menos um canal secundário relevante para reduzir dependência de ${topSource?.source}.`);
  if (recomendacoes.length === 0)
    recomendacoes.push("Mantenha cadência de produção de conteúdo, monitore KPIs semanalmente e revise campanhas a cada 14 dias.");

  // === PRÓXIMOS PASSOS ===
  const meta = (conversionRate * 1.2).toFixed(2);
  const proximos = [
    `1. **Auditar a página \`${topPagePath}\`** e implementar melhorias de CTA, prova social e clareza de oferta.`,
    `2. **Configurar alertas automáticos** para quedas superiores a 20% em tráfego ou leads (em Configurações).`,
    `3. **Diversificar canais de aquisição** além de ${topSource?.source || "seu canal principal"}, mirando 2 fontes complementares.`,
    `4. **Revisar UX por dispositivo** ${topDeviceName ? `(prioridade: ${topDeviceName})` : ""} e ajustar pontos de fricção.`,
    `5. **Definir meta de conversão** para o próximo ciclo: **${meta}%** (crescimento de 20% sobre a taxa atual).`,
    `6. **Consolidar relatório executivo** semanal para stakeholders, comparando contra esta linha de base.`,
  ];

  return [
    header,
    ``,
    resumo,
    ``,
    `## 2. Principais Destaques`,
    ``,
    ...destaques.map((d) => `- ${d}`),
    ``,
    `## 3. Pontos de Atenção`,
    ``,
    ...atencao.map((a) => `- ${a}`),
    ``,
    `## 4. Canais de Aquisição`,
    ``,
    ...canais,
    ``,
    `## 5. Conversões por Tipo`,
    ``,
    ...convDetalhes,
    ``,
    `## 6. Sazonalidade & Padrões Temporais`,
    ``,
    ...sazonalidade.map((s) => `- ${s}`),
    ``,
    `## 7. Recomendações Práticas`,
    ``,
    ...recomendacoes.map((r) => `- ${r}`),
    ``,
    `## 8. Próximos Passos`,
    ``,
    ...proximos,
    ``,
    `---`,
    `_Análise gerada automaticamente com base nos dados de tracking proprietário. Revise os indicadores com sua equipe antes de tomar decisões estratégicas._`,
  ].join("\n");
}

export function generateInsightDetails(input: InsightsInput): InsightDetail[] {
  const totalVisitors = input.metrics.reduce((sum, metric) => sum + (metric.visitors || 0), 0);
  const totalLeads = input.metrics.reduce((sum, metric) => sum + (metric.leads || 0), 0);
  const conversionRate = totalVisitors > 0 ? (totalLeads / totalVisitors) * 100 : 0;
  const totalConversions =
    (input.conversions?.whatsapp_clicks || 0) +
    (input.conversions?.form_submissions || 0) +
    (input.conversions?.button_clicks || 0);

  const topSource = input.trafficSources?.[0];
  const totalSourceVisitors = (input.trafficSources || []).reduce((sum, source) => sum + (source.visitors || 0), 0);
  const topSourceShare = topSource && totalSourceVisitors > 0
    ? (topSource.visitors / totalSourceVisitors) * 100
    : 0;

  const topPage: any = input.topPages?.[0];
  const topPagePath = topPage?.page_path || topPage?.path || topPage?.name || "página principal";
  const topPageViews = topPage?.views ?? topPage?.visitors ?? 0;
  const topDevice: any = input.devices?.[0];
  const topDeviceName = topDevice?.device || topDevice?.name || topDevice?.label || "dispositivo principal";

  const visitorsChange = input.comparison?.visitorsChange ?? 0;
  const leadsChange = input.comparison?.leadsChange ?? 0;
  const bounce = input.engagement?.bounce_rate ?? input.engagement?.bounceRate ?? 0;

  const details: InsightDetail[] = [];

  if (topSource) {
    details.push({
      title: `Canal principal: ${topSource.source}`,
      reason: `Esse canal concentrou ${topSourceShare.toFixed(1)}% do tráfego monitorado no período, com ${fmt(topSource.visitors)} visitantes.`,
      recommendation:
        topSourceShare > 60
          ? `Reduza a dependência de ${topSource.source} testando pelo menos um canal complementar com orçamento e conteúdo dedicados.`
          : `Use ${topSource.source} como referência para replicar campanhas e criativos que já estão puxando volume de acesso.`,
    });
  }

  if (topPage) {
    details.push({
      title: `Página mais relevante: ${topPagePath}`,
      reason: `Ela liderou o período com ${fmt(topPageViews)} visualizações, sinalizando maior interesse ou melhor distribuição de tráfego.`,
      recommendation: `Priorize essa página para testar novos CTAs, reforçar prova social e melhorar a conversão acima da dobra.`,
    });
  }

  if (totalConversions > 0) {
    const whatsapp = input.conversions?.whatsapp_clicks || 0;
    const forms = input.conversions?.form_submissions || 0;
    const buttons = input.conversions?.button_clicks || 0;
    const leadingChannel = [
      { label: "WhatsApp", value: whatsapp },
      { label: "Formulários", value: forms },
      { label: "CTAs", value: buttons },
    ].sort((a, b) => b.value - a.value)[0];

    details.push({
      title: `Conversão mais forte: ${leadingChannel.label}`,
      reason: `${leadingChannel.label} respondeu pela maior parte das interações de conversão entre ${fmt(totalConversions)} eventos rastreados.`,
      recommendation: `Destaque esse caminho de conversão nas páginas com mais tráfego e reduza fricção nas etapas anteriores ao clique.`,
    });
  }

  if (topDeviceName) {
    details.push({
      title: `Dispositivo dominante: ${topDeviceName}`,
      reason: `A maior fatia da audiência atual acessa por ${topDeviceName}, então a experiência principal precisa funcionar melhor nesse contexto.`,
      recommendation: `Revise velocidade, legibilidade, espaçamento e facilidade de toque com prioridade para ${topDeviceName}.`,
    });
  }

  if (bounce > 0 || conversionRate > 0) {
    const performanceTitle = bounce > 70 || conversionRate < 1
      ? "Sinal de fricção no funil"
      : "Eficiência do funil monitorada";
    const performanceReason = bounce > 70
      ? `A taxa de rejeição está em ${bounce.toFixed(1)}%, indicando saída rápida antes de interação relevante.`
      : `A taxa de conversão atual é ${conversionRate.toFixed(2)}%, com ${fmt(totalLeads)} leads gerados a partir de ${fmt(totalVisitors)} visitantes.`;
    const performanceRecommendation = bounce > 70 || conversionRate < 1
      ? "Teste headline, oferta, CTA e consistência entre anúncio e landing page para reduzir perda logo na entrada."
      : "Use as páginas e fontes com melhor taxa de resposta como base para replicar padrões que já estão funcionando.";

    details.push({
      title: performanceTitle,
      reason: performanceReason,
      recommendation: performanceRecommendation,
    });
  }

  if (visitorsChange !== 0 || leadsChange !== 0) {
    details.push({
      title: "Variação em relação ao período anterior",
      reason: `O tráfego variou ${pct(visitorsChange)} e os leads variaram ${pct(leadsChange)} versus a janela anterior equivalente.`,
      recommendation:
        visitorsChange < 0 || leadsChange < 0
          ? "Revise mudanças recentes em campanhas, conteúdo e tracking para identificar o que impactou a queda."
          : "Mapeie as ações recentes que coincidiram com a alta para repetir esse padrão nas próximas semanas.",
    });
  }

  if (input.hourlyDistribution && input.hourlyDistribution.length > 0) {
    const topHour = [...input.hourlyDistribution].sort((a, b) => b.visitors - a.visitors)[0];
    if (topHour && topHour.visitors > 0) {
      details.push({
        title: `Janela de maior atenção: ${String(topHour.hour).padStart(2, "0")}h`,
        reason: `Esse horário concentrou o maior volume de visitas dentro da distribuição horária analisada.`,
        recommendation: `Publique conteúdo, ative campanhas ou concentre ofertas perto desse horário para capturar mais demanda.`,
      });
    }
  }

  return details.slice(0, 6);
}
