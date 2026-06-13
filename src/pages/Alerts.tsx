import { Helmet } from "react-helmet-async";
import { Bell, TrendingDown, TrendingUp, AlertTriangle, CheckCircle2, Info, Target, Clock, X, Check, Trash2 } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useDashboardAnalytics } from "@/hooks/useDashboardData";
import { useGoals } from "@/hooks/useGoals";
import { useHourlyHeatmap } from "@/hooks/useHourlyHeatmap";
import { usePersistedAlerts } from "@/hooks/usePersistedAlerts";
import { Navigate, Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "sonner";

type AlertSeverity = "critical" | "warning" | "info" | "success";

interface AlertItem {
  id: string;
  severity: AlertSeverity;
  title: string;
  message: string;
  icon: React.ReactNode;
}

const severityConfig: Record<AlertSeverity, { color: string; bg: string; badge: "default" | "secondary" | "destructive" | "outline" }> = {
  critical: { color: "text-destructive", bg: "bg-destructive/5 border-destructive/30", badge: "destructive" },
  warning: { color: "text-[hsl(var(--warning))]", bg: "bg-[hsl(var(--warning))]/5 border-[hsl(var(--warning))]/30", badge: "secondary" },
  info: { color: "text-primary", bg: "bg-primary/5 border-primary/30", badge: "default" },
  success: { color: "text-[hsl(var(--success))]", bg: "bg-[hsl(var(--success))]/5 border-[hsl(var(--success))]/30", badge: "default" },
};

export default function Alerts() {
  const { data, isLoading, error } = useDashboardAnalytics(30);
  const projectId = data?.client?.project?.id;
  const { goals } = useGoals(projectId);
  const { heatmap } = useHourlyHeatmap(projectId, 30);
  const { alerts: persisted, markAsRead, dismiss, markAllRead, dismissAll } = usePersistedAlerts(projectId);

  const handleDismissAll = async () => {
    try {
      await dismissAll();
      toast.success("Todas as notificações foram apagadas");
    } catch (e) {
      toast.error("Não foi possível apagar as notificações");
    }
  };

  if ((error as Error | null)?.message === "AUTH_EXPIRED") {
    return <Navigate to="/login" replace />;
  }

  const alerts: AlertItem[] = [];

  if (data) {
    const totalVisitors = data.metrics?.reduce((s, m) => s + m.visitors, 0) ?? 0;
    const totalLeads = data.metrics?.reduce((s, m) => s + m.leads, 0) ?? 0;
    const conversionRate = totalVisitors > 0 ? (totalLeads / totalVisitors) * 100 : 0;
    const cmp = data.comparison;

    if (cmp && cmp.visitors <= -20) {
      alerts.push({
        id: "traffic-drop",
        severity: "critical",
        title: "Queda significativa de tráfego",
        message: `O tráfego caiu ${Math.abs(cmp.visitors)}% em relação ao período anterior. Verifique seus canais de aquisição.`,
        icon: <TrendingDown className="h-5 w-5" />,
      });
    } else if (cmp && cmp.visitors >= 20) {
      alerts.push({
        id: "traffic-up",
        severity: "success",
        title: "Tráfego em forte crescimento",
        message: `Parabéns! O tráfego cresceu ${cmp.visitors}% em relação ao período anterior.`,
        icon: <TrendingUp className="h-5 w-5" />,
      });
    }

    if (conversionRate > 0 && conversionRate < 1 && totalVisitors > 50) {
      alerts.push({
        id: "low-conversion",
        severity: "warning",
        title: "Taxa de conversão baixa",
        message: `Sua taxa de conversão está em ${conversionRate.toFixed(2)}%. A média do mercado é ~2.5%. Considere otimizar suas CTAs.`,
        icon: <AlertTriangle className="h-5 w-5" />,
      });
    }

    if (conversionRate >= 3) {
      alerts.push({
        id: "high-conversion",
        severity: "success",
        title: "Excelente taxa de conversão",
        message: `Sua taxa de conversão de ${conversionRate.toFixed(2)}% está acima da média do mercado.`,
        icon: <CheckCircle2 className="h-5 w-5" />,
      });
    }

    if (totalVisitors === 0 && !isLoading) {
      alerts.push({
        id: "no-data",
        severity: "warning",
        title: "Nenhum dado coletado",
        message: "Ainda não recebemos dados do seu site. Verifique se o código de rastreamento está instalado corretamente.",
        icon: <AlertTriangle className="h-5 w-5" />,
      });
    }

    if (data.engagement && data.engagement.bounceRate > 70) {
      alerts.push({
        id: "high-bounce",
        severity: "warning",
        title: "Alta taxa de rejeição",
        message: `${data.engagement.bounceRate.toFixed(0)}% dos visitantes saem sem interagir. Revise a experiência da landing page.`,
        icon: <AlertTriangle className="h-5 w-5" />,
      });
    }

    if (data.trafficSources && data.trafficSources.length > 0 && data.trafficSources[0].percentage > 80) {
      alerts.push({
        id: "single-channel",
        severity: "info",
        title: "Dependência de um único canal",
        message: `${data.trafficSources[0].percentage}% do seu tráfego vem de "${data.trafficSources[0].source}". Diversifique seus canais para reduzir riscos.`,
        icon: <Info className="h-5 w-5" />,
      });
    }

    // Goal-based alerts
    const totalValue = data.metrics?.reduce((s, m) => s + Number(m.estimated_value), 0) ?? 0;
    if (goals.visitors > 0 && totalVisitors >= goals.visitors) {
      alerts.push({
        id: "goal-visitors",
        severity: "success",
        title: "Meta de visitantes atingida 🎯",
        message: `Você ultrapassou sua meta de ${goals.visitors.toLocaleString("pt-BR")} visitantes (atual: ${totalVisitors.toLocaleString("pt-BR")}).`,
        icon: <Target className="h-5 w-5" />,
      });
    } else if (goals.visitors > 0 && totalVisitors >= goals.visitors * 0.8) {
      alerts.push({
        id: "goal-visitors-near",
        severity: "info",
        title: "Perto da meta de visitantes",
        message: `Faltam ${(goals.visitors - totalVisitors).toLocaleString("pt-BR")} visitantes para atingir sua meta.`,
        icon: <Target className="h-5 w-5" />,
      });
    }
    if (goals.leads > 0 && totalLeads >= goals.leads) {
      alerts.push({
        id: "goal-leads",
        severity: "success",
        title: "Meta de leads atingida 🎯",
        message: `Você bateu sua meta de ${goals.leads} leads (atual: ${totalLeads}).`,
        icon: <Target className="h-5 w-5" />,
      });
    }
    if (goals.estimatedValue > 0 && totalValue >= goals.estimatedValue) {
      alerts.push({
        id: "goal-value",
        severity: "success",
        title: "Meta de valor atingida 🎯",
        message: `Você superou a meta de R$ ${goals.estimatedValue.toLocaleString("pt-BR")} em valor estimado.`,
        icon: <Target className="h-5 w-5" />,
      });
    }

    // Peak hour insight from heatmap
    if (heatmap.length > 0) {
      const peak = [...heatmap].sort((a, b) => b.count - a.count)[0];
      if (peak && peak.count > 0) {
        const dayNames = ["domingo", "segunda", "terça", "quarta", "quinta", "sexta", "sábado"];
        alerts.push({
          id: "peak-hour",
          severity: "info",
          title: "Melhor horário identificado",
          message: `Seu pico de visitas é ${dayNames[peak.day]} às ${peak.hour}h. Considere publicar conteúdo ou rodar anúncios nesse horário.`,
          icon: <Clock className="h-5 w-5" />,
        });
      }
    }
  }

  const unreadCount = persisted.filter((a) => !a.read).length;

  return (
    <AppLayout>
      <Helmet>
        <title>Alertas — KUBOWEB</title>
        <meta name="description" content="Monitore anomalias, metas e oportunidades automaticamente detectadas." />
        <link rel="canonical" href="https://kubowebdashboard.lovable.app/alerts" />
      </Helmet>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-semibold text-foreground tracking-tight flex items-center gap-2">
              <Bell className="h-6 w-6 text-primary" />
              Alertas e Notificações
              {unreadCount > 0 && (
                <Badge variant="destructive" className="text-[10px]">{unreadCount} novos</Badge>
              )}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monitoramento automático de anomalias, metas e oportunidades.{" "}
              <Link to="/help" className="text-primary hover:underline">Saiba mais</Link>
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {unreadCount > 0 && (
              <Button variant="outline" size="sm" onClick={markAllRead}>
                <Check className="h-3.5 w-3.5 mr-1" /> Marcar todos como lidos
              </Button>
            )}
            {persisted.length > 0 && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button variant="outline" size="sm" className="text-destructive hover:text-destructive">
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Apagar tudo
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Apagar todas as notificações?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Esta ação removerá permanentemente as {persisted.length} notificação(ões) automáticas deste projeto. Os insights atuais continuarão sendo gerados em tempo real.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDismissAll}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      Apagar tudo
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>
        </div>

        {/* Persisted alerts (from cron) */}
        {persisted.length > 0 && (
          <div className="mb-6">
            <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Notificações automáticas
            </h2>
            <div className="space-y-2">
              {persisted.map((alert) => {
                const cfg = severityConfig[alert.severity] ?? severityConfig.info;
                return (
                  <Card key={alert.id} className={`p-4 border ${cfg.bg} ${alert.read ? "opacity-60" : ""}`}>
                    <div className="flex items-start gap-3">
                      <div className={`shrink-0 ${cfg.color}`}>
                        <Bell className="h-5 w-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <h3 className="text-sm font-semibold text-foreground">{alert.title}</h3>
                          {!alert.read && <Badge variant="default" className="text-[10px] h-4">Novo</Badge>}
                          <span className="text-[10px] text-muted-foreground">
                            {formatDistanceToNow(new Date(alert.created_at), { addSuffix: true, locale: ptBR })}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">{alert.message}</p>
                      </div>
                      <div className="flex gap-1 shrink-0">
                        {!alert.read && (
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => markAsRead(alert.id)}>
                            <Check className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => dismiss(alert.id)}>
                          <X className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

        {/* Local rule-based insights */}
        <h2 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
          Insights atuais
        </h2>
        {isLoading ? (
          <Card className="p-12 text-center text-muted-foreground text-sm">Carregando alertas...</Card>
        ) : alerts.length === 0 && persisted.length === 0 ? (
          <Card className="p-12 text-center border-dashed">
            <CheckCircle2 className="h-12 w-12 text-[hsl(var(--success))]/40 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Tudo certo por aqui!</h3>
            <p className="text-sm text-muted-foreground">
              Nenhuma anomalia detectada. Continuaremos monitorando seus dados.
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {alerts.map((alert) => {
              const cfg = severityConfig[alert.severity];
              return (
                <Card key={alert.id} className={`p-4 border ${cfg.bg}`}>
                  <div className="flex items-start gap-3">
                    <div className={`shrink-0 ${cfg.color}`}>{alert.icon}</div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-semibold text-foreground">{alert.title}</h3>
                        <Badge variant={cfg.badge} className="text-[10px]">
                          {alert.severity === "critical" ? "Crítico" : alert.severity === "warning" ? "Atenção" : alert.severity === "success" ? "Positivo" : "Info"}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{alert.message}</p>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
