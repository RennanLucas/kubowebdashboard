import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLiveFeed } from "@/hooks/useLiveFeed";
import { MapPin, Globe, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

interface LiveFeedCardProps {
  projectId: string | null;
  compact?: boolean;
}

const LiveFeedCard = ({ projectId, compact = true }: LiveFeedCardProps) => {
  const { visitors, loading } = useLiveFeed(projectId, compact ? 8 : 50);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
        <div className="flex items-center gap-2">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-success" />
          </span>
          <CardTitle className="text-sm font-medium">Ao vivo</CardTitle>
        </div>
        {compact && (
          <Button asChild variant="ghost" size="sm" className="h-7 text-xs">
            <Link to="/live">Ver tudo <ExternalLink className="ml-1 h-3 w-3" /></Link>
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-2">
        {loading && <p className="text-xs text-muted-foreground">Conectando…</p>}
        {!loading && visitors.length === 0 && (
          <p className="text-xs text-muted-foreground py-4 text-center">
            Aguardando visitantes…
          </p>
        )}
        {visitors.map((v) => (
          <div key={v.id} className="flex items-start gap-2 text-xs py-1.5 border-b border-border/40 last:border-0">
            <div className="shrink-0 w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center">
              <Globe className="h-3 w-3 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-foreground truncate">
                Visitante {v.city ? `de ${v.city}` : v.country ? `de ${v.country}` : "anônimo"}
                {" "}visitou <span className="font-medium">{v.page_path}</span>
              </p>
              <p className="text-muted-foreground text-[10px] mt-0.5">
                {formatDistanceToNow(new Date(v.created_at), { addSuffix: true, locale: ptBR })}
              </p>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default LiveFeedCard;
