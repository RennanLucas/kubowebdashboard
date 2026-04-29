import { Rocket } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StepGuide, StepItem } from "./StepGuide";
import { CodeBlock } from "./CodeBlock";

/**
 * Inline quick-start guide for the Help page.
 * Does NOT navigate to protected routes — every action is doable
 * right here with copyable snippets and clear instructions.
 */
export function QuickStartGuide() {
  const supabaseProjectId = import.meta.env.VITE_SUPABASE_PROJECT_ID;
  const scriptExample = `<script src="https://${supabaseProjectId}.supabase.co/functions/v1/tracker-script?pid=SEU_PROJECT_ID" defer></script>`;

  const whatsappExample = `<a href="https://wa.me/5511999999999" data-track="whatsapp">
  Falar no WhatsApp
</a>`;

  const buttonExample = `<button data-track="cta-orcamento">
  Pedir orçamento
</button>`;

  const steps: StepItem[] = [
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
    },
    {
      title: "Marque seus links de WhatsApp",
      description:
        "Adicione o atributo data-track=\"whatsapp\" nos links do WhatsApp. A plataforma detecta cliques automaticamente e conta como lead.",
      content: <CodeBlock code={whatsappExample} ariaLabel="Exemplo de link WhatsApp" />,
    },
    {
      title: "Marque botões de conversão (CTAs)",
      description:
        "Use data-track=\"nome-do-botao\" em qualquer botão importante. Cada clique vira um evento de conversão no dashboard.",
      content: <CodeBlock code={buttonExample} ariaLabel="Exemplo de botão CTA" />,
    },
    {
      title: "Defina o valor por lead",
      description:
        "Em Configurações, informe quanto vale, em média, um lead para o seu negócio. A plataforma calcula automaticamente o valor estimado gerado.",
    },
    {
      title: "Acompanhe o dashboard",
      description:
        "Em poucos minutos os primeiros eventos aparecem no Dashboard. Use a página Live para ver visitantes em tempo real e Insights para análises automáticas.",
    },
  ];

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

      <StepGuide steps={steps} />
    </Card>
  );
}
