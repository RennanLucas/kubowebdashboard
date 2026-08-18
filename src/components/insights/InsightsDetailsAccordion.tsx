import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2 } from "lucide-react";
import type { InsightDetail } from "@/lib/local-insights";

interface InsightsDetailsAccordionProps {
  detailsLoading: boolean;
  detailsError: string | null;
  displayDetails: InsightDetail[];
  analysisSource: "history" | "generated" | null;
  openSources: Record<string, boolean>;
  sourceSearchTerms: Record<string, string>;
  loadingMoreSources: Record<string, boolean>;
  retryDetails: () => void;
  toggleSource: (title: string) => void;
  getDetailSourceStateKey: (title: string) => string;
  handleSourceSearch: (title: string, value: string) => void;
  getVirtualizedSources: (detail: InsightDetail) => any;
  getFilteredSources: (detail: InsightDetail) => any[];
  getCurrentVisibleSourceCount: (title: string) => number;
  handleSourcesScroll: (title: string, scrollTop: number) => void;
  loadMoreSources: (title: string) => void;
  VIRTUAL_SOURCE_VIEWPORT_HEIGHT: number;
  VIRTUAL_SOURCE_ROW_HEIGHT: number;
  VIRTUALIZATION_THRESHOLD: number;
}

export function InsightsDetailsAccordion({
  detailsLoading,
  detailsError,
  displayDetails,
  analysisSource,
  openSources,
  sourceSearchTerms,
  loadingMoreSources,
  retryDetails,
  toggleSource,
  getDetailSourceStateKey,
  handleSourceSearch,
  getVirtualizedSources,
  getFilteredSources,
  getCurrentVisibleSourceCount,
  handleSourcesScroll,
  loadMoreSources,
  VIRTUAL_SOURCE_VIEWPORT_HEIGHT,
  VIRTUAL_SOURCE_ROW_HEIGHT,
  VIRTUALIZATION_THRESHOLD,
}: InsightsDetailsAccordionProps) {
  return (
    <div className="mb-6 flex justify-end">
      <Accordion type="single" collapsible className="w-full sm:w-auto">
        <AccordionItem value="details" className="border-none">
          <AccordionTrigger className="w-full rounded-md border border-border px-3 sm:px-4 py-2 text-sm font-medium text-foreground hover:no-underline sm:min-w-52">
            Ver detalhes da IA
          </AccordionTrigger>
          <AccordionContent className="pt-3">
            <div className="rounded-lg border border-border bg-muted/20 p-3 sm:p-4">
              {detailsLoading ? (
                <div className="space-y-3">
                  <div className="rounded-lg border border-border bg-background p-4 space-y-3 animate-fade-in">
                    <Skeleton className="h-4 w-40 shimmer" />
                    <Skeleton className="h-4 w-full shimmer" />
                    <Skeleton className="h-4 w-11/12 shimmer" />
                    <Skeleton className="h-9 w-28 shimmer" />
                  </div>
                  <div className="rounded-lg border border-border bg-background p-4 space-y-3 animate-fade-in">
                    <Skeleton className="h-4 w-32 shimmer" />
                    <Skeleton className="h-4 w-full shimmer" />
                    <Skeleton className="h-4 w-10/12 shimmer" />
                  </div>
                </div>
              ) : detailsError ? (
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
                  <p className="text-sm font-medium text-foreground">Não foi possível carregar os detalhes da IA</p>
                  <p className="mt-1 text-sm text-muted-foreground">{detailsError}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={retryDetails}
                    disabled={analysisSource !== "generated"}
                    className="mt-3"
                  >
                    Tentar novamente
                  </Button>
                </div>
              ) : (
                <ul className="space-y-3">
                  {displayDetails.map((detail) => (
                    <li key={detail.title} className="rounded-lg border border-border bg-background p-4 text-sm text-foreground/90">
                      <p className="font-medium text-foreground">• {detail.title}</p>
                      <p className="mt-1 text-muted-foreground">{detail.reason}</p>
                      <p className="mt-1"><span className="font-medium text-foreground">Ação sugerida:</span> {detail.recommendation}</p>
                      <div className="mt-3 flex flex-col items-start gap-3">
                        {detail.sources.length > 0 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => toggleSource(detail.title)}
                          >
                            {openSources[getDetailSourceStateKey(detail.title)] ? "Ocultar fonte" : "Ver fonte"}
                          </Button>
                        )}
                        {openSources[getDetailSourceStateKey(detail.title)] && detail.sources.length > 0 && (
                          <div className="w-full rounded-md border border-border bg-muted/30 p-3">
                            <p className="text-xs font-medium text-foreground">Métricas que alimentaram este insight</p>
                            {detail.sources.length > VIRTUALIZATION_THRESHOLD && (
                              <Input
                                value={sourceSearchTerms[getDetailSourceStateKey(detail.title)] ?? ""}
                                onChange={(event) => handleSourceSearch(detail.title, event.target.value)}
                                placeholder="Buscar métrica ou valor"
                                className="mt-3"
                              />
                            )}
                            {(() => {
                              const visibleSources = getVirtualizedSources(detail);

                              if (visibleSources.sources.length === 0) {
                                return <p className="mt-3 text-xs text-muted-foreground">Nenhuma métrica encontrada para essa busca.</p>;
                              }

                              if (!visibleSources.virtualized) {
                                return (
                                  <ul className="mt-2 space-y-2">
                                    {visibleSources.sources.map((source: any) => (
                                      <li key={`${detail.title}-${source.label}`} className="flex flex-col gap-0.5 sm:flex-row sm:items-center sm:justify-between sm:gap-3">
                                        <span className="text-xs text-muted-foreground">{source.label}</span>
                                        <span className="text-sm font-medium text-foreground">{source.value}</span>
                                      </li>
                                    ))}
                                  </ul>
                                );
                              }

                              return (
                                <div
                                  className="mt-2 overflow-y-auto rounded-md"
                                  style={{ maxHeight: `${VIRTUAL_SOURCE_VIEWPORT_HEIGHT}px` }}
                                  onScroll={(event) => handleSourcesScroll(detail.title, event.currentTarget.scrollTop)}
                                >
                                  <div className="relative" style={{ height: `${visibleSources.totalHeight}px` }}>
                                    <ul
                                      className="absolute inset-x-0 top-0"
                                      style={{ transform: `translateY(${visibleSources.startIndex * VIRTUAL_SOURCE_ROW_HEIGHT}px)` }}
                                    >
                                      {visibleSources.sources.map((source: any) => (
                                        <li
                                          key={`${detail.title}-${source.label}`}
                                          className="flex min-h-12 flex-col justify-center gap-0.5 border-b border-border/60 px-1 py-1 last:border-b-0 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                                        >
                                          <span className="text-xs text-muted-foreground">{source.label}</span>
                                          <span className="text-sm font-medium text-foreground">{source.value}</span>
                                        </li>
                                      ))}
                                    </ul>
                                  </div>
                                </div>
                              );
                            })()}
                            {getFilteredSources(detail).length > getCurrentVisibleSourceCount(detail.title) && (
                              <div className="mt-3 flex items-center justify-between gap-3">
                                <p className="text-xs text-muted-foreground">
                                  Mostrando {Math.min(getCurrentVisibleSourceCount(detail.title), getFilteredSources(detail).length)} de {getFilteredSources(detail).length} fontes
                                </p>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => loadMoreSources(detail.title)}
                                  disabled={loadingMoreSources[getDetailSourceStateKey(detail.title)]}
                                >
                                  {loadingMoreSources[getDetailSourceStateKey(detail.title)] ? (
                                    <>
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      Carregando...
                                    </>
                                  ) : (
                                    "Carregar mais"
                                  )}
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
