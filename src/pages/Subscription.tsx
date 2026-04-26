import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CalendarClock, CheckCircle2, CreditCard, Loader2, ShieldAlert, XCircle } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { Skeleton } from "@/components/ui/skeleton";
import { useSubscription } from "@/hooks/useSubscription";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PLAN_LABELS: Record<string, string> = {
  kuboweb_pro_monthly: "Pro · Mensal",
  kuboweb_pro_plus_monthly: "Pro+ · Mensal",
  kuboweb_pro_yearly: "Pro · Anual",
};

const PLAN_PRICES: Record<string, string> = {
  kuboweb_pro_monthly: "R$ 29,99/mês",
  kuboweb_pro_plus_monthly: "R$ 49,99/mês",
  kuboweb_pro_yearly: "R$ 299,90/ano",
};

const formatDate = (iso: string | null) => {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "—";
  }
};

const daysUntil = (iso: string | null) => {
  if (!iso) return null;
  const diff = new Date(iso).getTime() - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
};

export default function SubscriptionPage() {
  const { subscription, loading, isActive, refresh } = useSubscription();
  const [canceling, setCanceling] = useState(false);
  const navigate = useNavigate();

  const planId = (subscription as any)?.plan_id as string | undefined;
  const planName = planId ? PLAN_LABELS[planId] ?? "Plano KUBOWEB" : "—";
  const planPrice = planId ? PLAN_PRICES[planId] ?? "—" : "—";

  const status = subscription?.status ?? null;
  const willCancel = !!subscription?.cancel_at_period_end;
  const trialing = status === "trialing" ||
    (subscription?.trial_end && new Date(subscription.trial_end) > new Date());

  const statusBadge = useMemo(() => {
    if (!subscription) return { label: "Sem assinatura", variant: "secondary" as const, icon: XCircle };
    if (willCancel) return { label: "Cancelamento agendado", variant: "secondary" as const, icon: CalendarClock };
    if (trialing) return { label: "Período de teste", variant: "default" as const, icon: ShieldAlert };
    if (isActive) return { label: "Ativa", variant: "default" as const, icon: CheckCircle2 };
    if (["canceled", "cancelled"].includes(status ?? "")) {
      return { label: "Cancelada", variant: "destructive" as const, icon: XCircle };
    }
    return { label: status ?? "—", variant: "secondary" as const, icon: ShieldAlert };
  }, [subscription, isActive, willCancel, trialing, status]);

  const StatusIcon = statusBadge.icon;
  const nextChargeDays = daysUntil(subscription?.current_period_end ?? null);

  const handleCancel = async () => {
    setCanceling(true);
    try {
      const { data, error } = await supabase.functions.invoke("mp-cancel-subscription", {});
      if (error) throw new Error(error.message);
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success("Assinatura cancelada", {
        description: `Seu acesso continua ativo até ${formatDate(subscription?.current_period_end ?? null)}.`,
      });
      await refresh();
    } catch (e) {
      toast.error((e as Error).message || "Não foi possível cancelar agora");
    } finally {
      setCanceling(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Assinatura</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gerencie seu plano, acompanhe a próxima cobrança e atualize ou cancele quando quiser.
          </p>
        </div>

        {loading ? (
          <Card>
            <CardContent className="p-6 space-y-3">
              <Skeleton className="h-6 w-48" />
              <Skeleton className="h-4 w-72" />
              <Skeleton className="h-4 w-56" />
            </CardContent>
          </Card>
        ) : !subscription ? (
          <Card>
            <CardHeader>
              <CardTitle>Você ainda não tem uma assinatura ativa</CardTitle>
              <CardDescription>
                Escolha um plano para liberar todas as funcionalidades do KUBOWEB.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={() => navigate("/pricing")}>
                Ver planos <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader className="flex flex-row items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    {planName}
                    <Badge variant={statusBadge.variant} className="gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {statusBadge.label}
                    </Badge>
                  </CardTitle>
                  <CardDescription className="mt-1">{planPrice}</CardDescription>
                </div>
                <CreditCard className="h-5 w-5 text-muted-foreground shrink-0" />
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                      {willCancel ? "Acesso até" : trialing ? "Fim do período de teste" : "Próxima cobrança"}
                    </div>
                    <div className="text-lg font-semibold text-foreground">
                      {formatDate(
                        (trialing && subscription.trial_end) || subscription.current_period_end,
                      )}
                    </div>
                    {nextChargeDays !== null && nextChargeDays >= 0 && (
                      <div className="text-xs text-muted-foreground mt-1">
                        em {nextChargeDays} dia{nextChargeDays === 1 ? "" : "s"}
                      </div>
                    )}
                  </div>
                  <div className="rounded-lg border border-border bg-muted/30 p-4">
                    <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">
                      Forma de pagamento
                    </div>
                    <div className="text-lg font-semibold text-foreground capitalize">
                      {subscription.environment === "live" ? "Mercado Pago" : "Mercado Pago (teste)"}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Cobrança recorrente automática
                    </div>
                  </div>
                </div>

                {willCancel && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">
                    <div className="font-medium text-foreground mb-1">Cancelamento agendado</div>
                    <p className="text-muted-foreground">
                      Sua assinatura foi cancelada e não será renovada. Você continua com acesso
                      completo até{" "}
                      <span className="text-foreground font-medium">
                        {formatDate(subscription.current_period_end)}
                      </span>
                      .
                    </p>
                  </div>
                )}

                {trialing && !willCancel && (
                  <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm">
                    <div className="font-medium text-foreground mb-1">Você está no período de teste gratuito</div>
                    <p className="text-muted-foreground">
                      A primeira cobrança acontecerá automaticamente em{" "}
                      <span className="text-foreground font-medium">
                        {formatDate(subscription.trial_end || subscription.current_period_end)}
                      </span>
                      . Cancele antes para não ser cobrado.
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2 pt-2">
                  <Button onClick={() => navigate("/pricing")}>
                    Trocar de plano
                  </Button>

                  {!willCancel && isActive && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" disabled={canceling}>
                          {canceling ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Cancelando...
                            </>
                          ) : (
                            "Cancelar assinatura"
                          )}
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Cancelar assinatura?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Você não será cobrado novamente. Seu acesso ao KUBOWEB continua até{" "}
                            <span className="font-medium text-foreground">
                              {formatDate(subscription.current_period_end)}
                            </span>
                            . Após essa data, o painel ficará indisponível até você assinar de novo.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Voltar</AlertDialogCancel>
                          <AlertDialogAction onClick={handleCancel}>
                            Sim, cancelar
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Precisa de ajuda?</CardTitle>
                <CardDescription>
                  Entre em contato pelo suporte se tiver qualquer dúvida sobre cobranças,
                  notas fiscais ou reembolso.
                </CardDescription>
              </CardHeader>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}
