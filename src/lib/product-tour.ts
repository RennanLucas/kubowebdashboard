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
      title: "Bem-vindo ao KUBOWEB Analytics",
      description:
        "Esta é uma apresentação guiada da plataforma. Em poucos minutos você conhecerá <b>cada módulo do menu</b>, o objetivo de uso e os principais recursos disponíveis.<br/><br/>É possível encerrar o tour a qualquer momento e retomá-lo posteriormente em <b>Ajuda → Refazer tour</b>.",
      align: "center",
    },
  },
  {
    element: "[data-tour='sidebar-dashboard']",
    popover: {
      title: "Dashboard — Visão geral consolidada",
      description:
        "<b>Objetivo:</b> apresentar, em uma única tela, o desempenho do site no período selecionado.<br/><br/><b>Principais blocos:</b><br/>• <b>KPIs</b>: visitantes únicos, sessões, leads, taxa de conversão e valor estimado em R$<br/>• <b>Gráfico de evolução</b> diária com comparação ao período anterior<br/>• <b>Funil de conversão</b>: visitantes → engajados → cliques em CTA → conversões<br/>• <b>Origens de tráfego</b> agrupadas (busca, social, direto, e-mail, referência)<br/>• <b>Top páginas</b> e <b>top referências</b><br/>• <b>Mapa de calor</b> por dia da semana e hora<br/>• <b>Geolocalização</b> de visitantes por país e cidade<br/><br/><b>Filtros disponíveis:</b> período personalizado, dispositivo, fonte de tráfego e projeto ativo.",
      side: "right",
      align: "start",
    },
  },
  {
    element: "[data-tour='sidebar-live']",
    popover: {
      title: "Live — Monitoramento em tempo real",
      description:
        "<b>Objetivo:</b> acompanhar a atividade do site no momento exato em que ela ocorre.<br/><br/><b>Recursos:</b><br/>• Contador de <b>visitantes ativos</b> com atualização automática a cada poucos segundos<br/>• Lista das <b>páginas em visualização</b> agora<br/>• <b>Origem do tráfego</b> de cada sessão ativa<br/>• <b>Localização aproximada</b> (cidade e país) do visitante<br/>• <b>Eventos recentes</b> (cliques em WhatsApp, envios de formulário)<br/><br/><b>Casos de uso:</b> monitoramento de lançamentos, campanhas pagas, posts em redes sociais e validação imediata de instalação do script.",
      side: "right",
    },
  },
  {
    element: "[data-tour='sidebar-insights']",
    popover: {
      title: "IA / Insights — Análises automatizadas",
      description:
        "<b>Objetivo:</b> transformar dados brutos em recomendações acionáveis utilizando inteligência artificial.<br/><br/><b>Recursos:</b><br/>• <b>Resumo semanal</b> de desempenho com destaques e pontos de atenção<br/>• Identificação de <b>padrões de comportamento</b> (horários de pico, páginas de maior conversão)<br/>• <b>Oportunidades de otimização</b> baseadas nas métricas atuais<br/>• <b>Histórico</b> de insights gerados anteriormente para comparação<br/><br/><b>Recomendação:</b> a qualidade das análises aumenta após uma semana de dados acumulados.",
      side: "right",
    },
  },
  {
    element: "[data-tour='sidebar-alerts']",
    popover: {
      title: "Alertas — Detecção inteligente de eventos",
      description:
        "<b>Objetivo:</b> notificar automaticamente sobre desvios relevantes no comportamento do site.<br/><br/><b>Tipos de alerta monitorados:</b><br/>• <b>Quedas bruscas</b> de tráfego em relação à média<br/>• <b>Picos anormais</b> de visitantes (possível campanha viral ou tráfego suspeito)<br/>• <b>Taxa de conversão abaixo</b> do histórico do projeto<br/>• <b>Taxa de rejeição elevada</b> (acima de 70%)<br/>• <b>Dependência excessiva</b> de um único canal de aquisição<br/>• <b>Tráfego suspeito</b> (bots, cliques inválidos)<br/><br/><b>Acesso rápido:</b> o sino no topo da tela exibe a contagem de alertas ativos em tempo real.",
      side: "right",
    },
  },
  {
    element: "[data-tour='sidebar-compare']",
    popover: {
      title: "Comparar — Análise de variação entre períodos",
      description:
        "<b>Objetivo:</b> mensurar evolução ou regressão do desempenho ao longo do tempo.<br/><br/><b>Modos de comparação:</b><br/>• <b>Período vs. período</b> (esta semana × semana anterior, mês × mês)<br/>• <b>Antes e depois</b> de um marco (campanha, redesign, lançamento)<br/>• <b>Projeto vs. projeto</b> para contas com múltiplos sites<br/><br/><b>Métricas comparadas:</b> visitantes, sessões, leads, taxa de conversão, valor estimado, origens de tráfego e páginas mais acessadas — todas com variação percentual e indicador visual de tendência.",
      side: "right",
    },
  },
  {
    element: "[data-tour='sidebar-presentation']",
    popover: {
      title: "Apresentação — Modo executivo",
      description:
        "<b>Objetivo:</b> exibir indicadores em formato otimizado para telas grandes e reuniões.<br/><br/><b>Características:</b><br/>• <b>Tela cheia</b> sem distrações de navegação<br/>• <b>Tipografia ampliada</b> para leitura à distância<br/>• <b>Atualização automática</b> dos dados<br/>• <b>Rotação entre telas</b> (KPIs, gráficos, top páginas)<br/><br/><b>Aplicações:</b> monitor de equipe no escritório, reuniões de resultado com clientes, demonstrações comerciais.",
      side: "right",
    },
  },
  {
    element: "[data-tour='sidebar-settings']",
    popover: {
      title: "Configurações — Centro de controle do projeto",
      description:
        "<b>Objetivo:</b> configurar todos os parâmetros operacionais da conta.<br/><br/><b>Seções disponíveis:</b><br/>• <b>Projetos</b>: criar, editar e excluir sites monitorados<br/>• <b>Script de tracking</b>: copiar o código de instalação e verificar status (ativo / sem dados)<br/>• <b>Valor por lead</b>: definir o valor monetário para o cálculo de ROI e valor estimado<br/>• <b>Metas mensais</b>: configurar objetivos de visitantes, leads e faturamento<br/>• <b>Preferências</b>: idioma, fuso horário e dados da conta<br/><br/><b>Importante:</b> o script de tracking deve ser instalado em todas as páginas do site para que os dados sejam coletados corretamente.",
      side: "right",
    },
  },
  {
    element: "[data-tour='sidebar-pricing']",
    popover: {
      title: "Assinatura — Gestão do plano",
      description:
        "<b>Objetivo:</b> administrar o plano contratado e visualizar consumo.<br/><br/><b>Funcionalidades:</b><br/>• Visualização do <b>plano atual</b> e benefícios inclusos<br/>• <b>Limites de uso</b>: número de projetos, eventos mensais e período de retenção dos dados<br/>• <b>Upgrade ou downgrade</b> de plano com efeito imediato<br/>• <b>Histórico de pagamentos</b> e faturas<br/>• <b>Cancelamento</b> a qualquer momento (acesso mantido até o fim do período pago)<br/><br/><b>Atenção:</b> sem assinatura ativa o acesso ao Dashboard e demais módulos é restrito.",
      side: "right",
    },
  },
  {
    popover: {
      title: "Busca rápida — Atalho ⌘K / Ctrl+K",
      description:
        "<b>Objetivo:</b> agilizar a navegação entre módulos e ações sem uso do mouse.<br/><br/><b>Como utilizar:</b><br/>• Pressione <kbd>⌘</kbd>+<kbd>K</kbd> (macOS) ou <kbd>Ctrl</kbd>+<kbd>K</kbd> (Windows / Linux)<br/>• Digite o nome da página ou ação desejada<br/>• Selecione com as setas e confirme com <kbd>Enter</kbd><br/><br/>Disponível em qualquer tela da plataforma.",
      align: "center",
    },
  },
  {
    popover: {
      title: "Instalar como aplicativo (PWA)",
      description:
        "<b>Objetivo:</b> utilizar a plataforma como um aplicativo nativo no dispositivo.<br/><br/><b>Benefícios:</b><br/>• <b>Ícone</b> na tela inicial do celular ou área de trabalho<br/>• Execução em <b>tela cheia</b>, sem barras do navegador<br/>• <b>Funcionamento offline</b> com dados em cache<br/>• <b>Notificações automáticas</b> de novas versões<br/>• <b>Carregamento mais rápido</b> em acessos recorrentes<br/><br/><b>Onde encontrar:</b> menu <b>Conta → Instalar app</b>, com instruções específicas para iPhone, Android e desktop.",
      align: "center",
    },
  },
  {
    popover: {
      title: "Ajuda — Documentação completa",
      description:
        "<b>Objetivo:</b> centralizar a documentação de uso da plataforma.<br/><br/><b>Conteúdo disponível:</b><br/>• <b>Glossário</b> com definição e fórmula de cada métrica (KPIs, engajamento, funil, geolocalização)<br/>• <b>Descrição detalhada</b> de cada funcionalidade do menu<br/>• <b>Botão para refazer este tour</b> a qualquer momento<br/><br/><b>Acesso:</b> menu <b>Conta → Ajuda</b> ou botão flutuante de ajuda no canto inferior direito da tela.",
      align: "center",
    },
  },
  {
    popover: {
      title: "Próximos passos recomendados",
      description:
        "Para começar a coletar dados imediatamente:<br/><br/>1. Acesse <b>Configurações</b> e crie seu primeiro projeto<br/>2. Copie o <b>script de tracking</b> e instale em todas as páginas do site<br/>3. Defina o <b>valor por lead</b> para habilitar o cálculo de ROI<br/>4. Configure suas <b>metas mensais</b> para acompanhamento de progresso<br/>5. Aguarde alguns minutos e retorne ao <b>Dashboard</b> para visualizar os primeiros dados<br/><br/>Em caso de dúvidas, a documentação completa está disponível em <b>Ajuda</b>.",
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
    allowKeyboardControl: true,
    nextBtnText: "Próximo →",
    prevBtnText: "← Voltar",
    doneBtnText: "Finalizar",
    progressText: "{{current}} de {{total}}",
    overlayOpacity: 0.6,
    smoothScroll: true,
    onDestroyed: () => {
      markTourCompleted();
      onFinish?.();
      window.removeEventListener("keydown", onKeyDown, true);
    },
    steps,
  });

  // Robust ESC close — driver.js's built-in handler can be blocked by other listeners.
  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      e.stopPropagation();
      try { d.destroy(); } catch {}
    }
  };
  window.addEventListener("keydown", onKeyDown, true);

  d.drive();
  return d;
}
