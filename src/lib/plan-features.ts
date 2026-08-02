// Fonte única de verdade dos recursos por plano (frontend).
// Mantida em sincronia com supabase/functions/_shared/plans.ts

export type PlanTier = "free" | "pro" | "pro_plus";

export type FeatureKey =
  | "live"
  | "ai_insights"
  | "compare"
  | "presentation"
  | "pdf_report"
  | "csv_export"
  | "email_alerts"
  | "in_app_alerts"
  | "annotations"
  | "goals"
  | "heatmap"
  | "realtime_refresh";

export interface PlanCapabilities {
  tier: PlanTier;
  label: string;
  maxProjects: number; // Infinity = ilimitado
  maxHistoryDays: number;
  aiMonthlyLimit: number;
  features: Record<FeatureKey, boolean>;
}

const FREE_FEATURES: Record<FeatureKey, boolean> = {
  live: false,
  ai_insights: false,
  compare: false,
  presentation: false,
  pdf_report: false,
  csv_export: false,
  email_alerts: false,
  in_app_alerts: true,
  annotations: false,
  goals: false,
  heatmap: false,
  realtime_refresh: false,
};

const PRO_FEATURES: Record<FeatureKey, boolean> = {
  ...FREE_FEATURES,
  live: true,
  ai_insights: true,
  compare: true,
  presentation: true,
  pdf_report: true,
  csv_export: true,
  annotations: true,
  goals: true,
  heatmap: true,
  realtime_refresh: true,
};

const PRO_PLUS_FEATURES: Record<FeatureKey, boolean> = {
  ...PRO_FEATURES,
  email_alerts: true,
};

export const PLAN_CAPABILITIES: Record<PlanTier, PlanCapabilities> = {
  free: {
    tier: "free",
    label: "Gratuito",
    maxProjects: 1,
    maxHistoryDays: 7,
    aiMonthlyLimit: 0,
    features: FREE_FEATURES,
  },
  pro: {
    tier: "pro",
    label: "Pro",
    maxProjects: 3,
    maxHistoryDays: 90,
    aiMonthlyLimit: 3,
    features: PRO_FEATURES,
  },
  pro_plus: {
    tier: "pro_plus",
    label: "Pro+",
    maxProjects: Number.POSITIVE_INFINITY,
    maxHistoryDays: 365,
    aiMonthlyLimit: 6,
    features: PRO_PLUS_FEATURES,
  },
};

/** Menor plano pago que libera o recurso. */
export function requiredTierFor(feature: FeatureKey): PlanTier {
  if (PLAN_CAPABILITIES.free.features[feature]) return "free";
  if (PLAN_CAPABILITIES.pro.features[feature]) return "pro";
  return "pro_plus";
}

export const FEATURE_LABELS: Record<FeatureKey, string> = {
  live: "Visitantes em tempo real",
  ai_insights: "Resumos com IA",
  compare: "Comparação de projetos",
  presentation: "Modo apresentação",
  pdf_report: "Relatórios em PDF",
  csv_export: "Exportação CSV",
  email_alerts: "Alertas por e-mail",
  in_app_alerts: "Alertas no painel",
  annotations: "Anotações no gráfico",
  goals: "Metas mensais",
  heatmap: "Mapa de calor por hora",
  realtime_refresh: "Atualização automática",
};
