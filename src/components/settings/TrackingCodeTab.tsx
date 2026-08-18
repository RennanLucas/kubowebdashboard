import { HelpTip } from "./HelpTip";
import TrackingStatus from "@/components/settings/TrackingStatus";
import TrackingSnippet from "@/components/TrackingSnippet";

interface TrackingCodeTabProps {
  projectId: string;
}

export function TrackingCodeTab({ projectId }: TrackingCodeTabProps) {
  return (
    <div className="glass-card rounded-xl p-6 space-y-4 shadow-sm border border-border/60">
      <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
        Código de Rastreamento
        <HelpTip text="Cole este código no <head> do seu site para começar a coletar visitas, fontes de tráfego e conversões automaticamente." />
      </h2>
      <TrackingStatus projectId={projectId} />
      <TrackingSnippet projectId={projectId} />
    </div>
  );
}
