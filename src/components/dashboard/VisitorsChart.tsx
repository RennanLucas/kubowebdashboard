import { useMemo, useRef, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
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
import { useAnnotations } from "@/hooks/useAnnotations";
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

const VisitorsChart = ({ data, projectId, prevSeries, dateRangeDays }: VisitorsChartProps) => {
  const { annotations, add, remove } = useAnnotations(projectId);
  const [showCompare, setShowCompare] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [open, setOpen] = useState(false);
  const [activeSeries, setActiveSeries] = useState<Record<SeriesKey, boolean>>({
    visitors: true,
    leads: true,
    prevVisitors: true,
  });
  const chartRef = useRef<HTMLDivElement | null>(null);

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

  const handleAdd = () => {
    if (!newDate || !newLabel.trim()) return;
    add(newDate, newLabel);
    setNewDate("");
    setNewLabel("");
    setOpen(false);
  };

  const toggleSeries = (key: SeriesKey) => {
    setActiveSeries((current) => ({ ...current, [key]: !current[key] }));
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

  const exportRows = merged.map((item) => ({
    date: item.rawDate,
    visitors: activeSeries.visitors ? item.visitors : null,
    leads: activeSeries.leads ? item.leads : null,
    prevVisitors: showCompare && activeSeries.prevVisitors ? item.prevVisitors ?? null : null,
  }));

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
    <div className="glass-card p-5 sm:p-6" ref={chartRef}>
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
            <PopoverContent align="end" className="w-64">
              <div className="space-y-2">
                <div>
                  <Label className="text-xs">Data</Label>
                  <Input type="date" value={newDate} onChange={(e) => setNewDate(e.target.value)} className="h-8 text-sm mt-1" />
                </div>
                <div>
                  <Label className="text-xs">Evento</Label>
                  <Input
                    value={newLabel}
                    onChange={(e) => setNewLabel(e.target.value)}
                    className="h-8 text-sm mt-1"
                    placeholder="Ex: Campanha Black Friday"
                    maxLength={60}
                  />
                </div>
                <Button size="sm" className="w-full h-8 text-xs" onClick={handleAdd}>
                  Adicionar
                </Button>
                {annotations.length > 0 && (
                  <div className="border-t border-border pt-2 space-y-1 max-h-40 overflow-auto">
                    {annotations.map((a) => (
                      <div key={a.id} className="flex items-center justify-between text-xs">
                        <span className="truncate">
                          <span className="text-muted-foreground">{a.date}</span> — {a.label}
                        </span>
                        <button
                          onClick={() => remove(a.id)}
                          className="text-muted-foreground hover:text-destructive ml-1 shrink-0"
                          aria-label="Remover"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Filtros de séries do gráfico de visitantes e leads">
        {legendItems.map((item) => {
          const isActive = activeSeries[item.key];

          return (
            <TooltipProvider key={item.key} delayDuration={120}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={() => toggleSeries(item.key)}
                    aria-pressed={isActive}
                    aria-label={`${isActive ? "Ocultar" : "Mostrar"} série ${item.label}`}
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
      <div className="h-72">
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
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <Tooltip
              cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null;

                const visibleItems = payload.filter(
                  (item) => item.dataKey && activeSeries[item.dataKey as SeriesKey] && typeof item.value === "number",
                );

                if (!visibleItems.length) return null;

                return (
                  <div className="min-w-40 rounded-lg border border-border bg-card px-3 py-2 text-xs shadow-xl">
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
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
            <Area
              hide={!activeSeries.leads}
              name="Leads"
              type="monotone"
              dataKey="leads"
              stroke="hsl(var(--chart-green))"
              strokeWidth={2}
              fill="url(#gradLeads)"
              dot={false}
              activeDot={{ r: 4, strokeWidth: 0 }}
            />
            {showCompare && prevSeries && activeSeries.prevVisitors && (
              <Line
                name="Período anterior"
                type="monotone"
                dataKey="prevVisitors"
                stroke="hsl(var(--muted-foreground))"
                strokeWidth={1.5}
                strokeDasharray="4 4"
                dot={false}
              />
            )}
            {annotationsInRange.map((a) => (
              <ReferenceLine
                key={a.id}
                x={a.x}
                stroke="hsl(var(--chart-orange))"
                strokeDasharray="3 3"
                label={{
                  value: a.label,
                  position: "top",
                  fill: "hsl(var(--chart-orange))",
                  fontSize: 10,
                }}
              />
            ))}
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default VisitorsChart;
