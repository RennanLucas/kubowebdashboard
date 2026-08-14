import { useEffect, useMemo, useRef, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  ReferenceLine,
  Line,
} from "recharts";
import { Download, FileImage, FileText, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAnnotations } from "@/hooks/useAnnotations";
import { ANNOTATION_CATEGORIES, getCategoryMeta, type AnnotationCategory } from "@/lib/annotation-categories";
import { InfoTooltip } from "@/components/InfoTooltip";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { buildExportFilename, downloadCsv, exportElementAsPng } from "@/lib/chart-export";
import { toast } from "sonner";

interface ChartPoint {
  date: string;
  rawDate: string;
  visitors: number;
  leads: number;
}

interface VisitorsChartProps {
  data: ChartPoint[];
  projectId?: string;
  prevSeries?: number[]; // previous-period visitors aligned to data length
  dateRangeDays: number;
}

type SeriesKey = "visitors" | "leads" | "prevVisitors";

type KeyboardFocusState = {
  index: number;
  series: SeriesKey;
};

const VisitorsChart = ({ data, projectId, prevSeries, dateRangeDays }: VisitorsChartProps) => {
  const { annotations, add, remove } = useAnnotations(projectId);
  const [showCompare, setShowCompare] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [newCategory, setNewCategory] = useState<AnnotationCategory>("campaign");
  const [newNotes, setNewNotes] = useState("");
  const [open, setOpen] = useState(false);
  const [activeSeries, setActiveSeries] = useState<Record<SeriesKey, boolean>>({
    visitors: true,
    leads: true,
    prevVisitors: true,
  });
  const [keyboardFocus, setKeyboardFocus] = useState<KeyboardFocusState | null>(null);
  const [focusedLegendIndex, setFocusedLegendIndex] = useState(0);
  const chartRef = useRef<HTMLDivElement | null>(null);
  const legendButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const merged = useMemo(() => {
    return data.map((d, i) => ({
      ...d,
      prevVisitors: showCompare && prevSeries ? prevSeries[i] ?? 0 : undefined,
    }));
  }, [data, prevSeries, showCompare]);

  const annotationsInRange = useMemo(() => {
    const dateMap = new Map(data.map((d) => [d.rawDate, d.date]));
    return annotations.filter((a) => dateMap.has(a.date)).map((a) => ({ ...a, x: dateMap.get(a.date)! }));
  }, [annotations, data]);

  const handleAdd = async () => {
    if (!newDate || !newLabel.trim()) return;
    await add({ date: newDate, label: newLabel, category: newCategory, notes: newNotes });
    setNewDate("");
    setNewLabel("");
    setNewNotes("");
    setNewCategory("campaign");
    setOpen(false);
  };

  const toggleSeries = (key: SeriesKey) => {
    setActiveSeries((current) => ({ ...current, [key]: !current[key] }));
  };

  const getSeriesValue = (point: (typeof merged)[number], series: SeriesKey) => {
    if (series === "prevVisitors") return point.prevVisitors;
    return point[series];
  };

  const getDefaultFocusIndex = (series: SeriesKey) => {
    for (let index = merged.length - 1; index >= 0; index -= 1) {
      const value = getSeriesValue(merged[index], series);
      if (typeof value === "number") return index;
    }

    return 0;
  };

  const setKeyboardFocusForSeries = (series: SeriesKey, preferredIndex?: number) => {
    if (!merged.length) return;

    const valueAtPreferredIndex =
      preferredIndex !== undefined && preferredIndex >= 0 && preferredIndex < merged.length
        ? getSeriesValue(merged[preferredIndex], series)
        : undefined;

    setKeyboardFocus({
      series,
      index: typeof valueAtPreferredIndex === "number" ? preferredIndex! : getDefaultFocusIndex(series),
    });
  };

  const moveKeyboardFocusPoint = (series: SeriesKey, direction: number) => {
    if (!merged.length) return;

    const startIndex = keyboardFocus?.series === series ? keyboardFocus.index : getDefaultFocusIndex(series);

    for (let step = 1; step <= merged.length; step += 1) {
      const nextIndex = (startIndex + direction * step + merged.length) % merged.length;
      const value = getSeriesValue(merged[nextIndex], series);

      if (typeof value === "number") {
        setKeyboardFocus({ series, index: nextIndex });
        return;
      }
    }
  };

  const handleLegendKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number, key: SeriesKey) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const nextIndex = (index + direction + legendItems.length) % legendItems.length;
      setFocusedLegendIndex(nextIndex);
      legendButtonRefs.current[nextIndex]?.focus();
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleSeries(key);
    }
  };

  const handleSeriesFocusKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, key: SeriesKey) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      moveKeyboardFocusPoint(key, event.key === "ArrowRight" ? 1 : -1);
    }
  };

  const legendItems = [
    {
      key: "visitors" as const,
      label: "Visitantes",
      color: "hsl(var(--chart-blue))",
      available: true,
    },
    {
      key: "leads" as const,
      label: "Leads",
      color: "hsl(var(--chart-green))",
      available: true,
    },
    {
      key: "prevVisitors" as const,
      label: "Período anterior",
      color: "hsl(var(--muted-foreground))",
      available: Boolean(prevSeries?.length) && showCompare,
    },
  ].filter((item) => item.available);

  useEffect(() => {
    if (!legendItems.length) return;
    if (focusedLegendIndex >= legendItems.length) {
      setFocusedLegendIndex(legendItems.length - 1);
    }
  }, [focusedLegendIndex, legendItems.length]);

  const exportRows = merged.map((item) => ({
    date: item.rawDate,
    visitors: activeSeries.visitors ? item.visitors : null,
    leads: activeSeries.leads ? item.leads : null,
    prevVisitors: showCompare && activeSeries.prevVisitors ? item.prevVisitors ?? null : null,
  }));

  const focusedPoint = keyboardFocus ? merged[keyboardFocus.index] : null;
  const focusedValue = focusedPoint && keyboardFocus ? getSeriesValue(focusedPoint, keyboardFocus.series) : null;

  const keyboardTooltip =
    focusedPoint && keyboardFocus && typeof focusedValue === "number"
      ? {
          date: focusedPoint.date,
          label: legendItems.find((item) => item.key === keyboardFocus.series)?.label ?? "",
          color: legendItems.find((item) => item.key === keyboardFocus.series)?.color ?? "hsl(var(--foreground))",
          value: focusedValue,
        }
      : null;

  const focusableSeriesItems = legendItems.filter((item) => activeSeries[item.key]);

  const handleExportCsv = () => {
    downloadCsv(
      [
        ["Data", "Visitantes", "Leads", "Período anterior"],
        ...exportRows.map((row) => [row.date, row.visitors ?? "", row.leads ?? "", row.prevVisitors ?? ""]),
      ],
      buildExportFilename("visitantes-leads", dateRangeDays, "csv"),
    );
    toast.success("CSV do gráfico baixado.");
  };

  const handleExportPng = async () => {
    if (!chartRef.current) return;
    try {
      await exportElementAsPng(chartRef.current, buildExportFilename("visitantes-leads", dateRangeDays, "png"));
      toast.success("PNG do gráfico baixado.");
    } catch (error: any) {
      toast.error(error?.message || "Erro ao exportar imagem.");
    }
  };

  return (
    <div
      className="glass-card p-5 sm:p-6"
      ref={chartRef}
      onBlurCapture={(event) => {
        if (!chartRef.current?.contains(event.relatedTarget as Node | null)) {
          setKeyboardFocus(null);
        }
      }}
    >
      <div className="flex items-center justify-between mb-5 gap-2 flex-wrap">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <h3 className="section-title">Visitantes e Leads</h3>
            <InfoTooltip content="Linha do tempo de visitantes e leads. Use as anotações para marcar campanhas ou eventos importantes e compare com o período anterior para ver tendências." />
          </div>
          <p className="section-subtitle">Evolução diária no período selecionado</p>
        </div>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 px-2 text-xs">
                <Download className="h-3 w-3 mr-1" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExportPng} className="gap-2 cursor-pointer">
                <FileImage className="h-4 w-4 text-muted-foreground" />
                PNG
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleExportCsv} className="gap-2 cursor-pointer">
                <FileText className="h-4 w-4 text-muted-foreground" />
                CSV
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {prevSeries && prevSeries.length > 0 && (
            <label className="flex items-center gap-1.5 text-xs text-muted-foreground cursor-pointer">
              <Switch checked={showCompare} onCheckedChange={setShowCompare} />
              Comparar
            </label>
          )}
          <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="sm" className="h-7 px-2 text-xs">
                <Plus className="h-3 w-3 mr-1" />
                Anotar
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-72">
              <div className="space-y-2.5">
                <div>
                  <Label className="text-xs">Data</Label>
                  <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="h-8 text-sm mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Categoria</Label>
                  <Select value={newCategory} onValueChange={(v) => setNewCategory(v as AnnotationCategory)}>
                    <SelectTrigger className="h-8 text-sm mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ANNOTATION_CATEGORIES.map((c) => (
                        <SelectItem key={c.key} value={c.key} className="text-sm">
                          <span className="inline-flex items-center gap-2">
                            <span>{c.emoji}</span>
                            <span>{c.label}</span>
                          </span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs">Título</Label>
                  <Input
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    className="h-8 text-sm mt-1"
                    placeholder="Ex: Black Friday"
                    maxLength={80}
                  />
                </div>
                <div>
                  <Label className="text-xs">Notas (opcional)</Label>
                  <Textarea
                    value={newNotes}
                    onChange={(e) => setNewNotes(e.target.value)}
                    className="text-sm mt-1 min-h-[60px]"
                    placeholder="Detalhes da campanha, canal, investimento..."
                    maxLength={500}
                  />
                </div>
                <Button size="sm" className="w-full h-8 text-xs" onClick={handleAdd} disabled={!newDate || !newLabel.trim()}>
                  Adicionar anotação
                </Button>
                {annotations.length > 0 && (
                  <div className="border-t border-border pt-2 space-y-1.5 max-h-44 overflow-auto">
                    {annotations.map((a) => {
                      const meta = getCategoryMeta(a.category);
                      return (
                        <div key={a.id} className="flex items-center justify-between text-xs gap-2">
                          <span className="flex items-center gap-1.5 min-w-0 flex-1">
                            <span className="h-2 w-2 rounded-full shrink-0" style={{ backgroundColor: meta.color }} aria-hidden />
                            <span className="text-muted-foreground tabular-nums shrink-0">{a.date}</span>
                            <span className="truncate">{a.label}</span>
                          </span>
                          <button
                            onClick={() => remove(a.id)}
                            className="text-muted-foreground hover:text-destructive shrink-0"
                            aria-label="Remover"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtros de séries do gráfico de visitantes e leads">
        {legendItems.map((item, index) => {
          const isActive = activeSeries[item.key];

          return (
            <TooltipProvider key={item.key} delayDuration={120}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    ref={(element) => (legendButtonRefs.current[index] = element)}
                    type="button"
                    onClick={() => toggleSeries(item.key)}
                    onKeyDown={(event) => handleLegendKeyDown(event, index, item.key)}
                    onFocus={() => {
                      setFocusedLegendIndex(index);
                      setKeyboardFocusForSeries(item.key, keyboardFocus?.index);
                    }}
                    aria-pressed={isActive}
                    aria-keyshortcuts="ArrowLeft ArrowRight Enter Space"
                    aria-label={`${isActive ? "Ocultar" : "Mostrar"} série ${item.label}`}
                    tabIndex={index === focusedLegendIndex ? 0 : -1}
                    className="inline-flex items-center gap-2 rounded-md border border-border bg-background px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <span
                      className="h-2.5 w-2.5 rounded-full transition-opacity"
                      style={{ backgroundColor: item.color, opacity: isActive ? 1 : 0.35 }}
                    />
                    <span className={isActive ? "text-foreground" : "text-muted-foreground"}>{item.label}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {isActive ? `Ocultar ${item.label}` : `Mostrar ${item.label}`}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>
      <div className="relative h-72">
        {keyboardTooltip && (
          <div className="pointer-events-none absolute right-3 top-3 z-10 min-w-36 rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-xl">
            <div className="mb-1 font-medium text-card-foreground">{keyboardTooltip.date}</div>
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-2 text-muted-foreground">
                <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: keyboardTooltip.color }} />
                <span>{keyboardTooltip.label}</span>
              </div>
              <span className="font-medium text-card-foreground">{keyboardTooltip.value.toLocaleString("pt-BR")}</span>
            </div>
          </div>
        )}
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={merged}>
            <defs>
              <linearGradient id="gradVisitors" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--chart-blue))" stopOpacity={0.15} />
                <stop offset="100%" stopColor="hsl(var(--chart-blue))" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(var(--chart-green))" stopOpacity={0.15} />
                <stop offset="100%" stopColor="hsl(var(--chart-green))" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="hsl(var(--border))" strokeOpacity={0.4} vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <RechartsTooltip
              cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;

                const visibleItems = payload.filter(
                  (item) => item.dataKey && activeSeries[item.dataKey as SeriesKey] && typeof item.value === "number",
                );

                if (!visibleItems.length) return null;

                return (
                  <div className="min-w-40 rounded-lg border border-border/50 bg-card/80 backdrop-blur-md px-3 py-2 text-xs shadow-xl ring-1 ring-black/5">
                    <div className="mb-2 font-medium text-card-foreground">{label}</div>
                    <div className="space-y-1.5">
                      {visibleItems.map((item) => (
                        <div key={`${item.dataKey}`} className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-2 text-muted-foreground">
                            <span
                              className="h-2.5 w-2.5 rounded-full"
                              style={{ backgroundColor: item.color }}
                            />
                            <span>{item.name}</span>
                          </div>
                          <span className="font-medium text-card-foreground">
                            {Number(item.value).toLocaleString("pt-BR")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              }}
            />
            <Area
              hide={!activeSeries.visitors}
              name="Visitantes"
              type="monotone"
              dataKey="visitors"
              stroke="hsl(var(--chart-blue))"
              strokeWidth={2}
              fill="url(#gradVisitors)"
              activeDot={{ r: 4, strokeWidth: 0 }}
              dot={(props: any) =>
                keyboardFocus?.series === "visitors" && keyboardFocus.index === props.index ? (
                  <circle cx={props.cx} cy={props.cy} r={5} fill="hsl(var(--chart-blue))" stroke="hsl(var(--background))" strokeWidth={2} />
                ) : null
              }
            />
            <Area
              hide={!activeSeries.leads}
              name="Leads"
              type="monotone"
              dataKey="leads"
              stroke="hsl(var(--chart-green))"
              strokeWidth={2}
              fill="url(#gradLeads)"
              activeDot={{ r: 4, strokeWidth: 0 }}
              dot={(props: any) =>
                keyboardFocus?.series === "leads" && keyboardFocus.index === props.index ? (
                  <circle cx={props.cx} cy={props.cy} r={5} fill="hsl(var(--chart-green))" stroke="hsl(var(--background))" strokeWidth={2} />
                ) : null
              }
            />
            {showCompare && prevSeries && activeSeries.prevVisitors && (
              <Line
                name="Período anterior"
                type="monotone"
                dataKey="prevVisitors"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                activeDot={{ r: 4, strokeWidth: 0 }}
                dot={(props: any) =>
                  keyboardFocus?.series === "prevVisitors" && keyboardFocus.index === props.index ? (
                    <circle cx={props.cx} cy={props.cy} r={5} fill="hsl(var(--muted-foreground))" stroke="hsl(var(--background))" strokeWidth={2} />
                  ) : null
                }
              />
            )}
            {annotationsInRange.map((a) => {
              const meta = getCategoryMeta(a.category);
              return (
                <ReferenceLine
                  key={a.id}
                  x={a.x}
                  stroke={meta.color}
                  strokeDasharray="3 3"
                  label={{
                    value: `${meta.emoji} ${a.label}`,
                    position: "top",
                    fill: meta.color,
                    fontSize: 10,
                  }}
                />
              );
            })}
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {focusableSeriesItems.length > 0 && (
        <div className="sr-only" aria-label="Navegação por teclado pelas séries do gráfico">
          {focusableSeriesItems.map((item) => (
            <button
              key={`series-focus-${item.key}`}
              type="button"
              onFocus={() => setKeyboardFocusForSeries(item.key, keyboardFocus?.index)}
              onKeyDown={(event) => handleSeriesFocusKeyDown(event, item.key)}
              aria-label={`Série ${item.label}. Use seta para esquerda e direita para percorrer os pontos.`}
            >
              {`Focar série ${item.label}`}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default VisitorsChart;
