import { Eye, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePlanPreview } from "@/hooks/usePlanPreview";
import { PLAN_CAPABILITIES } from "@/lib/plan-features";
import { toast } from "sonner";

/** Faixa exibida enquanto o usuário pré-visualiza outro plano. */
export const PlanPreviewBanner = () => {
  const { preview, setPreview } = usePlanPreview();
  if (!preview) return null;

  const handleExit = () => {
    setPreview(null);
    toast.success("Retornado ao seu plano real (Pro)");
  };

  const planLabel = preview && PLAN_CAPABILITIES[preview] ? PLAN_CAPABILITIES[preview].label : "Plano";

  return (
    <div className="flex items-center justify-center gap-3 border-b border-amber-500/30 bg-amber-500/10 px-4 py-2 text-xs text-amber-600 dark:text-amber-400 font-medium z-40 sticky top-14 backdrop-blur-md">
      <Eye className="h-4 w-4 shrink-0 text-amber-500 animate-pulse" />
      <span>
        Você está simulando o painel como plano{" "}
        <strong className="underline underline-offset-2">{planLabel}</strong> (modo teste).
      </span>
      <Button
        size="sm"
        variant="outline"
        className="h-6 gap-1 px-2.5 text-xs bg-background/80 border-amber-500/40 hover:bg-amber-500 hover:text-white transition-colors"
        onClick={handleExit}
      >
        <X className="h-3 w-3" />
        Sair da simulação
      </Button>
    </div>
  );
};
