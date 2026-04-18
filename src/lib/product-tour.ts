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
        "Vou te mostrar em 1 minuto como acompanhar visitantes, leads e gerar insights com IA. Pode pular a qualquer momento.",
      side: "over",
      align: "center",
    },
  },
  {
    element: "[data-tour='sidebar-dashboard']",
    popover: {
      title: "📊 Dashboard",
      description:
        "Aqui você vê os KPIs principais: visitantes, leads, taxa de conversão e valor estimado. É a sua tela inicial.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "[data-tour='sidebar-live']",
    popover: {
      title: "🟢 Live",
      description:
        "Visitantes em tempo real no seu site — veja de onde vieram e o que estão acessando agora mesmo.",
      side: "right",
    },
  },
  {
    element: "[data-tour='sidebar-insights']",
    popover: {
      title: "✨ Insights com IA",
      description:
        "Resumos semanais automáticos analisando tendências, picos e quedas dos seus dados (2 análises por mês).",
      side: "right",
    },
  },
  {
    element: "[data-tour='sidebar-alerts']",
    popover: {
      title: "🔔 Alertas",
      description:
        "Receba avisos quando o tráfego cair/subir muito ou quando bater meta de leads. Configurável por projeto.",
      side: "right",
    },
  },
  {
    element: "[data-tour='sidebar-compare']",
    popover: {
      title: "📈 Comparar períodos",
      description:
        "Compare lado a lado dois períodos (ex: esta semana vs semana passada) pra ver evolução de visitantes, leads e conversões.",
      side: "right",
    },
  },
  {
    element: "[data-tour='sidebar-presentation']",
    popover: {
      title: "🖥️ Modo Apresentação",
      description:
        "Tela cheia em formato de slides — perfeito pra mostrar resultados em reuniões com cliente ou na sua TV do escritório.",
      side: "right",
    },
  },
  {
    element: "[data-tour='sidebar-settings']",
    popover: {
      title: "⚙️ Configurações",
      description:
        "O coração do app:<br/>• Pega o <b>script de tracking</b> pra colar no seu site<br/>• Cria e gerencia <b>projetos</b> (múltiplos sites)<br/>• Define o <b>valor por lead</b> pra calcular ROI<br/>• Ajusta preferências de alertas",
      side: "right",
    },
  },
  {
    element: "[data-tour='sidebar-pricing']",
    popover: {
      title: "💳 Assinatura",
      description: "Gerencia seu plano. Sem assinatura ativa o dashboard fica bloqueado.",
      side: "right",
    },
  },
  {
    element: "[data-tour='sidebar-pricing']",
    popover: {
      title: "💳 Assinatura",
      description: "Gerencia seu plano. Sem assinatura ativa o dashboard fica bloqueado.",
      side: "right",
    },
  },
  {
    popover: {
      title: "🎯 Pronto pra começar!",
      description:
        "Próximos passos:<br/>1️⃣ Crie um projeto em <b>Configurações</b><br/>2️⃣ Cole o script de tracking no seu site<br/>3️⃣ Volte ao <b>Dashboard</b> em alguns minutos<br/><br/>Você pode reabrir esse tour clicando no botão <b>Ajuda</b> no canto inferior direito.",
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
