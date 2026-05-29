import { Helmet } from "react-helmet-async";
import { AppLayout } from "@/components/layout/AppLayout";
import { useDashboardAnalytics } from "@/hooks/useDashboardData";
import { useLiveFeed } from "@/hooks/useLiveFeed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Users, MapPin, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Navigate } from "react-router-dom";

export default function Live() {
  const { data, error } = useDashboardAnalytics(1);
  const projectId = data?.client?.project?.id ?? null;
  const { visitors, loading } = useLiveFeed(projectId, 100);

  if ((error as Error | null)?.message === "AUTH_EXPIRED") {
    return <Navigate to="/login" replace />;
  }

  // Aggregate stats from current feed
  const uniqueCountries = new Set(visitors.map((v) => v.country).filter(Boolean)).size;
  const uniquePages = new Set(visitors.map((v) => v.page_path)).size;
  const activeNow = data?.activeVisitors ?? 0;

  return (
    <AppLayout>
      <Helmet>
        <title>Visitantes ao vivo — KUBOWEB</title>
        <meta name="description" content="Acompanhe os visitantes ativos no seu site em tempo real." />
        <link rel="canonical" href="https://kubowebdashboard.lovable.app/live" />
      </Helmet>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6 flex items-center gap-3">
          <span className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-success opacity-75" />
            <span className="relative inline-flex rounded-full h-3 w-3 bg-success" />
          </span>
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight">Live Feed</h1>
            <p className="text-sm text-muted-foreground">Visitantes em tempo real nos últimos 30 minutos</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Activity className="h-3.5 w-3.5" /> Ativos agora
              </div>
              <div className="text-2xl font-semibold text-foreground">{activeNow}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <Globe className="h-3.5 w-3.5" /> Países distintos
              </div>
              <div className="text-2xl font-semibold text-foreground">{uniqueCountries}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-4">
              <div className="flex items-center gap-2 text-muted-foreground text-xs mb-1">
                <MapPin className="h-3.5 w-3.5" /> Páginas distintas
              </div>
              <div className="text-2xl font-semibold text-foreground">{uniquePages}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Stream de visitantes</CardTitle>
          </CardHeader>
          <CardContent>
            {loading && <p className="text-sm text-muted-foreground">Conectando ao feed em tempo real…</p>}
            {!loading && visitors.length === 0 && (
              <div className="py-12 text-center">
                <Users className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">Aguardando visitantes…</p>
                <p className="text-xs text-muted-foreground/70 mt-1">As visitas aparecerão aqui em tempo real.</p>
              </div>
            )}
            <div className="divide-y divide-border">
              {visitors.map((v) => (
                <div key={v.id} className="flex items-start gap-3 py-3 animate-in fade-in slide-in-from-top-1 duration-300">
                  <div className="shrink-0 w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                    <Globe className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground">
                      Visitante {v.city ? <span className="font-medium">de {v.city}</span> : v.country ? <span className="font-medium">de {v.country}</span> : "anônimo"}
                      {" "}acabou de visitar <span className="font-medium text-primary">{v.page_path}</span>
                    </p>
                    {v.referrer && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">via {v.referrer}</p>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground whitespace-nowrap">
                    {formatDistanceToNow(new Date(v.created_at), { addSuffix: true, locale: ptBR })}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
