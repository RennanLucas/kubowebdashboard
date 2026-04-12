import { Globe, Search, Share2, MousePointerClick, Mail, Video, ExternalLink } from "lucide-react";

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
  const totalVisitors = data.reduce((s, d) => s + d.visitors, 0);

  // Group by category for summary
  const categories: Record<string, number> = {};
  for (const s of data) {
    const cat = sourceCategory(s.source);
    categories[cat] = (categories[cat] || 0) + s.visitors;
  }

  return (
    <div className="glass-card rounded-xl p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-card-foreground flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" /> Fontes de Tráfego
        </h3>
        <span className="text-xs text-muted-foreground font-medium">
          {totalVisitors.toLocaleString("pt-BR")} visitas
        </span>
      </div>

      {/* Category summary chips */}
      <div className="flex flex-wrap gap-1.5 mb-4">
        {Object.entries(categories)
          .sort(([, a], [, b]) => b - a)
          .map(([cat, count]) => (
            <span
              key={cat}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-muted text-xs font-medium text-muted-foreground"
            >
              {cat}
              <span className="text-foreground font-semibold">
                {totalVisitors > 0 ? Math.round((count / totalVisitors) * 100) : 0}%
              </span>
            </span>
          ))}
      </div>

      {/* Detailed sources */}
      <div className="space-y-3">
        {data.map((s, i) => (
          <div key={s.source}>
            <div className="flex items-center justify-between text-sm mb-1">
              <div className="flex items-center gap-2 min-w-0">
                <div className="flex-shrink-0 w-6 h-6 rounded-md bg-muted flex items-center justify-center text-muted-foreground">
                  {sourceIcons[s.source] || <ExternalLink className="h-3.5 w-3.5" />}
                </div>
                <span className="text-card-foreground font-medium truncate">{s.source}</span>
              </div>
              <div className="flex items-center gap-2 shrink-0 ml-2">
                <span className="text-card-foreground font-semibold text-xs">{s.visitors.toLocaleString("pt-BR")}</span>
                <span className="text-muted-foreground text-xs w-9 text-right">{s.percentage}%</span>
              </div>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${s.percentage}%`, backgroundColor: s.color, opacity: 1 - i * 0.06 }}
              />
            </div>
          </div>
        ))}
      </div>

      {data.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">Sem dados de tráfego ainda</p>
      )}
    </div>
  );
};

export default TrafficSources;
