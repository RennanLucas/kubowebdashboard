import { Bell, TrendingDown, TrendingUp, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useDashboardAnalytics } from "@/hooks/useDashboardData";
import { Navigate } from "react-router-dom";

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
  }

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="mb-6">
          <h1 className="text-2xl font-semibold text-foreground tracking-tight flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            Alertas e Notificações
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Monitoramento automático de anomalias e oportunidades nos seus dados
          </p>
        </div>

        {isLoading ? (
          <Card className="p-12 text-center text-muted-foreground text-sm">Carregando alertas...</Card>
        ) : alerts.length === 0 ? (
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
