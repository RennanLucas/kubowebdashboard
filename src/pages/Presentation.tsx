import { Helmet } from "react-helmet-async";
import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Users, TrendingUp, DollarSign, Percent, X, Maximize2, RefreshCw } from "lucide-react";
import { useDashboardAnalytics } from "@/hooks/useDashboardData";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

const REFRESH_MS = 30000;

function BigStat({
  label,
  value,
  icon,
  accent,
}: {
  label: string;
  value: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <div className={`relative overflow-hidden rounded-[2rem] p-8 bg-gradient-to-br ${accent} shadow-2xl transition-transform duration-500 hover:scale-[1.02]`}>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.25),transparent_60%)] animate-pulse" style={{ animationDuration: "3s" }} />
      <div className="relative">
        <div className="flex items-center gap-3 text-white/90 mb-4">
          {icon}
          <span className="text-lg font-medium uppercase tracking-wider">{label}</span>
        </div>
        <div className="text-7xl font-bold text-white tabular-nums leading-none">{value}</div>
      </div>
    </div>
  );
}

const Presentation = () => {
  const navigate = useNavigate();
  const [tick, setTick] = useState(0);
  const [secondsLeft, setSecondsLeft] = useState(REFRESH_MS / 1000);
  const { data, isLoading, error, refetch } = useDashboardAnalytics(30);

  // Auto refresh every 30s
  useEffect(() => {
    const id = setInterval(() => {
      refetch();
      setTick((t) => t + 1);
      setSecondsLeft(REFRESH_MS / 1000);
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [refetch]);

  // Countdown
  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((s) => (s > 0 ? s - 1 : 0));
    }, 1000);
    return () => clearInterval(id);
  }, [tick]);

  // Try fullscreen
  const enterFullscreen = () => {
    document.documentElement.requestFullscreen?.().catch(() => {});
  };

  // Exit on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !document.fullscreenElement) {
        navigate("/dashboard");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  if ((error as Error | null)?.message === "AUTH_EXPIRED") {
    return <Navigate to="/login" replace />;
  }

  const metrics = data?.metrics;
  const totalVisitors = metrics?.reduce((s, m) => s + m.visitors, 0) ?? 0;
  const totalLeads = metrics?.reduce((s, m) => s + m.leads, 0) ?? 0;
  const totalValue = metrics?.reduce((s, m) => s + Number(m.estimated_value), 0) ?? 0;
  const conversion = totalVisitors > 0 ? ((totalLeads / totalVisitors) * 100).toFixed(2) : "0";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 text-white p-6 sm:p-10">
      <Helmet>
        <title>Apresentação — KUBOWEB</title>
        <meta name="description" content="Modo apresentação do dashboard KUBOWEB para telas e reuniões." />
        <link rel="canonical" href="https://kubowebdashboard.lovable.app/presentation" />
      </Helmet>
      {/* Top bar */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <div className="text-xs uppercase tracking-widest text-white/50">Modo Apresentação</div>
          <h1 className="text-3xl font-bold">{data?.client?.company_name ?? "Dashboard"}</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-md text-sm border border-white/20 shadow-inner">
            <RefreshCw className="h-4 w-4 animate-spin" style={{ animationDuration: "3s" }} />
            <span className="font-mono">Atualiza em {secondsLeft}s</span>
          </div>
          <Button variant="ghost" size="icon" onClick={enterFullscreen} className="text-white hover:bg-white/10">
            <Maximize2 className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="text-white hover:bg-white/10">
            <X className="h-5 w-5" />
          </Button>
        </div>
      </div>

      {/* KPIs gigantes */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-56 rounded-3xl bg-white/5" />
          <Skeleton className="h-56 rounded-3xl bg-white/5" />
          <Skeleton className="h-56 rounded-3xl bg-white/5" />
          <Skeleton className="h-56 rounded-3xl bg-white/5" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <BigStat
            label="Visitantes"
            value={totalVisitors.toLocaleString("pt-BR")}
            icon={<Users className="h-7 w-7" />}
            accent="from-blue-500 to-indigo-600"
          />
          <BigStat
            label="Leads"
            value={totalLeads.toLocaleString("pt-BR")}
            icon={<TrendingUp className="h-7 w-7" />}
            accent="from-emerald-500 to-teal-600"
          />
          <BigStat
            label="Conversão"
            value={`${conversion}%`}
            icon={<Percent className="h-7 w-7" />}
            accent="from-orange-500 to-pink-600"
          />
          <BigStat
            label="Valor estimado"
            value={`R$ ${totalValue.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`}
            icon={<DollarSign className="h-7 w-7" />}
            accent="from-violet-500 to-fuchsia-600"
          />
        </div>
      )}

      <div className="mt-10 text-center text-xs text-white/40">
        Pressione ESC para sair · Atualização automática a cada 30 segundos · Últimos 30 dias
      </div>
    </div>
  );
};

export default Presentation;
