/**
 * Static copy for the marketing landing page.
 *
 * Everything here describes real product capabilities, not fabricated usage
 * metrics or invented customer names — keep it that way. Numbers that depend
 * on interactive demo state live alongside the component that renders them.
 */

export const NAV_LINKS: Array<[label: string, href: string]> = [
  ["Produto", "#product-story"],
  ["Recursos", "#capabilities"],
  ["Comparativo", "#comparative"],
  ["Planos", "#pricing"],
  ["Dúvidas", "#faq"],
];

export const HERO_TYPING_PHRASES = [
  "do primeiro clique",
  "de cada visitante",
  "de cada conversão",
  "em tempo real",
];

/** Illustrative rows for the hero's live reader. Labels are explicit that this is demo data. */
export const LIVE_FEED = [
  { id: "e1", time: "14:02:11", what: "Visita em /servicos", detail: "Google Orgânico", where: "São Paulo", lead: false },
  { id: "e2", time: "14:02:09", what: "Clique no WhatsApp", detail: "Botão flutuante", where: "Curitiba", lead: true },
  { id: "e3", time: "14:01:54", what: "Visita em /precos", detail: "Instagram", where: "Recife", lead: false },
  { id: "e4", time: "14:01:48", what: "Clique no WhatsApp", detail: "CTA do rodapé", where: "Rio de Janeiro", lead: true },
  { id: "e5", time: "14:01:31", what: "Visita em /", detail: "Busca direta", where: "Belo Horizonte", lead: false },
  { id: "e6", time: "14:01:20", what: "Envio de formulário", detail: "Orçamento rápido", where: "Porto Alegre", lead: true },
  { id: "e7", time: "14:01:02", what: "Visita em /sobre", detail: "LinkedIn", where: "Florianópolis", lead: false },
];

/** Product facts used in the compact capability marquee under the hero. */
export const CAPABILITY_MARQUEE = [
  "Script ultraleve de 2KB",
  "Tempo real, sem atraso de 48h",
  "100% LGPD · sem cookies invasivos",
  "Rastreamento automático de WhatsApp",
  "Heatmap de cliques incluso",
  "Dashboard white-label para agências",
  "Relatórios em PDF e Excel em 1 clique",
  "Resumos semanais com IA",
];

export const STORY_STEPS = [
  {
    kicker: "Visão geral",
    title: "O pulso do seu site em uma tela.",
    copy: "Visitantes, visualizações, sessões, leads e conversão entram em contexto, com comparação de período e leitura por projeto.",
    stat: "12.842",
    label: "visitantes no período (demo)",
  },
  {
    kicker: "02 · Aquisição",
    title: "Descubra de onde a atenção vem.",
    copy: "Separe tráfego direto, orgânico, social, pago, referência e e-mail. Cruze a origem com dispositivos e páginas mais acessadas.",
    stat: "42%",
    label: "de tráfego orgânico (demo)",
  },
  {
    kicker: "03 · Comportamento",
    title: "Encontre o caminho até a ação.",
    copy: "Acompanhe páginas, horários, dispositivos, localização aproximada e mapas de calor para reconhecer padrões de navegação.",
    stat: "3,78%",
    label: "de conversão (demo)",
  },
  {
    kicker: "04 · Decisão",
    title: "Transforme sinal em próxima ação.",
    copy: "Metas, alertas, comparações, relatórios e resumos com IA ajudam a priorizar o que merece atenção agora.",
    stat: "+24%",
    label: "em leads demonstrativos",
  },
];

export const PROBLEM_POINTS = [
  {
    title: "Relatórios com 24h a 48h de atraso",
    copy: "Você precisa esperar até 2 dias para saber se uma campanha ou post funcionou.",
  },
  {
    title: "Sem rastreamento nativo de WhatsApp",
    copy: "Exige configurar Google Tag Manager, dataLayer e triggers complexos que frequentemente quebram.",
  },
  {
    title: "Script pesado (45KB a 120KB)",
    copy: "Penaliza o Google PageSpeed e derruba as notas de Core Web Vitals do site.",
  },
  {
    title: "Banners de consentimento invasivos",
    copy: "Cookies de terceiros que incomodam visitantes e reduzem a taxa de permanência.",
  },
];

export const SOLUTION_POINTS = [
  {
    title: "Dados em tempo real, sem delay",
    copy: "Visitantes ativos, eventos e conversões são computados no instante em que ocorrem.",
  },
  {
    title: "Cliques no WhatsApp rastreados sozinhos",
    copy: "O script detecta links de WhatsApp e envios de formulário automaticamente. Zero setup.",
  },
  {
    title: "Snippet de apenas 2KB",
    copy: "Assíncrono, imperceptível no navegador, feito para preservar a nota no PageSpeed.",
  },
  {
    title: "Privacidade por princípio (LGPD)",
    copy: "Sem cookies invasivos de remarketing cruzado. Métricas fiéis sem banners chatos.",
  },
];

export const CAPABILITIES = [
  {
    title: "Motor de conversão de WhatsApp",
    copy: "Detecte automaticamente cada clique em links de WhatsApp, telefones e formulários no seu site, sem mexer no código do botão.",
  },
  {
    title: "Mapas de calor por dia e horário",
    copy: "Visualize padrões de atividade para saber exatamente quando seu público navega e decide.",
  },
  {
    title: "Alertas inteligentes",
    copy: "Quedas, picos e mudanças de tráfego aparecem no painel e, no Pro, também por e-mail.",
  },
  {
    title: "Metas e funis",
    copy: "Acompanhe a taxa de conversão do primeiro acesso até o clique decisivo em cada página.",
  },
  {
    title: "Relatórios executivos em 1 clique",
    copy: "Exporte apresentações em PDF e planilhas Excel nativas para enviar a clientes.",
  },
  {
    title: "Multi-tenant & white-label",
    copy: "Crie organizações separadas para cada cliente da sua agência, com relatórios sob sua marca.",
  },
];

export const COMPATIBILITY_PLATFORMS = [
  "WordPress", "Shopify", "Nuvemshop", "WooCommerce", "Hotmart", "Kiwify",
  "Webflow", "Framer", "Wix", "Next.js / React", "Yampi", "HTML / qualquer site",
];

export const COMPARISON_ROWS = [
  { feature: "Tempo de instalação", ga4: "Horas ou dias com GTM e dataLayer", kubo: "2 minutos (1 linha de código)" },
  { feature: "Latência dos dados", ga4: "24h a 48h de espera", kubo: "Tempo real" },
  { feature: "Cliques no WhatsApp", ga4: "Exige triggers e tags manuais", kubo: "Detectado automaticamente" },
  { feature: "Relatórios executivos", ga4: "Requer montar no Looker Studio", kubo: "1 clique em PDF e Excel" },
  { feature: "Peso do script", ga4: "~45KB a 120KB (gtag.js)", kubo: "~2KB" },
  { feature: "Impacto no PageSpeed", ga4: "Penaliza Core Web Vitals", kubo: "Pensado para nota alta" },
  { feature: "Resumos com IA", ga4: "Inexistentes no painel", kubo: "Diagnóstico semanal automático" },
  { feature: "Conformidade LGPD", ga4: "Exige banner de cookies", kubo: "Sem cookies de terceiros" },
];

export const SECURITY_ITEMS = [
  {
    title: "LGPD nativa por princípio",
    desc: "Sem cookies invasivos de terceiros, sem fingerprinting de dispositivos e sem compartilhamento cruzado de dados.",
  },
  {
    title: "Isolamento multi-tenant",
    desc: "Arquitetura com Row Level Security (RLS) no banco de dados. Organizações e clientes têm isolamento estrito de dados.",
  },
  {
    title: "Processamento em borda (edge)",
    desc: "Coleta distribuída com baixa latência. O carregamento do seu site não é afetado pelo rastreamento.",
  },
  {
    title: "Infraestrutura serverless elástica",
    desc: "Projetada para absorver picos de tráfego de campanhas e e-commerces sem perder eventos.",
  },
];

export const SETUP_STEPS = [
  { number: "01", title: "Crie sua conta", copy: "Comece pelo plano gratuito e configure sua organização em segundos." },
  { number: "02", title: "Adicione o seu site", copy: "Cadastre o domínio do seu projeto e copie o snippet de código." },
  { number: "03", title: "Instale uma única vez", copy: "Cole o script no cabeçalho do site (WordPress, Webflow, etc.)." },
  { number: "04", title: "Acompanhe os dados", copy: "Visitantes e conversões começam a aparecer instantaneamente." },
];

export const INSTALL_SNIPPET = `<script defer src="https://kuboweb.com.br/k.js" data-site="kw_live_839f2"></script>`;

export const FREE_PLAN_FEATURES = [
  "1 projeto com domínio próprio",
  "Histórico de 7 dias de navegação",
  "Métricas essenciais de páginas e fontes",
  "Rastreamento automático de cliques",
  "Alertas básicos de atividade",
  "Script ultraleve de 2KB",
  "Totalmente compatível com a LGPD",
];

export const FALLBACK_PRO_PLAN = {
  name: "Pro",
  tagline: "Para empresas e agências que precisam de precisão e conversão em tempo real.",
  price: "R$ 49,90",
  cadence: "/mês",
  cta: "Começar 7 dias grátis",
  features: [
    "Projetos e sites ilimitados",
    "Visitantes e eventos em tempo real (Kubo Live)",
    "Rastreamento nativo de cliques de WhatsApp",
    "Mapas de calor por dia e horário",
    "Relatórios executivos em PDF e Excel",
    "Diagnóstico semanal com IA",
    "Histórico estendido de 12 meses",
    "Ambientes multi-tenant para agências e clientes",
    "Suporte prioritário",
  ],
};

export const FAQ_ITEMS: Array<[question: string, answer: string]> = [
  ["Preciso trocar o analytics que já uso?", "Não. O Kubo pode ser instalado como uma camada de leitura própria do seu site, sem exigir que você remova outras ferramentas."],
  ["O que o Kubo acompanha?", "Visitantes, visualizações, sessões, páginas, fontes de tráfego, dispositivos, localização aproximada e eventos configurados, como cliques em WhatsApp, formulários e botões."],
  ["O Kubo respeita consentimento e LGPD?", "Sim. No modo de consentimento obrigatório, o rastreador não cria identificadores nem envia requisições antes da autorização do visitante."],
  ["Posso acompanhar mais de um site?", "Sim. O plano gratuito inclui um projeto; o plano Pro permite projetos ilimitados e mantém os dados separados por organização."],
  ["Há acompanhamento em tempo real?", "Sim. O Kubo Live mostra visitantes ativos, páginas, origens e eventos recentes. Esse recurso faz parte do plano Pro."],
  ["Consigo exportar os dados?", "No Pro, você pode gerar relatórios e exportar dados em PDF, CSV e Excel, além de usar o modo apresentação."],
];
