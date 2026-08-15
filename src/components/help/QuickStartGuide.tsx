import { Rocket, ArrowRight } from "lucide-react";
import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { StepGuide, StepItem } from "./StepGuide";
import { CodeBlock } from "./CodeBlock";

interface QuickStartGuideProps {
  /** Free-text search query (lowercased). */
  query?: string;
  /** Active filter keyword (e.g. "tracking", "whatsapp"). */
  filter?: string | null;
}

/**
 * Inline quick-start guide for the Help page.
 * Supports filtering by free-text query and topic keyword.
 */
export function QuickStartGuide({ query = "", filter = null }: QuickStartGuideProps) {
  const navigate = useNavigate();
  const supabaseProjectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const scriptExample = `<script src="https://${supabaseProjectId}.supabase.co/functions/v1/tracker-script?pid=SEU_PROJECT_ID" defer></script>`;

  const whatsappExample = `<a href="https://wa.me/5511999999999" data-track="whatsapp">
  Falar no WhatsApp
</a>`;

  const buttonExample = `<button data-track="cta-orcamento">
  Pedir orçamento
</button>`;

  const allSteps: StepItem[] = [
    {
      title: "Crie seu primeiro projeto",
      description: (
        <>
          Acesse <strong>Configurações → Projetos</strong> e adicione o site
          que deseja monitorar (nome e domínio). Cada projeto recebe um
          <code className="bg-muted px-1 rounded mx-1">project_id</code>
          único usado no script de rastreamento.
        </>
      ),
      content: (
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs gap-1.5"
          onClick={() => navigate("/settings")}
        >
          <span>Ir para Configurações</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      ),
      keywords: ["projeto", "configuracao", "setup"],
      searchText:
        "criar projeto configurações domínio site project_id rastreamento setup",
    },
    {
      title: "Instale o script de tracking",
      description: (
        <>
          Copie o snippet abaixo, substitua{" "}
          <code className="bg-muted px-1 rounded">SEU_PROJECT_ID</code> pelo
          ID do seu projeto e cole logo antes do{" "}
          <code className="bg-muted px-1 rounded">&lt;/body&gt;</code> em
          todas as páginas do site.
        </>
      ),
      content: <CodeBlock code={scriptExample} ariaLabel="Snippet de tracking" />,
      keywords: ["tracking", "script", "instalacao", "setup"],
      searchText:
        "instalar script tracking snippet body project_id rastreamento código",
    },
    {
      title: "Marque seus links de WhatsApp",
      description:
        'Adicione o atributo data-track="whatsapp" nos links do WhatsApp. A plataforma detecta cliques automaticamente e conta como lead.',
      content: <CodeBlock code={whatsappExample} ariaLabel="Exemplo de link WhatsApp" />,
      keywords: ["whatsapp", "tracking", "lead", "conversao"],
      searchText: "whatsapp link data-track lead clique conversão wa.me",
    },
    {
      title: "Marque botões de conversão (CTAs)",
      description:
        'Use data-track="nome-do-botao" em qualquer botão importante. Cada clique vira um evento de conversão no dashboard.',
      content: <CodeBlock code={buttonExample} ariaLabel="Exemplo de botão CTA" />,
      keywords: ["cta", "botao", "conversao", "tracking"],
      searchText: "cta botão data-track conversão clique evento",
    },
    {
      title: "Defina o valor por lead",
      description:
        "Em Configurações, informe quanto vale, em média, um lead para o seu negócio. A plataforma calcula automaticamente o valor estimado gerado.",
      content: (
        <Button
          size="sm"
          variant="outline"
          className="h-8 text-xs gap-1.5"
          onClick={() => navigate("/settings")}
        >
          <span>Configurar valor do lead</span>
          <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      ),
      keywords: ["valor", "lead", "configuracao"],
      searchText:
        "valor por lead configurações valor estimado receita monetização",
    },
    {
      title: "Acompanhe o dashboard",
      description:
        "Em poucos minutos os primeiros eventos aparecem no Dashboard. Use a página Live para ver visitantes em tempo real e Insights para análises automáticas.",
      content: (
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5"
            onClick={() => navigate("/dashboard")}
          >
            <span>Dashboard</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5"
            onClick={() => navigate("/live")}
          >
            <span>Live</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs gap-1.5"
            onClick={() => navigate("/insights")}
          >
            <span>IA / Insights</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      ),
      keywords: ["dashboard"],
      searchText: "dashboard live insights tempo real visitantes",
    },
  ];

  const steps = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allSteps.filter((s) => {
      if (filter && !s.keywords?.includes(filter)) return false;
      if (!q) return true;
      const haystack = `${s.title} ${s.searchText ?? ""} ${(s.keywords ?? []).join(" ")}`.toLowerCase();
      return haystack.includes(q);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, filter]);

  if (steps.length === 0) return null;

  return (
    <Card className="p-5 mb-4 border-primary/20">
      <div className="flex items-start gap-3 mb-4">
        <div className="h-9 w-9 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
          <Rocket className="h-5 w-5 text-primary" />
        </div>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-foreground">
            Guia rápido — comece em 5 minutos
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tudo o que você precisa para configurar a plataforma, com
            exemplos prontos para copiar.
          </p>
        </div>
      </div>

      <StepGuide steps={steps} highlightQuery={query} />
    </Card>
  );
}
