import { History, GitCompare, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { type InsightComparisonResult, type InsightHistoryRecord } from "@/lib/insight-history";

interface InsightsHistoryPanelProps {
  activeInsightId: string | null;
  compareInsightId: string | null;
  comparison: InsightComparisonResult | null;
  history: InsightHistoryRecord[];
  loading: boolean;
  onRestore: (item: InsightHistoryRecord) => void;
  onToggleCompare: (itemId: string) => void;
}

const formatDate = (value: string) =>
  new Date(value).toLocaleString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

export function InsightsHistoryPanel({
  activeInsightId,
  compareInsightId,
  comparison,
  history,
  loading,
  onRestore,
  onToggleCompare,
}: InsightsHistoryPanelProps) {
  return (
    <Card className="p-5 sm:p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-muted text-primary">
          <History className="h-4 w-4" />
        </div>
        <div>
          <h2 className="text-base font-semibold text-foreground">Histórico de gerações</h2>
          <p className="text-sm text-muted-foreground">
            Reabra versões anteriores e compare o que mudou entre gerações da IA.
          </p>
        </div>
      </div>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando histórico...</p>
      ) : history.length === 0 ? (
        <p className="text-sm text-muted-foreground">As próximas análises geradas com IA aparecerão aqui.</p>
      ) : (
        <div className="space-y-3">
          {history.map((item) => {
            const isActive = item.id === activeInsightId;
            const isComparing = item.id === compareInsightId;

            return (
              <div key={item.id} className="rounded-lg border border-border bg-muted/20 p-4">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-foreground">{formatDate(item.created_at)}</p>
                      {isActive && (
                        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">
                          Versão aberta
                        </span>
                      )}
                      <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
                        {item.period_days} dias
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {(item.model || "insights")}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <Button type="button" variant={isActive ? "secondary" : "outline"} size="sm" onClick={() => onRestore(item)} className="gap-2">
                      <RotateCcw className="h-3.5 w-3.5" />
                      Abrir versão
                    </Button>
                    <Button
                      type="button"
                      variant={isComparing ? "secondary" : "ghost"}
                      size="sm"
                      onClick={() => onToggleCompare(item.id)}
                      disabled={isActive}
                      className="gap-2"
                    >
                      <GitCompare className="h-3.5 w-3.5" />
                      {isComparing ? "Ocultar comparação" : "Comparar com atual"}
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {comparison && compareInsightId && (
        <div className="rounded-lg border border-border bg-muted/20 p-4 space-y-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">Comparação entre versões</h3>
            <p className="text-sm text-muted-foreground">
              {comparison.changedCount} seções com mudanças detectadas entre a versão aberta e a versão selecionada.
            </p>
          </div>

          <div className="space-y-3">
            {comparison.sections.filter((section) => section.status === "changed").slice(0, 5).map((section) => (
              <div key={section.title} className="grid gap-3 rounded-md border border-border bg-background p-3 md:grid-cols-2">
                <div>
                  <p className="text-xs font-medium text-foreground">Versão atual · {section.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{section.currentPreview}</p>
                </div>
                <div>
                  <p className="text-xs font-medium text-foreground">Versão comparada · {section.title}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{section.comparePreview}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
}