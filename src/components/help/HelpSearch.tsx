import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface HelpFilter {
  key: string;
  label: string;
  /** Lowercase keywords used to match items (title + description). */
  keywords: string[];
}

interface HelpSearchProps {
  query: string;
  onQueryChange: (q: string) => void;
  activeFilter: string | null;
  onFilterChange: (key: string | null) => void;
  filters: HelpFilter[];
  resultsLabel?: string;
}

/**
 * Reusable search + tag filter for the Help page.
 * Pure presentational, no routing.
 */
export function HelpSearch({
  query,
  onQueryChange,
  activeFilter,
  onFilterChange,
  filters,
  resultsLabel,
}: HelpSearchProps) {
  return (
    <div className="mb-4 space-y-3">
      <div className="relative">
        <Search
          className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none"
          aria-hidden="true"
        />
        <Input
          type="search"
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Buscar instruções, métricas ou tópicos…"
          aria-label="Buscar na ajuda"
          className="pl-9 pr-9"
        />
        {query && (
          <button
            type="button"
            onClick={() => onQueryChange("")}
            aria-label="Limpar busca"
            className="absolute right-2 top-1/2 -translate-y-1/2 h-6 w-6 rounded-md flex items-center justify-center text-muted-foreground hover:bg-muted"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <span className="text-xs text-muted-foreground mr-1">Filtrar por tópico:</span>
        <Button
          type="button"
          size="sm"
          variant={activeFilter === null ? "default" : "outline"}
          onClick={() => onFilterChange(null)}
          className="h-7 px-3 text-xs"
        >
          Todos
        </Button>
        {filters.map((f) => (
          <Button
            key={f.key}
            type="button"
            size="sm"
            variant={activeFilter === f.key ? "default" : "outline"}
            onClick={() => onFilterChange(activeFilter === f.key ? null : f.key)}
            className="h-7 px-3 text-xs"
          >
            {f.label}
          </Button>
        ))}
        {resultsLabel && (
          <span className={cn("text-xs text-muted-foreground ml-auto")}>
            {resultsLabel}
          </span>
        )}
      </div>
    </div>
  );
}
