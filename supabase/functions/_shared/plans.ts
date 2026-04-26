// Fonte única de verdade dos planos KUBOWEB.
// Compartilhada entre `list-plans` (frontend) e `create-mp-preference` (checkout).
// Para descontinuar/pausar um plano, defina `enabled: false` — a UI o desabilita
// automaticamente e a edge function de checkout recusa novas assinaturas dele.

export type PlanId = "kuboweb_pro_monthly" | "kuboweb_pro_plus_monthly";

export interface PlanDefinition {
  id: PlanId;
  name: string;
  tagline: string;
  price: string;
  cadence: string;
  amount: number;
  currency: "BRL";
  frequency: 1;
  frequency_type: "months";
  free_trial: { frequency: number; frequency_type: "days" };
  reason: string;
  highlight: string;
  cta: string;
  features: string[];
  recommended?: boolean;
  enabled: boolean;
  // Mensagem opcional exibida quando o plano está desabilitado.
  disabledReason?: string;
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  kuboweb_pro_monthly: {
    id: "kuboweb_pro_monthly",
    name: "Pro",
    tagline: "KUBOWEB Pro · tudo incluso",
    price: "R$ 29,99",
    cadence: "/mês",
    amount: 29.99,
    currency: "BRL",
    frequency: 1,
    frequency_type: "months",
    free_trial: { frequency: 7, frequency_type: "days" },
    reason: "KUBOWEB Pro - Mensal",
    highlight: "7 dias grátis · cancele a qualquer momento",
    cta: "Começar 7 dias grátis",
    features: [
      "Rastreamento ilimitado de visitantes",
      "Conversões: WhatsApp, formulários e botões",
      "Visitantes em tempo real",
      "Geolocalização e dispositivos",
      "Relatórios em PDF sob demanda",
      "Até 3 projetos / sites",
      "Histórico de 3 meses",
      "3 resumos com IA por mês",
    ],
    enabled: true,
  },
  kuboweb_pro_plus_monthly: {
    id: "kuboweb_pro_plus_monthly",
    name: "Pro+",
    tagline: "KUBOWEB Pro+ · sem limites",
    price: "R$ 49,99",
    cadence: "/mês",
    amount: 49.99,
    currency: "BRL",
    frequency: 1,
    frequency_type: "months",
    free_trial: { frequency: 7, frequency_type: "days" },
    reason: "KUBOWEB Pro+ - Mensal",
    highlight: "7 dias grátis · tudo incluso, sem limites",
    cta: "Começar 7 dias grátis",
    features: [
      "Tudo do plano Pro, e mais:",
      "6 resumos com IA por mês (o dobro)",
      "Alertas inteligentes por email (quedas e metas)",
      "Projetos / sites ilimitados",
      "Histórico estendido de 12 meses",
      "Suporte prioritário",
    ],
    recommended: true,
    enabled: true,
  },
};

export function listPlans(): PlanDefinition[] {
  return Object.values(PLANS);
}

export function getPlan(id: string): PlanDefinition | null {
  return (PLANS as Record<string, PlanDefinition>)[id] ?? null;
}
