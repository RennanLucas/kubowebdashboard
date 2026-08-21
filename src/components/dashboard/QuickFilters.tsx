import { useDashboardFilters, SOURCE_OPTIONS, DEVICE_OPTIONS, type SourceFilter, type DeviceFilter } from "@/contexts/DashboardFiltersContext";
import { cn } from "@/lib/utils";
import { X, SlidersHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

const SOURCE_COLORS: Record<SourceFilter, string> = {
  all:      "bg-primary/10 text-primary border-primary/20 hover:bg-primary/20",
  organic:  "bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/20 dark:text-green-400",
  direct:   "bg-blue-500/10 text-blue-600 border-blue-500/20 hover:bg-blue-500/20 dark:text-blue-400",
  social:   "bg-sky-500/10 text-sky-600 border-sky-500/20 hover:bg-sky-500/20 dark:text-sky-400",
  paid:     "bg-purple-500/10 text-purple-600 border-purple-500/20 hover:bg-purple-500/20 dark:text-purple-400",
  referral: "bg-orange-500/10 text-orange-600 border-orange-500/20 hover:bg-orange-500/20 dark:text-orange-400",
  email:    "bg-yellow-500/10 text-yellow-600 border-yellow-500/20 hover:bg-yellow-500/20 dark:text-yellow-400",
};

const DEVICE_COLORS: Record<DeviceFilter, string> = {
  all:     "bg-muted text-muted-foreground border-border hover:bg-muted/80",
  desktop: "bg-indigo-500/10 text-indigo-600 border-indigo-500/20 hover:bg-indigo-500/20 dark:text-indigo-400",
  mobile:  "bg-pink-500/10 text-pink-600 border-pink-500/20 hover:bg-pink-500/20 dark:text-pink-400",
  tablet:  "bg-teal-500/10 text-teal-600 border-teal-500/20 hover:bg-teal-500/20 dark:text-teal-400",
};

interface FilterPillProps<T extends string> {
  value: T;
  label: string;
  active: boolean;
  colorClass: string;
  onClick: (v: T) => void;
}

function FilterPill<T extends string>({ value, label, active, colorClass, onClick }: FilterPillProps<T>) {
  return (
    <button
      type="button"
      onClick={() => onClick(value)}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all duration-150 select-none",
        active
          ? cn(colorClass, "ring-2 ring-offset-1 ring-current/30 shadow-sm")
          : "bg-muted/40 text-muted-foreground border-border/60 hover:bg-muted hover:text-foreground"
      )}
    >
      {active && <span className="h-1.5 w-1.5 rounded-full bg-current" />}
      {label}
    </button>
  );
}

export function QuickFilters() {
  const { source, device, setSource, setDevice, reset, hasActiveFilters } = useDashboardFilters();

  return (
    <div className="flex flex-wrap items-center gap-2 py-2 px-0.5 mb-1">
      {/* Icon */}
      <span className="text-muted-foreground shrink-0">
        <SlidersHorizontal className="h-3.5 w-3.5" />
      </span>

      {/* Source filters */}
      <div className="flex flex-wrap items-center gap-1.5">
        {SOURCE_OPTIONS.map((opt) => (
          <FilterPill<SourceFilter>
            key={opt.value}
            value={opt.value}
            label={opt.label}
            active={source === opt.value}
            colorClass={SOURCE_COLORS[opt.value]}
            onClick={setSource}
          />
        ))}
      </div>

      {/* Separator */}
      <span className="hidden sm:block w-px h-4 bg-border/70 mx-0.5 shrink-0" />

      {/* Device filters */}
      <div className="flex flex-wrap items-center gap-1.5">
        {DEVICE_OPTIONS.filter((d) => d.value !== "all").map((opt) => (
          <FilterPill<DeviceFilter>
            key={opt.value}
            value={opt.value}
            label={opt.label}
            active={device === opt.value}
            colorClass={DEVICE_COLORS[opt.value]}
            onClick={setDevice}
          />
        ))}
      </div>

      {/* Reset button */}
      {hasActiveFilters && (
        <Button
          variant="ghost"
          size="sm"
          onClick={reset}
          className="h-6 px-2 text-[11px] text-muted-foreground hover:text-foreground gap-1"
        >
          <X className="h-3 w-3" />
          Limpar
        </Button>
      )}
    </div>
  );
}
