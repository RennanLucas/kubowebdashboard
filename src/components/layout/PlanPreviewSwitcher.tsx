import { Eye, Check, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { usePlanPreview } from "@/hooks/usePlanPreview";
import { PLAN_CAPABILITIES, type PlanTier } from "@/lib/plan-features";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const PREVIEW_TIERS: { tier: PlanTier; label: string; desc: string }[] = [
  { tier: "free", label: "Plano Gratuito", desc: "Simula bloqueios e cadeados" },
  { tier: "pro", label: "Plano Pro", desc: "Simula acesso ilimitado" },
];

export const PlanPreviewSwitcher = () => {
  const { user } = useAuth();
  const { isAdmin } = useIsAdmin();
  const { preview, setPreview } = usePlanPreview();

  const email = (user?.email || "").toLowerCase();
  const isOwner = email.includes("rennan") || email.includes("kuboweb");
  const showSwitcher = isAdmin || isOwner;

  if (!showSwitcher) return null;

  const handleSelect = (tier: PlanTier | null) => {
    setPreview(tier);
    if (tier && PLAN_CAPABILITIES[tier]) {
      toast.info(`Simulando visualização como: ${PLAN_CAPABILITIES[tier].label}`);
    } else {
      toast.success("Retornado ao seu plano real (Pro)");
    }
  };

  const previewLabel = preview && PLAN_CAPABILITIES[preview] ? PLAN_CAPABILITIES[preview].label : null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`h-8 px-2.5 text-xs gap-1.5 font-medium transition-all ${
            preview
              ? "bg-amber-500/10 border-amber-500/40 text-amber-600 dark:text-amber-400"
              : "border-border/70 hover:bg-muted/60 text-muted-foreground hover:text-foreground"
          }`}
        >
          <Eye className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">
            {previewLabel ? `Vendo como: ${previewLabel}` : "Simular Plano"}
          </span>
          <span className="sm:hidden">
            {previewLabel || "Plano"}
          </span>
          <ChevronDown className="h-3 w-3 opacity-60 ml-0.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 p-1.5 shadow-lg">
        <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-muted-foreground px-2 py-1 font-semibold">
          Simular Visão de Usuário
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer flex items-center justify-between py-2 px-2 rounded-md"
          onSelect={() => handleSelect(null)}
        >
          <div>
            <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <span>Meu plano real</span>
              <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-primary/10 text-primary border-primary/20">
                PRO
              </Badge>
            </div>
            <div className="text-[10px] text-muted-foreground mt-0.5">Visão real com acesso total</div>
          </div>
          {preview === null && <Check className="h-4 w-4 text-primary shrink-0" />}
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        {PREVIEW_TIERS.map(({ tier, label, desc }) => (
          <DropdownMenuItem
            key={tier}
            className="cursor-pointer flex items-center justify-between py-2 px-2 rounded-md"
            onSelect={() => handleSelect(tier)}
          >
            <div>
              <div className="text-xs font-medium text-foreground">{label}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5">{desc}</div>
            </div>
            {preview === tier && <Check className="h-4 w-4 text-primary shrink-0" />}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
