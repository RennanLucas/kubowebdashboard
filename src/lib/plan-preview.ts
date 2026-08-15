import type { PlanTier } from "@/lib/plan-features";

/**
 * Pré-visualização de plano (somente interface).
 * Permite ver como o painel fica em cada plano sem alterar a assinatura real.
 * O backend continua aplicando os limites do plano verdadeiro.
 */
const KEY = "kuboweb.plan-preview";
const EVENT = "kuboweb:plan-preview";

export type PreviewTier = PlanTier | null;

export function getPlanPreview(): PreviewTier {
  if (typeof window === "undefined") return null;
  const v = window.localStorage.getItem(KEY);
  return v === "free" || v === "pro" || v === "pro_plus" ? v : null;
}

export function setPlanPreview(tier: PreviewTier) {
  if (typeof window === "undefined") return;
  if (tier) {
    window.localStorage.setItem(KEY, tier);
  } else {
    window.localStorage.removeItem(KEY);
  }
  window.dispatchEvent(new CustomEvent(EVENT, { detail: tier }));
  window.dispatchEvent(new StorageEvent("storage", { key: KEY, newValue: tier }));
}

export function subscribePlanPreview(cb: () => void) {
  if (typeof window === "undefined") return () => {};
  const handler = () => cb();
  window.addEventListener(EVENT, handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener(EVENT, handler);
    window.removeEventListener("storage", handler);
  };
}
