import { Link } from "react-router-dom";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlan } from "@/hooks/usePlan";
import { FEATURE_LABELS, PLAN_CAPABILITIES, type FeatureKey } from "@/lib/plan-features";

interface FeatureLockProps {
  feature: FeatureKey;
  children: React.ReactNode;
  /** Mostra apenas um aviso compacto em vez do card completo */
  compact?: boolean;
  description?: string;
}

/**
 * Renderiza `children` se o plano do usuário liberar o recurso.
 * Caso contrário, mostra um bloqueio com CTA de upgrade.
 */
export function FeatureLock({ feature, children, compact, description }: FeatureLockProps) {
  const plan = usePlan();

  if (plan.loading) {
    return <div className="h-24 rounded-xl bg-muted/40 animate-pulse" />;
  }

  if (plan.can(feature)) return <>{children}</>;

  const needed = plan.requiredTierFor(feature);
  const neededLabel = PLAN_CAPABILITIES[needed].label;

  if (compact) {
    return (
      <div className="flex items-center gap-2 rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
        <Lock className="h-3.5 w-3.5 shrink-0" />
        <span className="flex-1">
          {FEATURE_LABELS[feature]} está disponível no plano {neededLabel}.
        </span>
        <Link to="/pricing" className="font-medium text-primary hover:underline">
          Fazer upgrade
        </Link>
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-6 text-center">
      <div className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary/15 ring-1 ring-primary/20">
        <Lock className="h-4 w-4 text-primary" />
      </div>
      <h3 className="text-sm font-semibold text-foreground">
        {FEATURE_LABELS[feature]}
      </h3>
      <p className="mx-auto mt-1 max-w-md text-xs text-muted-foreground">
        {description ??
          `Este recurso faz parte do plano ${neededLabel}. Faça upgrade para desbloquear.`}
      </p>
      <Button asChild size="sm" className="mt-4 gap-1.5">
        <Link to="/pricing">
          <Sparkles className="h-3.5 w-3.5" />
          Conhecer o plano {neededLabel}
        </Link>
      </Button>
    </div>
  );
}

export default FeatureLock;
