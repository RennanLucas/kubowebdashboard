import { driver, type DriveStep, type PopoverDOM } from "driver.js";
import "driver.js/dist/driver.css";
import "./product-tour.css";

export const TOUR_STORAGE_KEY = "kuboweb_tour_completed_v1";
const TOUR_STORAGE_PREFIX = "kuboweb_tour_completed_v2";

type ProductTourOptions = {
  userId?: string | null;
  onFinish?: () => void;
  navigate?: (path: string) => void;
};

const getTourStorageKey = (userId?: string | null) =>
  userId ? `${TOUR_STORAGE_PREFIX}:${userId}` : TOUR_STORAGE_PREFIX;

export const hasCompletedTour = (userId?: string | null) => {
  if (typeof window === "undefined") return false;
  return (
    localStorage.getItem(getTourStorageKey(userId)) === "1" ||
    (import.meta.env.DEV && localStorage.getItem(TOUR_STORAGE_KEY) === "1")
  );
};

export const markTourCompleted = (userId?: string | null) => {
  try {
    localStorage.setItem(getTourStorageKey(userId), "1");
  } catch {
    // O tour continua funcionando mesmo quando o navegador bloqueia storage.
  }
};

const eyebrow = (label: string) =>
  `<span class="kubo-tour-eyebrow">${label}</span>`;

const baseSteps: DriveStep[] = [
  {
    popover: {
      title: "Seu painel, explicado em poucos minutos",
      description: `
        ${eyebrow("Boas-vindas")}
        <p>Conheça o fluxo essencial do KUBOWEB: acompanhar resultados, detectar oportunidades e configurar cada site com segurança.</p>
        <div class="kubo-tour-summary">
          <span><b>13</b> pontos essenciais</span>
          <span><b>≈ 3 min</b> de duração</span>
        </div>
        <p class="kubo-tour-tip">Use os botões ou as setas do teclado para avançar.</p>
      `,
      align: "center",
      nextBtnText: "Começar tour",
    },
  },
  {
    element: "[data-tour='organization-switcher']",
    popover: {
      title: "Organizações mantêm clientes separados",
      description: `
        ${eyebrow("Estrutura da conta")}
        <p>Cada organização reúne sua própria equipe, projetos, assinatura e dados. Ao trocar de organização, o painel carrega somente aquele ambiente.</p>
        <p class="kubo-tour-tip">Ideal para agências e profissionais que administram mais de um cliente.</p>
      `,
      side: "right",
      align: "start",
    },
  },
  {
    element: "[data-tour='sidebar-dashboard']",
    popover: {
      title: "Dashboard: decisões em uma única visão",
      description: `
        ${eyebrow("Visão geral")}
        <p>Acompanhe visitantes, sessões, leads, conversão e valor estimado. Os filtros permitem analisar período, projeto, dispositivo e origem do tráfego.</p>
        <ul class="kubo-tour-list"><li>Compare o desempenho com o período anterior</li><li>Identifique páginas e canais que mais convertem</li></ul>
      `,
      side: "right",
      align: "start",
    },
  },
  {
    element: "[data-tour='sidebar-live']",
    popover: {
      title: "Live: valide o que está acontecendo agora",
      description: `
        ${eyebrow("Tempo real")}
        <p>Veja visitantes ativos, páginas abertas e eventos recentes. É o lugar mais rápido para confirmar uma instalação ou acompanhar uma campanha.</p>
        <p class="kubo-tour-tip">Abra seu site em outra aba e observe a visita aparecer.</p>
      `,
      side: "right",
    },
  },
  {
    element: "[data-tour='sidebar-goals']",
    popover: {
      title: "Metas e funis mostram o progresso",
      description: `
        ${eyebrow("Objetivos")}
        <p>Defina metas mensais e acompanhe a passagem do visitante até a conversão. Assim, os números deixam de ser isolados e passam a ter contexto.</p>
      `,
      side: "right",
    },
  },
  {
    element: "[data-tour='sidebar-heatmaps']",
    popover: {
      title: "Heatmaps revelam padrões de atenção",
      description: `
        ${eyebrow("Comportamento")}
        <p>Descubra os horários e áreas de maior atividade para ajustar conteúdo, campanhas e chamadas para ação.</p>
        <p class="kubo-tour-tip">Recursos com cadeado fazem parte dos planos indicados no painel.</p>
      `,
      side: "right",
    },
  },
  {
    element: "[data-tour='sidebar-insights']",
    popover: {
      title: "Insights transformam dados em ações",
      description: `
        ${eyebrow("Inteligência")}
        <p>O KUBOWEB destaca tendências, quedas e oportunidades. As recomendações ficam mais precisas conforme o histórico do projeto cresce.</p>
      `,
      side: "right",
    },
  },
  {
    element: "[data-tour='sidebar-alerts']",
    popover: {
      title: "Alertas chamam atenção para o que mudou",
      description: `
        ${eyebrow("Monitoramento")}
        <p>Quedas de tráfego, picos anormais e mudanças de conversão aparecem aqui. O sino no topo mostra rapidamente quando existe algo para revisar.</p>
      `,
      side: "right",
    },
  },
  {
    element: "[data-tour='sidebar-compare']",
    popover: {
      title: "Compare períodos e projetos",
      description: `
        ${eyebrow("Evolução")}
        <p>Meça o efeito de campanhas, alterações no site e sazonalidade comparando intervalos ou projetos lado a lado.</p>
      `,
      side: "right",
    },
  },
  {
    element: "[data-tour='sidebar-reports']",
    popover: {
      title: "Relatórios prontos para compartilhar",
      description: `
        ${eyebrow("Apresentação")}
        <p>Organize os principais resultados em um material claro para reuniões, prestação de contas e acompanhamento executivo.</p>
      `,
      side: "right",
    },
  },
  {
    element: "[data-tour='sidebar-settings']",
    popover: {
      title: "Configurações: prepare o ambiente",
      description: `
        ${eyebrow("Configuração")}
        <p>Gerencie os dados da organização, projetos, instalação do rastreamento, membros, convites e assinatura.</p>
        <ul class="kubo-tour-list"><li>Cadastre a URL correta do site</li><li>Copie o script exclusivo do projeto</li><li>Verifique a primeira visita recebida</li></ul>
      `,
      side: "right",
      align: "end",
    },
  },
  {
    element: "[data-tour='sidebar-help']",
    popover: {
      title: "A ajuda permanece sempre disponível",
      description: `
        ${eyebrow("Suporte")}
        <p>Consulte instruções de instalação e solução de problemas. O botão flutuante <b>?</b> permite abrir este tour novamente em qualquer momento.</p>
      `,
      side: "right",
      align: "end",
    },
  },
  {
    popover: {
      title: "Pronto para conectar seu primeiro site",
      description: `
        ${eyebrow("Próximo passo")}
        <p>Comece pela configuração do projeto. Depois de instalar o script, faça uma visita ao site e confirme o recebimento no modo Live.</p>
        <div class="kubo-tour-checklist">
          <span><i>1</i>Cadastrar o projeto</span>
          <span><i>2</i>Instalar o script</span>
          <span><i>3</i>Validar a primeira visita</span>
        </div>
        <div class="kubo-tour-actions">
          <button type="button" data-tour-action="settings">Configurar projeto</button>
          <button type="button" data-tour-action="help">Abrir central de ajuda</button>
        </div>
      `,
      align: "center",
      doneBtnText: "Concluir",
    },
  },
];

const compactSteps: DriveStep[] = [
  {
    popover: {
      title: "Conheça o KUBOWEB",
      description: `
        ${eyebrow("Tour mobile")}
        <p>Uma visão rápida do fluxo essencial para acompanhar resultados e configurar seu site pelo celular.</p>
        <div class="kubo-tour-summary"><span><b>5</b> etapas objetivas</span><span><b>≈ 2 min</b> de duração</span></div>
      `,
      nextBtnText: "Começar",
      align: "center",
    },
  },
  {
    popover: {
      title: "Acompanhe o desempenho",
      description: `
        ${eyebrow("Resultados")}
        <p>Use o Dashboard para a visão geral, o Live para atividade em tempo real e os Alertas para identificar mudanças importantes.</p>
        <ul class="kubo-tour-list"><li>Filtre por período e projeto</li><li>Compare tráfego e conversões</li></ul>
      `,
      align: "center",
    },
  },
  {
    popover: {
      title: "Transforme dados em decisões",
      description: `
        ${eyebrow("Análise")}
        <p>Metas, Heatmaps, Insights e Comparações ajudam a entender o comportamento do público e priorizar melhorias.</p>
      `,
      align: "center",
    },
  },
  {
    popover: {
      title: "Configure e valide seu projeto",
      description: `
        ${eyebrow("Instalação")}
        <p>Em Configurações, cadastre a URL, copie o script exclusivo e verifique a primeira visita recebida.</p>
        <p class="kubo-tour-tip">Você também gerencia membros, convites e assinatura nessa área.</p>
      `,
      align: "center",
    },
  },
  baseSteps[baseSteps.length - 1],
];

const attachPopoverEnhancements = (
  popover: PopoverDOM,
  index: number,
  total: number,
) => {
  popover.wrapper.setAttribute("data-kubo-tour-step", String(index + 1));

  const progress = document.createElement("div");
  progress.className = "kubo-tour-progress";
  progress.setAttribute("aria-hidden", "true");
  progress.innerHTML = `<span style="width:${((index + 1) / total) * 100}%"></span>`;
  popover.wrapper.insertBefore(progress, popover.title);
};

export function startProductTour(options: ProductTourOptions = {}) {
  const { userId, onFinish, navigate } = options;
  const isCompact = window.matchMedia("(max-width: 767px)").matches;
  const candidateSteps = isCompact ? compactSteps : baseSteps;
  const steps = candidateSteps.filter((step) => {
    if (!step.element) return true;
    return !!document.querySelector(step.element as string);
  });

  const tour = driver({
    animate: true,
    duration: 340,
    overlayColor: "#07111f",
    overlayOpacity: 0.76,
    overlayClickBehavior: "close",
    showProgress: true,
    allowClose: true,
    allowKeyboardControl: true,
    smoothScroll: true,
    stagePadding: 8,
    stageRadius: 12,
    popoverOffset: 14,
    skipMissingElement: true,
    waitForElement: 800,
    popoverClass: "kubo-product-tour",
    nextBtnText: "Próximo",
    prevBtnText: "Voltar",
    doneBtnText: "Concluir",
    progressText: "Etapa {{current}} de {{total}}",
    onPopoverRender: (popover, { index, driver: currentDriver }) => {
      attachPopoverEnhancements(popover, index ?? 0, steps.length);

      popover.description
        .querySelector<HTMLElement>("[data-tour-action='settings']")
        ?.addEventListener("click", () => {
          currentDriver.destroy();
          if (navigate) navigate("/settings");
          else window.location.assign("/settings");
        });

      popover.description
        .querySelector<HTMLElement>("[data-tour-action='help']")
        ?.addEventListener("click", () => {
          currentDriver.destroy();
          if (navigate) navigate("/help");
          else window.location.assign("/help");
        });
    },
    onDoneClick: (_element, _step, { driver: currentDriver }) => {
      currentDriver.destroy();
    },
    onDestroyed: () => {
      // Fechar também conta como visto; o botão de ajuda permite repetir o tour.
      markTourCompleted(userId);
      onFinish?.();
    },
    steps,
  });

  tour.drive();
  return tour;
}
