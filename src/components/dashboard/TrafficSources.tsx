import { useMemo, useState } from "react";
import { Globe, Search, Share2, MousePointerClick, Mail, Video, ExternalLink } from "lucide-react";
import { InfoTooltip } from "@/components/InfoTooltip";

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

const TrafficSources = ({ data }: { data: TrafficSource[] }) => {
  const [activeCategories, setActiveCategories] = useState<Record<string, boolean>>({});

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

  const hasAnyActiveFilter = categoryEntries.some(([cat]) => activeCategories[cat]);

  const filteredData = useMemo(() => {
    if (!hasAnyActiveFilter) return data;
    return data.filter((item) => activeCategories[sourceCategory(item.source)]);
  }, [activeCategories, data, hasAnyActiveFilter]);

  const totalVisitors = filteredData.reduce((s, d) => s + d.visitors, 0);

  const toggleCategory = (category: string) => {
    setActiveCategories((current) => ({
      ...current,
      [category]: !current[category],
    }));
  };

  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-medium text-card-foreground flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" /> Fontes de Tráfego
          <InfoTooltip content="De onde vêm seus visitantes. Agrupados em: Busca (Google, Bing), Social (Instagram, Facebook etc), Direto (digitaram a URL ou favoritos), Email e Referências (links de outros sites)." />
        </h3>
        <span className="text-xs text-muted-foreground font-medium">
          {totalVisitors.toLocaleString("pt-BR")} visitas
        </span>
      </div>

      {/* Category summary chips */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {categoryEntries.map(([cat, count]) => {
          const isActive = hasAnyActiveFilter ? Boolean(activeCategories[cat]) : true;

          return (
            <button
              key={cat}
              type="button"
              onClick={() => toggleCategory(cat)}
              aria-pressed={Boolean(activeCategories[cat])}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-xs font-medium transition-colors hover:bg-accent"
              title={`Filtrar ${cat}`}
            >
              <span className={isActive ? "text-foreground" : "text-muted-foreground"}>{cat}</span>
              <span className="font-medium text-foreground">
                {data.reduce((sum, item) => sum + item.visitors, 0) > 0
                  ? Math.round((count / data.reduce((sum, item) => sum + item.visitors, 0)) * 100)
                  : 0}
                %
              </span>
            </button>
          );
        })}
      </div>

      {/* Detailed sources */}
      <div className="space-y-3">
        {filteredData.map((s, i) => (
          <div key={s.source} className="group">
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
            <div
              className="h-1.5 rounded-full bg-muted overflow-hidden"
              title={`${s.source}: ${s.visitors.toLocaleString("pt-BR")} visitas (${s.percentage}%)`}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${s.percentage}%`, backgroundColor: s.color, opacity: 1 - i * 0.06 }}
              />
            </div>
          </div>
        ))}
      </div>

      {filteredData.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">Sem dados de tráfego ainda</p>
      )}
    </div>
  );
};

export default TrafficSources;
