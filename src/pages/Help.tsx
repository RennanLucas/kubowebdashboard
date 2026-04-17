import { HelpCircle } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

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
  return (
    <AppLayout>
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

        <div className="space-y-4">
          {sections.map((sec) => (
            <Card key={sec.title} className="p-5">
              <h2 className="text-sm font-semibold text-foreground mb-3">{sec.title}</h2>
              <Accordion type="multiple" className="w-full">
                {sec.items.map((item) => (
                  <AccordionItem key={item.term} value={item.term} className="border-border">
                    <AccordionTrigger className="text-sm hover:no-underline py-3">{item.term}</AccordionTrigger>
                    <AccordionContent className="text-sm text-muted-foreground space-y-2">
                      <p>{item.description}</p>
                      {item.formula && (
                        <p className="text-xs font-mono bg-muted px-2 py-1 rounded inline-block text-foreground">
                          {item.formula}
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
