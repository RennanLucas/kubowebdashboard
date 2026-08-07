import { Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlanPreview } from "@/hooks/usePlanPreview";
import { PLAN_CAPABILITIES } from "@/lib/plan-features";

/** Faixa exibida enquanto o usuário pré-visualiza outro plano. */
export const PlanPreviewBanner = () => {
  const { preview, setPreview } = usePlanPreview();
  if (!preview) return null;

  return (
    <div className="flex items-center justify-center gap-3 border-b border-primary/20 bg-primary/10 px-4 py-2 text-xs text-foreground">
      <Eye className="h-3.5 w-3.5 text-primary" />
      <span>
        Você está vendo o painel como plano{" "}
        <strong>{PLAN_CAPABILITIES[preview].label}</strong> (pré-visualização).
      </span>
      <Button
        size="sm"
        variant="ghost"
        className="h-6 gap-1 px-2 text-xs"
        onClick={() => setPreview(null)}
      >
        <X className="h-3 w-3" />
        Sair da pré-visualização
      </Button>
    </div>
  );
};
