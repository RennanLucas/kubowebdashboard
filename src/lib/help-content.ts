export interface HelpCategory {
  id: string;
  title: string;
  icon: string;
  articles: HelpArticleMeta[];
}

export interface HelpArticleMeta {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  keywords: string[];
}

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    id: "getting-started",
    title: "Primeiros passos",
    icon: "Rocket",
    articles: [
      { id: "tracking-install", title: "Como instalar o Kubo Analytics no seu site", description: "Instale, configure o consentimento e valide a primeira visita.", categoryId: "getting-started", keywords: ["instalação", "script", "wordpress", "shopify", "wix", "gtm", "html", "consentimento"] },
      { id: "no-data", title: "Não estou vendo dados", description: "Diagnóstico rápido quando visitas e eventos não aparecem.", categoryId: "getting-started", keywords: ["sem dados", "visitas", "verificação", "cache", "publicação", "lgpd"] },
      { id: "tracking-issues", title: "O rastreamento não está funcionando", description: "Checklist técnico para encontrar e corrigir falhas de instalação.", categoryId: "getting-started", keywords: ["tracking", "rastreamento", "erro", "project id", "domínio", "bloqueador", "firewall"] },
    ]
  },
  {
    id: "analytics",
    title: "Analytics",
    icon: "BarChart3",
    articles: [
      { id: "metrics-explained", title: "Entendendo as métricas", description: "Interprete visitantes, visualizações, sessões, leads e conversão.", categoryId: "analytics", keywords: ["métricas", "visitantes", "pageviews", "visualizações", "sessões", "leads", "conversão", "valor estimado"] },
      { id: "dashboard-guide", title: "Como usar o Dashboard", description: "Filtros, indicadores, gráficos, origens e páginas principais.", categoryId: "analytics", keywords: ["dashboard", "filtros", "período", "origens", "dispositivos", "geografia", "utm"] },
    ]
  },
  {
    id: "conversions",
    title: "Conversões",
    icon: "Target",
    articles: [
      { id: "goals", title: "Metas e Funis", description: "Entenda o funil atual e diferencie leads de vendas estimadas.", categoryId: "conversions", keywords: ["metas", "funil", "cta", "whatsapp", "formulário", "vendas", "conversões"] },
      { id: "events", title: "Eventos personalizados", description: "Rastreie WhatsApp, formulários e botões com a API do Kubo.", categoryId: "conversions", keywords: ["eventos", "window kw", "whatsapp_click", "form_submit", "button_click", "cta"] },
    ]
  },
  {
    id: "ai",
    title: "Inteligência Artificial",
    icon: "Sparkles",
    articles: [
      { id: "ai-insights", title: "Como funcionam os Insights com IA", description: "Gere, interprete, compare e exporte análises do seu projeto.", categoryId: "ai", keywords: ["ia", "insights", "análise", "histórico", "comparação", "fontes", "limite mensal"] },
    ]
  },
  {
    id: "settings",
    title: "Configurações",
    icon: "Settings",
    articles: [
      { id: "projects", title: "Como criar e gerenciar projetos", description: "Cadastre sites, instale o código e entenda os limites do plano.", categoryId: "settings", keywords: ["projetos", "site", "url", "instalação", "gratuito", "pro", "excluir"] },
      { id: "members", title: "Perfis, membros e convites", description: "Entenda os níveis de acesso e a administração da equipe.", categoryId: "settings", keywords: ["membros", "convites", "owner", "admin", "editor", "viewer", "equipe", "permissões"] },
    ]
  },
  {
    id: "billing",
    title: "Assinatura",
    icon: "CreditCard",
    articles: [
      { id: "billing-plans", title: "Planos, limites e cobrança", description: "Compare Gratuito e Pro e gerencie sua assinatura.", categoryId: "billing", keywords: ["assinatura", "plano", "gratuito", "pro", "cobrança", "mercado pago", "cancelamento", "histórico"] },
    ]
  },
  {
    id: "faq",
    title: "Perguntas frequentes",
    icon: "HelpCircle",
    articles: [
      { id: "faq", title: "Perguntas frequentes (FAQ)", description: "Respostas rápidas sobre instalação, dados, planos e privacidade.", categoryId: "faq", keywords: ["faq", "dúvidas", "wordpress", "vários sites", "privacidade", "lgpd", "suporte"] },
    ]
  }
];

export const HELP_ARTICLES_FLAT = HELP_CATEGORIES.flatMap(c => c.articles);
