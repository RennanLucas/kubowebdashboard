import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { Check, Loader2, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { usePlans } from "@/hooks/usePlans";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn, getAppUrl } from "@/lib/utils";

export default function Pricing() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isActive, subscription, loading: subLoading } = useSubscription();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const { plans, loading: plansLoading, error: plansError } = usePlans();
  const [loadingPlan, setLoadingPlan] = useState<string | null>(null);
  const navigate = useNavigate();

  const currentPlanId = (subscription as any)?.plan_id as string | undefined;

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  if (authLoading || subLoading || adminLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (isActive && !isAdmin) return <Navigate to="/dashboard" replace />;

  const handleCheckout = async (planId: string) => {
    setLoadingPlan(planId);
    try {
      const { data, error } = await supabase.functions.invoke("create-mp-preference", {
        body: {
          planId,
          returnUrl: `${getAppUrl()}/checkout/return`,
        },
      });
      if (error || !data?.url) {
        throw new Error(error?.message || "Falha ao iniciar checkout");
      }
      window.location.href = data.url;
    } catch (e) {
      toast.error((e as Error).message || "Erro ao iniciar checkout");
      setLoadingPlan(null);
    }
  };

  const freePlan = {
    id: "free",
    name: "Gratuito",
    tagline: "Para quem está começando",
    price: "R$ 0,00",
    cadence: "/mês",
    amount: 0,
    currency: "BRL",
    highlight: "Sempre grátis",
    cta: "Plano Atual",
    features: [
      "Até 1 projeto / site",
      "Histórico de 7 dias",
      "Alertas no painel",
      "Sem visitantes em tempo real",
      "Sem resumos com IA",
      "Sem mapas de calor",
      "Sem relatórios em PDF/CSV",
    ],
    recommended: false,
    enabled: true,
    disabledReason: null,
  };

  const displayPlans = plans.length > 0 ? [freePlan, ...plans] : [];

  return (
    <>
      <Helmet>
        <title>Planos — KUBOWEB Pro</title>
        <meta name="description" content="Escolha o plano ideal para acompanhar seu site com analytics e geração de leads." />
        <meta property="og:title" content="Planos — KUBOWEB Pro" />
        <meta property="og:description" content="Escolha o plano ideal para acompanhar seu site com analytics e geração de leads." />
        <meta property="og:url" content="https://kubowebdashboard.lovable.app/pricing" />
        <meta property="og:image" content="https://kubowebdashboard.lovable.app/og-image.png" />
        <meta name="twitter:title" content="Planos — KUBOWEB Pro" />
        <meta name="twitter:description" content="Escolha o plano ideal para acompanhar seu site com analytics e geração de leads." />
        <meta name="twitter:image" content="https://kubowebdashboard.lovable.app/og-image.png" />
        <link rel="canonical" href="https://kubowebdashboard.lovable.app/pricing" />
      </Helmet>
      {plans.length > 0 && (
        <script type="application/ld+json">
          {JSON.stringify(
            displayPlans.map((plan) => ({
              "@context": "https://schema.org",
              "@type": "Product",
              name: `KUBOWEB ${plan.name}`,
              description: plan.tagline,
              brand: { "@type": "Brand", name: "KUBOWEB" },
              offers: {
                "@type": "Offer",
                price: plan.amount,
                priceCurrency: plan.currency,
                availability: "https://schema.org/InStock",
                url: "https://kubowebdashboard.lovable.app/pricing",
              },
            }))
          )}
        </script>
      )}
      <div className="min-h-screen bg-background">
        <div className="border-b bg-card/60 backdrop-blur sticky top-0 z-30">
          <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
                {(user?.email?.[0] ?? "?").toUpperCase()}
              </div>
              <span className="text-sm text-muted-foreground truncate hidden sm:inline">
                Logado como <span className="text-foreground font-medium">{user?.email}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {isActive && (
                <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
                  Voltar ao Dashboard
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={handleSignOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      <div className="max-w-5xl mx-auto px-4 py-12">
        <div className="text-center mb-10 max-w-2xl mx-auto">
          <span className="inline-block text-xs font-medium px-3 py-1 rounded-full bg-primary/10 text-primary mb-4">
            KUBOWEB Pro
          </span>
          <h1 className="text-3xl font-semibold text-foreground mb-3">Escolha seu plano</h1>
          <p className="text-muted-foreground mb-2">
            O KUBOWEB Pro é a plataforma completa de analytics e geração de leads para o seu site:
            acompanhe visitantes em tempo real, conversões de WhatsApp, formulários e botões,
            origem do tráfego, geolocalização e relatórios em PDF — tudo em um painel só.
          </p>
          <p className="text-xs text-muted-foreground">
            Pagamentos processados com segurança pelo Mercado Pago.
          </p>
        </div>

        {plansError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive mb-6">
            Não foi possível carregar os planos no momento. Tente novamente em alguns instantes.
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {plansLoading
            ? Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border bg-card p-8">
                  <Skeleton className="h-6 w-24 mb-4" />
                  <Skeleton className="h-10 w-32 mb-6" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-5/6 mb-2" />
                  <Skeleton className="h-4 w-2/3 mb-6" />
                  <Skeleton className="h-10 w-full" />
                </div>
              ))
            : displayPlans.map((plan) => {
                const isLoading = loadingPlan === plan.id;
                const isCurrent = (plan.id === "free" && !isActive) || (currentPlanId === plan.id && isActive);
                const isFree = plan.id === "free";
                const isDisabled = !plan.enabled || isCurrent || isFree;
                const disabledLabel = isCurrent
                  ? "Plano atual"
                  : !plan.enabled
                    ? plan.disabledReason || "Indisponível no momento"
                    : isFree ? "Plano Atual" : null;

                return (
                  <div
                    key={plan.id}
                    className={cn(
                      "rounded-2xl border bg-card/60 backdrop-blur-xl p-8 shadow-sm transition-all duration-300 flex flex-col relative overflow-hidden",
                      plan.recommended && !isDisabled
                        ? "animated-border-gradient border-border ring-0 shadow-[0_0_40px_-10px_rgba(var(--primary),0.3)] hover:scale-[1.02]"
                        : "border-border hover:-translate-y-1 hover:shadow-lg",
                      isDisabled && "opacity-70",
                    )}
                  >
                    {plan.recommended && !isDisabled && (
                      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                    )}
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-semibold text-foreground">{plan.name}</h2>
                        <p className="text-sm text-muted-foreground mt-1">{plan.tagline}</p>
                      </div>
                      {isCurrent ? (
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary border border-primary/20">
                          Plano atual
                        </span>
                      ) : !plan.enabled ? (
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-muted text-muted-foreground">
                          Indisponível
                        </span>
                      ) : plan.recommended ? (
                        <span className="text-xs font-medium px-3 py-1 rounded-full gradient-primary text-white shadow-lg animate-pulse-soft">
                          Mais escolhido
                        </span>
                      ) : null}
                    </div>
                    <div className="mb-6">
                      <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                      <span className="text-muted-foreground">{plan.cadence}</span>
                      <p className="text-sm text-primary font-medium mt-2">{plan.highlight}</p>
                    </div>
                    <ul className="space-y-3 mb-6 flex-1 stagger-children">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm relative">
                          <div className="h-5 w-5 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                            <Check className="h-3 w-3 text-primary" />
                          </div>
                          <span className="text-foreground">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      size="lg"
                      className={cn("w-full transition-all duration-300 shadow-sm hover:shadow-md", plan.recommended && !isDisabled && "gradient-primary border-0")}
                      variant={plan.recommended ? "default" : "outline"}
                      disabled={isDisabled || isLoading || loadingPlan !== null}
                      onClick={() => handleCheckout(plan.id)}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          Redirecionando...
                        </>
                      ) : isDisabled ? (
                        disabledLabel
                      ) : (
                        plan.cta
                      )}
                    </Button>
                    {!plan.enabled && plan.disabledReason && (
                      <p className="text-xs text-muted-foreground mt-4">{plan.disabledReason}</p>
                    )}
                  </div>
                );
              })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Pagamento 100% seguro processado pelo Mercado Pago.
        </p>
      </div>
    </div>
    </>
  );
}
