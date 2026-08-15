import { Helmet } from "react-helmet-async";
import { HelpCircle, PlayCircle } from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { startProductTour, TOUR_STORAGE_KEY } from "@/lib/product-tour";
import { toast } from "sonner";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { OnboardingChecklist } from "@/components/help/OnboardingChecklist";
import { QuickStartGuide } from "@/components/help/QuickStartGuide";
import { HelpSearch, HelpFilter } from "@/components/help/HelpSearch";
import { Highlight } from "@/components/help/Highlight";

/** Topic filters shared between QuickStartGuide and the glossary. */
const HELP_FILTERS: HelpFilter[] = [
  { key: "tracking", label: "Tracking", keywords: ["tracking", "script", "snippet", "instalar", "rastreamento"] },
  { key: "whatsapp", label: "WhatsApp", keywords: ["whatsapp", "wa.me"] },
  { key: "cta", label: "CTAs", keywords: ["cta", "botão", "botao", "conversão", "conversao"] },
  { key: "valor", label: "Valor por lead", keywords: ["valor", "lead", "receita", "monetização", "monetizacao"] },
  { key: "dashboard", label: "Dashboard", keywords: ["dashboard", "kpi", "métrica", "metrica", "gráfico", "grafico"] },
];

interface Entry {
  term: string;
  description: string;
  formula?: string;
}

interface Section {
  title: string;
  items: Entry[];
}

const sections: Section[] = [
  {
    title: "Funcionalidades da plataforma",
    items: [
      {
        term: "Dashboard",
        description:
          "Visão geral do desempenho do seu site: KPIs principais (visitantes, leads, conversão, valor estimado), gráficos de evolução, funil de conversão, origens de tráfego, páginas mais acessadas e geolocalização. Permite filtrar por período e por projeto.",
      },
      {
        term: "Live",
        description:
          "Monitoramento em tempo real de quem está navegando no seu site agora: visitantes ativos, páginas sendo vistas, origem do tráfego e localização. Atualiza automaticamente a cada poucos segundos.",
      },
      {
        term: "IA / Insights",
        description:
          "Análises automáticas geradas por inteligência artificial sobre os dados do seu site. Identifica padrões, oportunidades de melhoria, sugestões de otimização e resumos semanais de desempenho.",
      },
      {
        term: "Alertas",
        description:
          "Central de notificações inteligentes: detecta quedas bruscas de tráfego, picos anormais, baixa taxa de conversão, alta taxa de rejeição e dependência excessiva de um único canal de aquisição.",
      },
      {
        term: "Comparar",
        description:
          "Compara o desempenho entre dois períodos diferentes (ex.: este mês vs. mês anterior) ou entre dois projetos. Mostra variações percentuais em todas as métricas para identificar evolução ou regressão.",
      },
      {
        term: "Apresentação",
        description:
          "Modo tela cheia com os principais indicadores em destaque, ideal para exibir em monitores de equipe, reuniões com clientes ou apresentações de resultados.",
      },
      {
        term: "Configurações",
        description:
          "Gerenciamento dos seus projetos (sites monitorados), código de rastreamento para instalar no site, metas mensais, valor por lead e preferências da conta.",
      },
      {
        term: "Assinatura",
        description:
          "Gerencie seu plano atual, faça upgrade/downgrade, visualize limites de uso (projetos, eventos, retenção de dados) e acesse o histórico de pagamentos.",
      },
      {
        term: "Instalar app",
        description:
          "Instruções passo a passo para instalar o KUBOWEB como aplicativo (PWA) no iPhone, Android ou computador, permitindo acesso rápido pela tela inicial e funcionamento offline.",
      },
      {
        term: "Ajuda",
        description:
          "Esta página: glossário completo de métricas, descrição das funcionalidades e botão para refazer o tour guiado da plataforma.",
      },
      {
        term: "Admin (apenas administradores)",
        description:
          "Painel administrativo para gestão de usuários, planos e configurações globais da plataforma. Visível apenas para contas com permissão de administrador.",
      },
    ],
  },
  {
    title: "Métricas principais (KPIs)",
    items: [
      {
        term: "Visitantes",
        description:
          "Número de pessoas únicas que acessaram seu site no período. Identificadas por sessão (cookie/localStorage). Cada visitante é contado uma vez, mesmo que retorne várias vezes no mesmo dia.",
      },
      {
        term: "Pageviews",
        description:
          "Total de páginas visualizadas. Inclui recargas, navegação entre páginas e visitas repetidas. Um visitante pode gerar várias pageviews.",
      },
      {
        term: "Leads",
        description:
          "Visitantes que realizaram pelo menos uma ação de conversão: clique no WhatsApp, envio de formulário ou clique em botão configurado.",
      },
      {
        term: "Taxa de conversão",
        description: "Percentual de visitantes que viraram leads. Média do mercado: 1% a 3%.",
        formula: "(Leads ÷ Visitantes) × 100",
      },
      {
        term: "Valor estimado",
        description:
          "Valor potencial gerado pelos leads no período. Use Configurações para ajustar o valor por lead.",
        formula: "Leads × Valor configurado por lead",
      },
    ],
  },
  {
    title: "Engajamento",
    items: [
      {
        term: "Sessões",
        description:
          "Número total de visitas. Uma sessão termina após 30 minutos de inatividade. Um visitante pode ter várias sessões.",
      },
      {
        term: "Páginas por sessão",
        description: "Média de páginas vistas por visita. Quanto maior, melhor o engajamento.",
        formula: "Pageviews ÷ Sessões",
      },
      {
        term: "Tempo médio de sessão",
        description: "Quanto tempo, em média, o visitante passa no seu site por visita.",
      },
      {
        term: "Taxa de rejeição (bounce)",
        description:
          "Percentual de visitas em que o usuário sai sem interagir (apenas 1 página, sem clique). Acima de 70% costuma indicar problema na landing page.",
      },
    ],
  },
  {
    title: "Tráfego e origens",
    items: [
      {
        term: "Pesquisa (Search)",
        description: "Visitantes vindos do Google, Bing e outros buscadores.",
      },
      {
        term: "Social",
        description: "Visitantes vindos de redes sociais (Instagram, Facebook, LinkedIn, X, etc).",
      },
      {
        term: "Direto",
        description:
          "Visitantes que digitaram a URL diretamente, salvaram o link nos favoritos ou clicaram em links de apps que não enviam referência.",
      },
      {
        term: "Email",
        description: "Visitantes vindos de campanhas de email marketing.",
      },
      {
        term: "Referências",
        description: "Visitantes vindos de outros sites que têm link para você.",
      },
    ],
  },
  {
    title: "Funil de conversão",
    items: [
      { term: "Visitantes", description: "Topo do funil: total de pessoas que chegaram ao site." },
      {
        term: "Engajados",
        description:
          "Visitantes que não saíram imediatamente — interagiram com o conteúdo (rolagem, navegação ou tempo na página).",
      },
      {
        term: "Cliques em CTA",
        description: "Visitantes que clicaram em botões de ação (WhatsApp, contato, etc).",
      },
      { term: "Conversões", description: "Visitantes que completaram a ação (envio de formulário, clique em WhatsApp)." },
    ],
  },
  {
    title: "Geolocalização",
    items: [
      {
        term: "País / Cidade",
        description:
          "Localização aproximada do visitante baseada no endereço IP. Pode ter pequena imprecisão e VPNs alteram a localização real.",
      },
    ],
  },
  {
    title: "Recursos",
    items: [
      {
        term: "Metas",
        description:
          "Defina metas de visitantes, leads e valor para acompanhar o progresso. As metas são salvas localmente no seu navegador.",
      },
      {
        term: "Anotações",
        description:
          "Marque eventos no gráfico (campanhas, lançamentos) para correlacionar picos com ações realizadas.",
      },
      {
        term: "Mapa de calor",
        description:
          "Mostra visitas por dia da semana e hora do dia. Use para identificar os melhores horários para publicar conteúdo ou anúncios.",
      },
      {
        term: "Alertas inteligentes",
        description:
          "Detecção automática de quedas, picos, baixa conversão, alta rejeição e dependência de canal único.",
      },
    ],
  },
];

export default function Help() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string | null>(null);

  const activeFilterKeywords = useMemo(() => {
    if (!activeFilter) return null;
    return HELP_FILTERS.find((f) => f.key === activeFilter)?.keywords ?? null;
  }, [activeFilter]);

  const filteredSections = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q && !activeFilterKeywords) return sections;

    return sections
      .map((sec) => {
        const items = sec.items.filter((item) => {
          const haystack = `${item.term} ${item.description} ${item.formula ?? ""}`.toLowerCase();
          if (activeFilterKeywords && !activeFilterKeywords.some((kw) => haystack.includes(kw))) {
            return false;
          }
          if (q && !haystack.includes(q)) return false;
          return true;
        });
        return { ...sec, items };
      })
      .filter((sec) => sec.items.length > 0);
  }, [query, activeFilterKeywords]);

  const totalResults = filteredSections.reduce((acc, s) => acc + s.items.length, 0);
  const isFiltering = query.trim().length > 0 || activeFilter !== null;

  const handleRestartTour = () => {
    try {
      localStorage.removeItem(TOUR_STORAGE_KEY);
    } catch {}

    const waitForSidebarAndStart = () => {
      let attempts = 0;
      const tryStart = () => {
        const ready = document.querySelector("[data-tour='sidebar-dashboard']");
        if (ready || attempts > 30) {
          startProductTour();
        } else {
          attempts++;
          setTimeout(tryStart, 100);
        }
      };
      tryStart();
    };

    if (window.location.pathname !== "/dashboard") {
      navigate("/dashboard");
      setTimeout(waitForSidebarAndStart, 200);
    } else {
      waitForSidebarAndStart();
    }
    toast.success("Tour iniciado!");
  };

  return (
    <AppLayout>
      <Helmet>
        <title>Ajuda — KUBOWEB</title>
        <meta name="description" content="Glossário e central de ajuda da plataforma KUBOWEB." />
        <link rel="canonical" href="https://kubowebdashboard.lovable.app/help" />
      </Helmet>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight flex items-center gap-2">
            <HelpCircle className="h-6 w-6 text-primary" />
            Glossário e ajuda
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Entenda cada métrica, fórmula e recurso disponível na plataforma.
          </p>
        </div>

        <HelpSearch
          query={query}
          onQueryChange={setQuery}
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          filters={HELP_FILTERS}
          resultsLabel={isFiltering ? `${totalResults} resultado(s)` : undefined}
        />

        {!isFiltering && <OnboardingChecklist />}

        <QuickStartGuide query={query} filter={activeFilter} />

        {!isFiltering && (
          <Card className="p-5 mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-primary/20 bg-primary/5 glass-card">
            <div>
              <h2 className="text-sm font-semibold text-foreground flex items-center gap-2">
                <PlayCircle className="h-4 w-4 text-primary" />
                Tour guiado da plataforma
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                Refaça o tutorial interativo de boas-vindas mostrando todas as áreas do app.
              </p>
            </div>
            <Button onClick={handleRestartTour} className="shrink-0">
              <PlayCircle className="h-4 w-4 mr-2" />
              Refazer tour
            </Button>
          </Card>
        )}

        <div className="space-y-4">
          {filteredSections.length === 0 && (
            <Card className="p-8 text-center">
              <p className="text-sm text-muted-foreground">
                Nenhum resultado encontrado para sua busca.
              </p>
            </Card>
          )}
          {filteredSections.map((sec) => (
            <Card key={sec.title} className="p-5">
              <h2 className="text-sm font-semibold text-foreground mb-3">{sec.title}</h2>
              <Accordion
                key={sec.title + (isFiltering ? "-filtered" : "-all")}
                type="multiple"
                className="w-full"
                defaultValue={isFiltering ? sec.items.map((i) => i.term) : []}
              >
                {sec.items.map((item) => (
                  <AccordionItem key={item.term} value={item.term} className="border-border">
                    <AccordionTrigger className="text-sm hover:no-underline py-3 transition-all duration-300">
                      <Highlight text={item.term} query={query} />
                    </AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground space-y-2 animate-in fade-in duration-300">
                      <p><Highlight text={item.description} query={query} /></p>
                      {item.formula && (
                        <p className="text-xs font-mono bg-muted px-2 py-1 rounded inline-block text-foreground">
                          <Highlight text={item.formula} query={query} />
                        </p>
                      )}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
