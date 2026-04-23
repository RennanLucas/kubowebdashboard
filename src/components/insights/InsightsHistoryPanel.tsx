import { useMemo, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, GitCompare, History, RotateCcw, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { type InsightComparisonResult, type InsightHistoryRecord } from "@/lib/insight-history";

interface InsightsHistoryPanelProps {
  activeInsightId: string | null;
  compareInsightId: string | null;
  comparison: InsightComparisonResult | null;
  hasMore: boolean;
  history: InsightHistoryRecord[];
  loading: boolean;
  loadingMore: boolean;
  onLoadMore: () => void;
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
  hasMore,
  history,
  loading,
  loadingMore,
  onLoadMore,
  onRestore,
  onToggleCompare,
}: InsightsHistoryPanelProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [fromDate, setFromDate] = useState<Date>();
  const [toDate, setToDate] = useState<Date>();

  const filteredHistory = useMemo(() => {
    const normalizedQuery = searchTerm.trim().toLowerCase();
    const fromBoundary = fromDate ? new Date(fromDate) : null;
    const toBoundary = toDate ? new Date(toDate) : null;

    if (fromBoundary) fromBoundary.setHours(0, 0, 0, 0);
    if (toBoundary) toBoundary.setHours(23, 59, 59, 999);

    return history.filter((item) => {
      const createdAt = new Date(item.created_at);
      const startsAfterFrom = !fromBoundary || createdAt >= fromBoundary;
      const endsBeforeTo = !toBoundary || createdAt <= toBoundary;
      const matchesQuery =
        !normalizedQuery ||
        item.content.toLowerCase().includes(normalizedQuery) ||
        (item.model || "").toLowerCase().includes(normalizedQuery) ||
        formatDate(item.created_at).toLowerCase().includes(normalizedQuery);

      return startsAfterFrom && endsBeforeTo && matchesQuery;
    });
  }, [fromDate, history, searchTerm, toDate]);

  const clearFilters = () => {
    setSearchTerm("");
    setFromDate(undefined);
    setToDate(undefined);
  };

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

      <div className="grid gap-3 rounded-lg border border-border bg-muted/20 p-4 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto] lg:items-end">
        <div className="space-y-2">
          <label className="text-xs font-medium text-foreground">Buscar no histórico</label>
          <Input
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Buscar por texto, modelo ou data"
          />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-medium text-foreground">Data inicial</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn("w-full justify-start text-left font-normal lg:w-[180px]", !fromDate && "text-muted-foreground")}
              >
                <CalendarIcon className="h-4 w-4" />
                {fromDate ? format(fromDate, "dd/MM/yyyy") : <span>Selecionar</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={fromDate} onSelect={setFromDate} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <span className="text-xs font-medium text-foreground">Data final</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                type="button"
                variant="outline"
                className={cn("w-full justify-start text-left font-normal lg:w-[180px]", !toDate && "text-muted-foreground")}
              >
                <CalendarIcon className="h-4 w-4" />
                {toDate ? format(toDate, "dd/MM/yyyy") : <span>Selecionar</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={toDate} onSelect={setToDate} initialFocus className={cn("p-3 pointer-events-auto")} />
            </PopoverContent>
          </Popover>
        </div>

        <Button type="button" variant="ghost" onClick={clearFilters} className="gap-2 lg:self-end">
          <X className="h-4 w-4" />
          Limpar
        </Button>
      </div>

      <p className="text-xs text-muted-foreground">
        {filteredHistory.length} {filteredHistory.length === 1 ? "resultado encontrado" : "resultados encontrados"}
      </p>

      {loading ? (
        <p className="text-sm text-muted-foreground">Carregando histórico...</p>
      ) : history.length === 0 ? (
        <p className="text-sm text-muted-foreground">As próximas análises geradas com IA aparecerão aqui.</p>
      ) : filteredHistory.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nenhum insight encontrado nesse intervalo. Ajuste as datas ou limpe os filtros.</p>
      ) : (
        <div className="space-y-3">
          {filteredHistory.map((item) => {
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

          {hasMore && (
            <div className="flex justify-center pt-1">
              <Button type="button" variant="outline" onClick={onLoadMore} disabled={loadingMore} className="gap-2">
                {loadingMore ? "Carregando..." : "Carregar mais"}
              </Button>
            </div>
          )}
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