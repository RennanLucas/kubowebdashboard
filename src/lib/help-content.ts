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
}

export const HELP_CATEGORIES: HelpCategory[] = [
  {
    id: "getting-started",
    title: "🚀 Primeiros passos",
    icon: "Rocket",
    articles: [
      { id: "tracking-install", title: "Como instalar o Kubo Analytics no seu site", description: "Guia completo de instalação para todas as plataformas.", categoryId: "getting-started" },
      { id: "no-data", title: "Não estou vendo dados", description: "Passo a passo do que fazer quando os dados não aparecem.", categoryId: "getting-started" },
      { id: "tracking-issues", title: "O tracking não está funcionando", description: "Checklist de solução de problemas com o script.", categoryId: "getting-started" },
    ]
  },
  {
    id: "analytics",
    title: "📊 Analytics",
    icon: "BarChart3",
    articles: [
      { id: "metrics-explained", title: "Entendendo as métricas", description: "Saiba como interpretar visitantes, pageviews e sessões.", categoryId: "analytics" },
      { id: "dashboard-guide", title: "Como usar o Dashboard", description: "Explore todas as funcionalidades da sua visão principal.", categoryId: "analytics" },
    ]
  },
  {
    id: "conversions",
    title: "🎯 Conversões",
    icon: "Target",
    articles: [
      { id: "goals", title: "Metas e Funis", description: "Aprenda a mapear conversões e funis de vendas.", categoryId: "conversions" },
      { id: "events", title: "Eventos personalizados", description: "Como rastrear botões, formulários e WhatsApp.", categoryId: "conversions" },
    ]
  },
  {
    id: "ai",
    title: "🤖 Inteligência Artificial",
    icon: "Sparkles",
    articles: [
      { id: "ai-insights", title: "Como funcionam os Insights com IA", description: "Descubra como nossa IA analisa seus resultados.", categoryId: "ai" },
    ]
  },
  {
    id: "settings",
    title: "⚙️ Configurações",
    icon: "Settings",
    articles: [
      { id: "projects", title: "Como criar e gerenciar projetos", description: "Adicione vários sites à sua conta.", categoryId: "settings" },
      { id: "members", title: "Como convidar e administrar membros", description: "Trabalhe em equipe no Kubo Analytics.", categoryId: "settings" },
    ]
  },
  {
    id: "billing",
    title: "💳 Assinatura",
    icon: "CreditCard",
    articles: [
      { id: "billing-plans", title: "Planos, limites e cobrança", description: "Tudo sobre o plano Free e Pro.", categoryId: "billing" },
    ]
  },
  {
    id: "faq",
    title: "❓ Perguntas Frequentes",
    icon: "HelpCircle",
    articles: [
      { id: "faq", title: "Perguntas Frequentes (FAQ)", description: "Respostas rápidas para as dúvidas mais comuns.", categoryId: "faq" },
    ]
  }
];

export const HELP_ARTICLES_FLAT = HELP_CATEGORIES.flatMap(c => c.articles);
