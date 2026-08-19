// Fonte única de verdade dos planos KUBOWEB.
// Compartilhada entre `list-plans` (frontend) e `create-mp-preference` (checkout).
// Para descontinuar/pausar um plano, defina `enabled: false` — a UI o desabilita
// automaticamente e a edge function de checkout recusa novas assinaturas dele.

export type PlanId = "kuboweb_pro_monthly";

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
  disabledReason?: string;
}

export const PLANS: Record<PlanId, PlanDefinition> = {
  kuboweb_pro_monthly: {
    id: "kuboweb_pro_monthly",
    name: "Pro",
    tagline: "KUBOWEB Pro — tudo incluso",
    price: "R$ 49,90",
    cadence: "/mês",
    amount: 49.90,
    currency: "BRL",
    frequency: 1,
    frequency_type: "months",
    free_trial: { frequency: 7, frequency_type: "days" },
    reason: "KUBOWEB Pro - Mensal",
    highlight: "7 dias grátis — cancele a qualquer momento",
    cta: "Começar 7 dias grátis",
    features: [
      "Tudo incluído, sem limites artificiais",
      "Projetos / sites ilimitados",
      "Rastreamento ilimitado de visitantes",
      "Conversões: WhatsApp, formulários e botões",
      "Visitantes em tempo real",
      "Mapas de Calor (Heatmaps)",
      "Resumos com IA e Alertas",
      "Histórico estendido de 12 meses",
      "Relatórios em PDF e Exportação CSV",
    ],
    enabled: true,
  },
};

export function listPlans(): PlanDefinition[] {
  return Object.values(PLANS);
}

export function getPlan(id: string): PlanDefinition | null {
  return (PLANS as Record<string, PlanDefinition>)[id] ?? null;
}

// ---------------------------------------------------------------------------
// Tiers e limites por plano (fonte única compartilhada com src/lib/plan-features.ts)
// ---------------------------------------------------------------------------

export type PlanTier = "free" | "pro";

export interface TierLimits {
  tier: PlanTier;
  maxProjects: number;
  maxHistoryDays: number;
  aiMonthlyLimit: number;
  emailAlerts: boolean;
}

export const TIER_LIMITS: Record<PlanTier, TierLimits> = {
  free: { tier: "free", maxProjects: 1, maxHistoryDays: 7, aiMonthlyLimit: 0, emailAlerts: false },
  pro: { tier: "pro", maxProjects: Number.MAX_SAFE_INTEGER, maxHistoryDays: 365, aiMonthlyLimit: 10, emailAlerts: true },
};

interface SubscriptionRow {
  plan_id?: string | null;
  status?: string | null;
  current_period_end?: string | null;
}

const ACTIVE_STATUS = ["active", "trialing", "authorized", "approved"];

/** Resolve o tier a partir da assinatura mais recente do usuário. */
export function resolveTier(sub: SubscriptionRow | null | undefined): PlanTier {
  if (!sub) return "free";
  const status = (sub.status ?? "").toLowerCase();
  const periodOk = !sub.current_period_end || new Date(sub.current_period_end) > new Date();
  const active = (ACTIVE_STATUS.includes(status) && periodOk)
    || (["canceled", "cancelled"].includes(status) && !!sub.current_period_end && new Date(sub.current_period_end) > new Date());
  if (!active) return "free";
  return "pro"; // Legacy plans and new pro both resolve to 'pro' tier
}

export function limitsForTier(tier: PlanTier): TierLimits {
  return TIER_LIMITS[tier];
}
