import { Helmet } from "react-helmet-async";
import { AppLayout } from "@/components/layout/AppLayout";
import { useDashboardAnalytics } from "@/hooks/useDashboardData";
import { useLiveFeed } from "@/hooks/useLiveFeed";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Globe, Users, MapPin, Activity } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Navigate } from "react-router-dom";
import { FeatureLock } from "@/components/FeatureLock";
import { useSelectedProject } from "@/hooks/useSelectedProject";

export default function Live() {
  const { selectedProjectId } = useSelectedProject();
  const { data, error } = useDashboardAnalytics(1, selectedProjectId);
  const projectId = selectedProjectId || data?.client?.project?.id || null;
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
        <link rel="canonical" href="https://kubowebdashboard.vercel.app/live" />
      </Helmet>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="relative mb-6 overflow-hidden rounded-3xl border border-cyan-500/20 bg-gradient-to-r from-slate-950 via-cyan-950 to-slate-950 p-6 text-white shadow-xl sm:p-8">
          <div className="absolute inset-0 opacity-20 [background-image:radial-gradient(circle_at_20%_20%,#22d3ee_0,transparent_35%),radial-gradient(circle_at_80%_70%,#10b981_0,transparent_30%)]" />
          <div className="relative flex items-center gap-4"><span className="relative flex h-4 w-4"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-4 w-4 rounded-full bg-emerald-400" /></span><div><div className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-300">Sinal ativo · projeto isolado</div><h1 className="mt-1 text-3xl font-bold tracking-tight">Live Feed</h1><p className="mt-1 text-sm text-white/65">Visitantes recebidos nos últimos 30 minutos, atualizados em tempo real</p></div></div>
          </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <Card className="glass-card shadow-sm border-border/50">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-2 text-muted-foreground font-medium text-xs mb-2 uppercase tracking-wider">
                <Activity className="h-4 w-4 text-success" /> Ativos agora
              </div>
              <div className="text-3xl font-bold text-foreground">{activeNow}</div>
            </CardContent>
          </Card>
          <Card className="glass-card shadow-sm border-border/50">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-2 text-muted-foreground font-medium text-xs mb-2 uppercase tracking-wider">
                <Globe className="h-4 w-4 text-chart-blue" /> Países
              </div>
              <div className="text-3xl font-bold text-foreground">{uniqueCountries}</div>
            </CardContent>
          </Card>
          <Card className="glass-card shadow-sm border-border/50">
            <CardContent className="pt-5 pb-5">
              <div className="flex items-center gap-2 text-muted-foreground font-medium text-xs mb-2 uppercase tracking-wider">
                <MapPin className="h-4 w-4 text-chart-orange" /> Páginas
              </div>
              <div className="text-3xl font-bold text-foreground">{uniquePages}</div>
            </CardContent>
          </Card>
        </div>

        <FeatureLock feature="live" description="Veja quem está no seu site agora, de onde vem e qual página está acessando. Disponível a partir do plano Pro.">
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
            <div className="divide-y divide-border/60">
              {visitors.map((v) => (
                <div key={v.id} className="flex items-start gap-3 py-4 animate-fade-up duration-300">
                  <div className="shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shadow-sm">
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
        </FeatureLock>
      </div>
    </AppLayout>
  );
}
