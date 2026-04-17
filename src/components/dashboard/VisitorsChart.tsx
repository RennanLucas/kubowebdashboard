import { useMemo, useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Line,
} from "recharts";
import { Plus, X } from "lucide-react";
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
}

const VisitorsChart = ({ data, projectId, prevSeries }: VisitorsChartProps) => {
  const { annotations, add, remove } = useAnnotations(projectId);
  const [showCompare, setShowCompare] = useState(false);
  const [newDate, setNewDate] = useState("");
  const [newLabel, setNewLabel] = useState("");
  const [open, setOpen] = useState(false);

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

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4 gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-card-foreground">Visitantes e Leads</h3>
          <InfoTooltip content="Linha do tempo de visitantes e leads. Use as anotações para marcar campanhas ou eventos importantes e compare com o período anterior para ver tendências." />
        </div>
        <div className="flex items-center gap-3">
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
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
            <Tooltip
              contentStyle={{
                backgroundColor: "white",
                border: "1px solid rgba(0,0,0,0.06)",
                borderRadius: "8px",
                fontSize: 13,
                boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
              }}
            />
            <Legend />
            <Area name="Visitantes" type="monotone" dataKey="visitors" stroke="hsl(var(--chart-blue))" strokeWidth={2} fill="url(#gradVisitors)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
            <Area name="Leads" type="monotone" dataKey="leads" stroke="hsl(var(--chart-green))" strokeWidth={2} fill="url(#gradLeads)" dot={false} activeDot={{ r: 4, strokeWidth: 0 }} />
            {showCompare && prevSeries && (
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
