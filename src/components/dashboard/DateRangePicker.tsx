import { useState } from "react";
import { CalendarIcon, ChevronDown } from "lucide-react";
import { format, subDays, startOfMonth, endOfMonth, subMonths, differenceInDays } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import type { DateRange } from "react-day-picker";

interface DateRangePickerProps {
  dateRange: number;
  onDateRangeChange: (days: number) => void;
}

const presets = [
  { label: "Últimos 7 dias", days: 7 },
  { label: "Últimos 30 dias", days: 30 },
  { label: "Últimos 90 dias", days: 90 },
];

export function DateRangePicker({ dateRange, onDateRangeChange }: DateRangePickerProps) {
  const [open, setOpen] = useState(false);
  const [customRange, setCustomRange] = useState<DateRange | undefined>();

  const applyMonthPreset = (offset: number) => {
    const now = new Date();
    const target = subMonths(now, offset);
    const start = startOfMonth(target);
    const end = offset === 0 ? now : endOfMonth(target);
    const days = differenceInDays(end, start) + 1;
    onDateRangeChange(days);
    setOpen(false);
  };

  const applyCustom = (range: DateRange | undefined) => {
    setCustomRange(range);
    if (range?.from && range?.to) {
      const days = differenceInDays(range.to, range.from) + 1;
      if (days > 0) {
        onDateRangeChange(days);
        setOpen(false);
      }
    }
  };

  const currentLabel =
    presets.find((p) => p.days === dateRange)?.label || `Últimos ${dateRange} dias`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 text-xs h-9 rounded-lg shadow-sm hover:shadow transition-all duration-150">
          <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="font-medium">{currentLabel}</span>
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="flex">
          <div className="border-r border-border p-2 flex flex-col gap-1 min-w-[160px]">
            {presets.map((p) => (
              <button
                key={p.days}
                onClick={() => {
                  onDateRangeChange(p.days);
                  setOpen(false);
                }}
                className={cn(
                  "text-left text-xs px-3 py-2 rounded-md transition-colors",
                  dateRange === p.days
                    ? "bg-primary text-primary-foreground"
                    : "hover:bg-muted text-foreground"
                )}
              >
                {p.label}
              </button>
            ))}
            <div className="h-px bg-border my-1" />
            <button
              onClick={() => applyMonthPreset(0)}
              className="text-left text-xs px-3 py-2 rounded-md hover:bg-muted text-foreground"
            >
              Este mês
            </button>
            <button
              onClick={() => applyMonthPreset(1)}
              className="text-left text-xs px-3 py-2 rounded-md hover:bg-muted text-foreground"
            >
              Mês passado
            </button>
          </div>
          <div className="p-2">
            <div className="text-[11px] font-medium text-muted-foreground px-2 pt-1 pb-2">
              Período customizado
            </div>
            <Calendar
              mode="range"
              selected={customRange}
              onSelect={applyCustom}
              numberOfMonths={2}
              locale={ptBR}
              className={cn("pointer-events-auto")}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
