import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Sparkles, X, ArrowRight } from "lucide-react";
import { usePlan } from "@/hooks/usePlan";
import { Button } from "@/components/ui/button";

const DISMISS_KEY = "kuboweb:upgrade-banner-dismissed-at";
const DISMISS_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 dias

export function UpgradeBanner() {
  const plan = usePlan();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (plan.loading || plan.isPro) {
      setVisible(false);
      return;
    }
    const dismissedAt = localStorage.getItem(DISMISS_KEY);
    if (dismissedAt) {
      const elapsed = Date.now() - Number(dismissedAt);
      if (elapsed < DISMISS_DURATION_MS) {
        setVisible(false);
        return;
      }
    }
    setVisible(true);
  }, [plan.loading, plan.isPro]);

  const dismiss = () => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setVisible(false);
  };

  if (!visible) return null;

  const title = "Você está no plano Gratuito";
  const subtitle = "Assine o Pro para desbloquear Heatmaps, Metas, Relatórios White-label, Insights com IA e histórico de até 12 meses.";
  const cta = "Upgrade para Pro";

  return (
    <div className="relative mb-4 overflow-hidden rounded-xl border border-primary/20 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-4 sm:p-5">
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex items-start sm:items-center gap-3 flex-1 min-w-0">
          <div className="h-9 w-9 shrink-0 rounded-lg bg-primary/15 ring-1 ring-primary/20 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground">{title}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button asChild size="sm" className="gap-1.5 h-9 rounded-lg shadow-sm">
            <Link to="/pricing">
              {cta}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </Button>
          <button
            type="button"
            onClick={dismiss}
            className="h-8 w-8 inline-flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            aria-label="Dispensar"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
