import { driver, type DriveStep } from "driver.js";
import "driver.js/dist/driver.css";

export const TOUR_STORAGE_KEY = "kuboweb_tour_completed_v1";

export const hasCompletedTour = () =>
  typeof window !== "undefined" && localStorage.getItem(TOUR_STORAGE_KEY) === "1";

export const markTourCompleted = () => {
  try {
    localStorage.setItem(TOUR_STORAGE_KEY, "1");
  } catch {}
};

const baseSteps: DriveStep[] = [
  {
    popover: {
      title: "👋 Bem-vindo ao KUBOWEB Analytics!",
      description:
        "Este é um tour completo das funcionalidades. Vou te mostrar <b>cada área do app</b>, o que ela faz e como usar no dia a dia.<br/><br/>Pode pular a qualquer momento clicando no <b>X</b> e refazer depois em <b>Ajuda → Refazer tour</b>.",
      side: "over",
      align: "center",
    },
  },
  {
    element: "[data-tour='sidebar-dashboard']",
    popover: {
      title: "📊 Dashboard — sua tela inicial",
      description:
        "<b>O que é:</b> visão geral do desempenho do site no período escolhido.<br/><br/><b>Você vê:</b><br/>• KPIs (visitantes, leads, conversão, valor estimado)<br/>• Gráfico de evolução diária<br/>• Funil de conversão<br/>• Origens de tráfego e páginas mais acessadas<br/>• Mapa de calor por dia/hora<br/><br/><b>Como usar:</b> escolha o período no topo e o projeto no seletor para filtrar tudo.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "[data-tour='sidebar-live']",
    popover: {
      title: "🟢 Live — visitantes em tempo real",
      description:
        "<b>O que é:</b> mostra quem está navegando no seu site <b>agora</b>.<br/><br/><b>Você vê:</b><br/>• Número de visitantes ativos<br/>• Páginas que estão sendo vistas<br/>• Origem (Google, redes sociais, direto)<br/>• Cidade e país<br/><br/><b>Como usar:</b> ótimo para acompanhar lançamentos, campanhas ou anúncios em tempo real.",
      side: "right",
    },
  },
  {
    element: "[data-tour='sidebar-insights']",
    popover: {
      title: "💡 IA / Insights — análises automáticas",
      description:
        "<b>O que é:</b> resumos e recomendações geradas por IA com base nos seus dados.<br/><br/><b>Você vê:</b><br/>• Padrões de comportamento detectados<br/>• Oportunidades de otimização<br/>• Resumo semanal de desempenho<br/>• Sugestões de melhoria<br/><br/><b>Como usar:</b> abra após uma semana de tracking ativo para receber análises mais ricas.",
      side: "right",
    },
  },
  {
    element: "[data-tour='sidebar-alerts']",
    popover: {
      title: "🔔 Alertas — fique sempre informado",
      description:
        "<b>O que é:</b> central que detecta automaticamente problemas e oportunidades.<br/><br/><b>Detecta:</b><br/>• Quedas bruscas de tráfego<br/>• Picos anormais de visitantes<br/>• Baixa taxa de conversão<br/>• Alta taxa de rejeição<br/>• Dependência de um único canal<br/><br/><b>Como usar:</b> o sino no topo mostra o número de alertas ativos. Clique para ver detalhes.",
      side: "right",
    },
  },
  {
    element: "[data-tour='sidebar-compare']",
    popover: {
      title: "📈 Comparar — evolução lado a lado",
      description:
        "<b>O que é:</b> compara dois períodos diferentes para medir evolução.<br/><br/><b>Exemplos:</b><br/>• Esta semana vs. semana passada<br/>• Este mês vs. mês anterior<br/>• Antes vs. depois de uma campanha<br/><br/><b>Como usar:</b> escolha os dois períodos e veja variação percentual em todas as métricas (visitantes, leads, conversão, valor).",
      side: "right",
    },
  },
  {
    element: "[data-tour='sidebar-presentation']",
    popover: {
      title: "🖥️ Apresentação — modo TV / reunião",
      description:
        "<b>O que é:</b> tela cheia com os principais indicadores em destaque.<br/><br/><b>Ideal para:</b><br/>• Monitor da equipe no escritório<br/>• Reuniões com clientes<br/>• Apresentação de resultados<br/><br/><b>Como usar:</b> abra em uma tela grande e deixe rodando — atualiza sozinho.",
      side: "right",
    },
  },
  {
    element: "[data-tour='sidebar-settings']",
    popover: {
      title: "⚙️ Configurações — comece por aqui",
      description:
        "<b>O coração do app.</b> É onde você:<br/><br/>• 📋 Pega o <b>script de tracking</b> para colar no seu site<br/>• 🌐 Cria e gerencia <b>projetos</b> (múltiplos sites na mesma conta)<br/>• 💰 Define o <b>valor por lead</b> para calcular o ROI<br/>• 🎯 Configura <b>metas mensais</b> de visitantes e leads<br/>• 🔔 Ajusta preferências de alertas<br/><br/><b>Importante:</b> sem instalar o script, nenhum dado aparece.",
      side: "right",
    },
  },
  {
    element: "[data-tour='sidebar-pricing']",
    popover: {
      title: "💳 Assinatura — gerencie seu plano",
      description:
        "<b>O que é:</b> painel do seu plano atual.<br/><br/><b>Você pode:</b><br/>• Ver os limites de uso (projetos, eventos, retenção)<br/>• Fazer upgrade ou downgrade<br/>• Acessar o histórico de pagamentos<br/>• Cancelar a qualquer momento<br/><br/><b>Atenção:</b> sem assinatura ativa o dashboard fica bloqueado.",
      side: "right",
    },
  },
  {
    popover: {
      title: "🔍 Busca rápida (⌘K / Ctrl+K)",
      description:
        "<b>O que é:</b> atalho de teclado para navegar entre páginas e ações sem usar o mouse.<br/><br/><b>Como usar:</b> aperte <kbd>⌘</kbd>+<kbd>K</kbd> (Mac) ou <kbd>Ctrl</kbd>+<kbd>K</kbd> (Windows) em qualquer tela.",
      side: "over",
      align: "center",
    },
  },
  {
    popover: {
      title: "📲 Instalar como app (PWA)",
      description:
        "<b>O que é:</b> instala o KUBOWEB no seu celular ou computador como um aplicativo nativo.<br/><br/><b>Vantagens:</b><br/>• Ícone na tela inicial<br/>• Abre em tela cheia (sem barra do navegador)<br/>• Funciona offline (dados em cache)<br/>• Notificações de nova versão<br/><br/><b>Como:</b> menu <b>Conta → Instalar app</b> tem o passo a passo para iPhone, Android e PC.",
      side: "over",
      align: "center",
    },
  },
  {
    popover: {
      title: "❓ Ajuda — glossário completo",
      description:
        "<b>O que é:</b> dicionário de todas as métricas e funcionalidades do app.<br/><br/><b>Você encontra:</b><br/>• Definição de cada KPI (com fórmula)<br/>• Descrição de cada funcionalidade<br/>• Botão para refazer este tour<br/><br/><b>Como acessar:</b> menu <b>Conta → Ajuda</b> ou o botão flutuante no canto inferior direito.",
      side: "over",
      align: "center",
    },
  },
  {
    popover: {
      title: "🎯 Pronto para começar!",
      description:
        "<b>Seus próximos passos:</b><br/>1️⃣ Vá em <b>Configurações</b> e crie seu primeiro projeto<br/>2️⃣ Copie o <b>script de tracking</b> e cole no seu site<br/>3️⃣ Defina o <b>valor por lead</b> para calcular ROI<br/>4️⃣ Aguarde alguns minutos e volte ao <b>Dashboard</b><br/><br/>Pode refazer este tour quando quiser em <b>Ajuda → Refazer tour</b>. Bom trabalho! 🚀",
      side: "over",
      align: "center",
    },
  },
];

export function startProductTour(onFinish?: () => void) {
  // Filtra steps cujo elemento não existe na página atual
  const steps = baseSteps.filter((s) => {
    if (!s.element) return true;
    return !!document.querySelector(s.element as string);
  });

  const d = driver({
    showProgress: true,
    allowClose: true,
    nextBtnText: "Próximo →",
    prevBtnText: "← Voltar",
    doneBtnText: "Finalizar",
    progressText: "{{current}} de {{total}}",
    overlayOpacity: 0.6,
    smoothScroll: true,
    onDestroyed: () => {
      markTourCompleted();
      onFinish?.();
    },
    steps,
  });

  d.drive();
  return d;
}
