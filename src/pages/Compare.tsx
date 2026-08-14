import { Helmet } from "react-helmet-async";
import { useState, useEffect } from "react";
import { Navigate } from "react-router-dom";
import { GitCompare, Users, TrendingUp, DollarSign, Percent, ArrowRight } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/AppLayout";
import { useDashboardAnalytics } from "@/hooks/useDashboardData";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface Stats {
  visitors: number;
  leads: number;
  conversion: number;
  value: number;
}

function computeStats(metrics: any[] | null | undefined): Stats {
  const v = metrics?.reduce((s, m) => s + (m.visitors || 0), 0) ?? 0;
  const l = metrics?.reduce((s, m) => s + (m.leads || 0), 0) ?? 0;
  const val = metrics?.reduce((s, m) => s + Number(m.estimated_value || 0), 0) ?? 0;
  return {
    visitors: v,
    leads: l,
    conversion: v > 0 ? Number(((l / v) * 100).toFixed(2)) : 0,
    value: val,
  };
}

function ProjectColumn({
  projectId,
  onChange,
  projects,
  side,
  days,
}: {
  projectId: string | undefined;
  onChange: (id: string) => void;
  projects: Array<{ id: string; name: string }>;
  side: "left" | "right";
  days: number;
}) {
  const { data, isLoading } = useDashboardAnalytics(days, projectId);
  const stats = computeStats(data?.metrics);
  const accent = side === "left" ? "from-chart-blue to-primary" : "from-chart-orange to-chart-purple";

  return (
    <Card className="overflow-hidden border-2 border-border/50 glass-card transition-all duration-300 hover:shadow-lg">
      <Helmet>
        <title>Comparar projetos — KUBOWEB</title>
        <meta name="description" content="Compare o desempenho de diferentes projetos lado a lado." />
        <link rel="canonical" href="https://kubowebdashboard.lovable.app/compare" />
      </Helmet>
      <div className={`bg-gradient-to-br ${accent} p-6 text-white relative overflow-hidden`}>
        <div className="absolute inset-0 bg-white/10 backdrop-blur-sm" />
        <div className="relative z-10">
          <Select value={projectId} onValueChange={onChange}>
          <SelectTrigger className="bg-white/20 border-white/30 text-white backdrop-blur-sm hover:bg-white/30">
            <SelectValue placeholder="Selecione um projeto" />
          </SelectTrigger>
          <SelectContent>
            {projects.map((p) => (
              <SelectItem key={p.id} value={p.id}>
                {p.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
          </SelectContent>
        </Select>
        <div className="mt-4 flex items-center gap-2">
          <Badge variant="secondary" className="bg-white/20 text-white border-0 backdrop-blur-md shadow-sm font-semibold tracking-wider uppercase text-[10px]">
            {side === "left" ? "Projeto A" : "Projeto B"}
          </Badge>
          <span className="text-xs font-medium text-white/90">Últimos {days} dias</span>
        </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        {isLoading ? (
          <>
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </>
        ) : (
          <>
            <StatRow icon={<Users className="h-5 w-5" />} label="Visitantes" value={stats.visitors.toLocaleString("pt-BR")} />
            <StatRow icon={<TrendingUp className="h-5 w-5" />} label="Leads" value={stats.leads.toLocaleString("pt-BR")} />
            <StatRow icon={<Percent className="h-5 w-5" />} label="Conversão" value={`${stats.conversion}%`} />
            <StatRow icon={<DollarSign className="h-5 w-5" />} label="Valor estimado" value={`R$ ${stats.value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`} />
          </>
        )}
      </div>
    </Card>
  );
}

function StatRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b last:border-0">
      <div className="flex items-center gap-3 text-muted-foreground">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <div className="text-2xl font-bold text-foreground tabular-nums">{value}</div>
    </div>
  );
}

function VersusBadge({ a, b, label }: { a: number; b: number; label: string }) {
  if (a === 0 && b === 0) return null;
  const diff = a - b;
  const winner = diff > 0 ? "A" : diff < 0 ? "B" : null;
  const pct = b > 0 ? Math.abs(((a - b) / b) * 100).toFixed(1) : "—";
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground font-medium">{label}</span>
      {winner ? (
        <Badge className={winner === "A" ? "bg-[hsl(var(--success))]/15 text-[hsl(var(--success))] hover:bg-[hsl(var(--success))]/20 shadow-sm" : "bg-[hsl(var(--warning))]/15 text-[hsl(var(--warning))] hover:bg-[hsl(var(--warning))]/20 shadow-sm"}>
          Projeto {winner} +{pct}%
        </Badge>
      ) : (
        <Badge variant="secondary">Empate</Badge>
      )}
    </div>
  );
}

const Compare = () => {
  const { user } = useAuth();
  const [days, setDays] = useState(30);
  const { data: baseData, isLoading: baseLoading, error } = useDashboardAnalytics(days);

  // Buscar TODOS os projetos do usuário (de todos os clientes dele)
  const { data: allProjects } = useQuery({
    queryKey: ["all-user-projects", user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data: clients } = await supabase
        .from("clients")
        .select("id, company_name")
        .eq("user_id", user!.id);
      if (!clients || clients.length === 0) return [];
      const ids = clients.map((c) => c.id);
      const { data: projs } = await supabase
        .from("projects")
        .select("id, name, client_id")
        .in("client_id", ids);
      const clientMap = new Map(clients.map((c) => [c.id, c.company_name]));
      return (projs ?? []).map((p) => ({
        id: p.id,
        name: `${clientMap.get(p.client_id) ?? "?"} · ${p.name}`,
      }));
    },
  });
  const projects = allProjects ?? [];

  const [projectA, setProjectA] = useState<string | undefined>();
  const [projectB, setProjectB] = useState<string | undefined>();

  // Default selection
  useEffect(() => {
    if (projects.length >= 1 && !projectA) setProjectA(projects[0].id);
    if (projects.length >= 2 && !projectB) setProjectB(projects[1].id);
  }, [projects, projectA, projectB]);

  const { data: dataA } = useDashboardAnalytics(days, projectA);
  const { data: dataB } = useDashboardAnalytics(days, projectB);
  const statsA = computeStats(dataA?.metrics);
  const statsB = computeStats(dataB?.metrics);

  if ((error as Error | null)?.message === "AUTH_EXPIRED") {
    return <Navigate to="/login" replace />;
  }

  if (!baseLoading && !baseData?.client) {
    return <Navigate to="/onboarding" replace />;
  }

  return (
    <AppLayout>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Header destacado */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary via-chart-purple to-chart-orange p-8 mb-8 text-white shadow-xl animate-fade-in">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.3),transparent_50%)] animate-pulse" style={{ animationDuration: "4s" }} />
          <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 z-10">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <GitCompare className="h-6 w-6" />
                <h1 className="text-2xl font-bold">Comparar Projetos</h1>
              </div>
              <p className="text-white/80 text-sm">
                Compare KPIs de dois sites lado a lado para identificar oportunidades.
              </p>
            </div>
            <Select value={String(days)} onValueChange={(v) => setDays(Number(v))}>
              <SelectTrigger className="w-44 bg-white/20 border-white/30 text-white backdrop-blur-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">Últimos 7 dias</SelectItem>
                <SelectItem value="30">Últimos 30 dias</SelectItem>
                <SelectItem value="90">Últimos 90 dias</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {projects.length < 2 ? (
          <Card className="p-12 text-center">
            <GitCompare className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Você precisa de pelo menos 2 projetos</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
              Adicione mais um site em Configurações para começar a comparar.
            </p>
            <a href="/settings" className="text-sm text-primary hover:underline">
              Ir para Configurações →
            </a>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <ProjectColumn projectId={projectA} onChange={setProjectA} projects={projects} side="left" days={days} />
              <ProjectColumn projectId={projectB} onChange={setProjectB} projects={projects} side="right" days={days} />
            </div>

            {/* Vencedor por categoria */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <ArrowRight className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-semibold">Quem está na frente?</h2>
              </div>
              <div className="space-y-3">
                <VersusBadge a={statsA.visitors} b={statsB.visitors} label="Mais visitantes" />
                <VersusBadge a={statsA.leads} b={statsB.leads} label="Mais leads" />
                <VersusBadge a={statsA.conversion} b={statsB.conversion} label="Melhor conversão" />
                <VersusBadge a={statsA.value} b={statsB.value} label="Maior valor estimado" />
              </div>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
};

export default Compare;
