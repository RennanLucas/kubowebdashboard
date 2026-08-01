import { useEffect, useMemo, useRef, useState } from "react";
import { Globe, Search, Share2, MousePointerClick, Mail, Video, ExternalLink, Download, FileImage, FileText } from "lucide-react";
import { InfoTooltip } from "@/components/InfoTooltip";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { buildExportFilename, downloadCsv, exportElementAsPng } from "@/lib/chart-export";
import { toast } from "sonner";

interface TrafficSource {
  source: string;
  visitors: number;
  percentage: number;
  color: string;
}

const sourceIcons: Record<string, React.ReactNode> = {
  Google: <Search className="h-3.5 w-3.5" />,
  Bing: <Search className="h-3.5 w-3.5" />,
  Yahoo: <Search className="h-3.5 w-3.5" />,
  Direto: <MousePointerClick className="h-3.5 w-3.5" />,
  Facebook: <Share2 className="h-3.5 w-3.5" />,
  Instagram: <Share2 className="h-3.5 w-3.5" />,
  "X (Twitter)": <Share2 className="h-3.5 w-3.5" />,
  LinkedIn: <Share2 className="h-3.5 w-3.5" />,
  TikTok: <Video className="h-3.5 w-3.5" />,
  YouTube: <Video className="h-3.5 w-3.5" />,
  Pinterest: <Share2 className="h-3.5 w-3.5" />,
  Email: <Mail className="h-3.5 w-3.5" />,
};

const sourceCategory = (source: string): string => {
  if (["Google", "Bing", "Yahoo"].includes(source)) return "Busca";
  if (["Facebook", "Instagram", "X (Twitter)", "LinkedIn", "TikTok", "YouTube", "Pinterest"].includes(source)) return "Social";
  if (source === "Direto") return "Direto";
  if (source === "Email") return "Email";
  return "Referência";
};

const TrafficSources = ({ data, dateRangeDays }: { data: TrafficSource[]; dateRangeDays: number }) => {
  const [activeCategories, setActiveCategories] = useState<Record<string, boolean>>({});
  const [focusedCategoryIndex, setFocusedCategoryIndex] = useState(0);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const categoryButtonRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const categories = useMemo(() => {
    const grouped: Record<string, number> = {};
    for (const s of data) {
      const cat = sourceCategory(s.source);
      grouped[cat] = (grouped[cat] || 0) + s.visitors;
    }
    return grouped;
  }, [data]);

  const categoryEntries = useMemo(
    () => Object.entries(categories).sort(([, a], [, b]) => b - a),
    [categories],
  );

  useEffect(() => {
    if (!categoryEntries.length) return;
    if (focusedCategoryIndex >= categoryEntries.length) {
      setFocusedCategoryIndex(categoryEntries.length - 1);
    }
  }, [categoryEntries.length, focusedCategoryIndex]);

  const hasAnyActiveFilter = categoryEntries.some(([cat]) => activeCategories[cat]);

  const filteredData = useMemo(() => {
    if (!hasAnyActiveFilter) return data;
    return data.filter((item) => activeCategories[sourceCategory(item.source)]);
  }, [activeCategories, data, hasAnyActiveFilter]);

  const totalVisitors = filteredData.reduce((s, d) => s + d.visitors, 0);
  const allVisitors = data.reduce((sum, item) => sum + item.visitors, 0);

  const displayData = useMemo(
    () =>
      filteredData.map((item) => ({
        ...item,
        percentage: totalVisitors > 0 ? Math.round((item.visitors / totalVisitors) * 100) : 0,
      })),
    [filteredData, totalVisitors],
  );

  const toggleCategory = (category: string) => {
    setActiveCategories((current) => ({
      ...current,
      [category]: !current[category],
    }));
  };

  const handleCategoryKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>, index: number, category: string) => {
    if (event.key === "ArrowRight" || event.key === "ArrowLeft") {
      event.preventDefault();
      const direction = event.key === "ArrowRight" ? 1 : -1;
      const nextIndex = (index + direction + categoryEntries.length) % categoryEntries.length;
      setFocusedCategoryIndex(nextIndex);
      categoryButtonRefs.current[nextIndex]?.focus();
      return;
    }

    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      toggleCategory(category);
    }
  };

  const handleExportCsv = () => {
    downloadCsv(
      [
        ["Categoria", "Fonte", "Visitantes", "Percentual (%)"],
        ...displayData.map((item) => [sourceCategory(item.source), item.source, item.visitors, item.percentage]),
      ],
      buildExportFilename("fontes-de-trafego", dateRangeDays, "csv"),
    );
    toast.success("CSV de fontes de tráfego baixado.");
  };

  const handleExportPng = async () => {
    if (!cardRef.current) return;
    try {
      await exportElementAsPng(cardRef.current, buildExportFilename("fontes-de-trafego", dateRangeDays, "png"));
      toast.success("PNG de fontes de tráfego baixado.");
    } catch (error: any) {
      toast.error(error?.message || "Erro ao exportar imagem.");
    }
  };

  return (
    <div className="glass-card p-5" ref={cardRef}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-card-foreground flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" /> Fontes de Tráfego
          <InfoTooltip content="De onde vêm seus visitantes. Agrupados em: Busca (Google, Bing), Social (Instagram, Facebook etc), Direto (digitaram a URL ou favoritos), Email e Referências (links de outros sites)." />
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground font-medium">
            {totalVisitors.toLocaleString("pt-BR")} visitas
          </span>
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
        </div>
      </div>

      {/* Category summary chips */}
      <div className="flex flex-wrap gap-1.5 mb-4" role="group" aria-label="Filtros de categoria das fontes de tráfego">
        {categoryEntries.map(([cat, count], index) => {
          const isActive = hasAnyActiveFilter ? Boolean(activeCategories[cat]) : true;

          return (
            <TooltipProvider key={cat} delayDuration={120}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    ref={(element) => (categoryButtonRefs.current[index] = element)}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    onKeyDown={(event) => handleCategoryKeyDown(event, index, cat)}
                    onFocus={() => setFocusedCategoryIndex(index)}
                    aria-pressed={Boolean(activeCategories[cat])}
                    aria-keyshortcuts="ArrowLeft ArrowRight Enter Space"
                    aria-label={`${Boolean(activeCategories[cat]) ? "Remover filtro de" : "Filtrar por"} ${cat}`}
                    tabIndex={index === focusedCategoryIndex ? 0 : -1}
                    className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  >
                    <span className={isActive ? "text-foreground" : "text-muted-foreground"}>{cat}</span>
                    <span className="font-medium text-foreground">
                      {allVisitors > 0
                        ? Math.round((count / allVisitors) * 100)
                        : 0}
                      %
                    </span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="top" className="text-xs">
                  {Boolean(activeCategories[cat]) ? `Remover filtro de ${cat}` : `Filtrar por ${cat}`}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          );
        })}
      </div>

      {/* Detailed sources */}
      <div className="space-y-3 max-h-[260px] overflow-y-auto pr-1 -mr-1 scrollbar-thin">
        {displayData.map((s, i) => (
          <TooltipProvider key={s.source} delayDuration={120}>
            <Tooltip>
              <TooltipTrigger asChild>
                <div
                  className="group"
                  tabIndex={0}
                  aria-label={`${s.source}, ${s.visitors.toLocaleString("pt-BR")} visitas, ${s.percentage}% do tráfego no período filtrado`}
                >
                  <div className="flex items-center justify-between text-sm mb-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <div className="flex-shrink-0 w-6 h-6 rounded-md bg-muted flex items-center justify-center text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary transition-colors duration-150">
                        {sourceIcons[s.source] || <ExternalLink className="h-3.5 w-3.5" />}
                      </div>
                      <span className="text-card-foreground font-medium truncate">{s.source}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0 ml-2">
                      <span className="text-card-foreground font-medium text-xs">{s.visitors.toLocaleString("pt-BR")}</span>
                      <span className="text-muted-foreground text-xs w-9 text-right">{s.percentage}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${s.percentage}%`, backgroundColor: s.color, opacity: 1 - i * 0.06 }}
                    />
                  </div>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="text-xs">
                {`${s.source}: ${s.visitors.toLocaleString("pt-BR")} visitas (${s.percentage}%)`}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        ))}
      </div>


      {filteredData.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">Sem dados de tráfego ainda</p>
      )}
    </div>
  );
};

export default TrafficSources;
