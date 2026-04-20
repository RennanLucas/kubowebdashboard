import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Check, Loader2, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const baseFeatures = [
  "Rastreamento ilimitado de visitantes",
  "Conversões: WhatsApp, formulários e botões",
  "Visitantes em tempo real",
  "Geolocalização e dispositivos",
  "Relatórios em PDF sob demanda",
  "Até 3 projetos / sites",
  "Histórico de 3 meses",
  "3 resumos com IA por mês",
];

const proPlusFeatures = [
  "Tudo do plano Pro, e mais:",
  "6 resumos com IA por mês (o dobro)",
  "Alertas inteligentes por email (quedas e metas)",
  "Projetos / sites ilimitados",
  "Histórico estendido de 12 meses",
  "Suporte prioritário",
];

type PlanId = "kuboweb_pro_monthly" | "kuboweb_pro_plus_monthly";

const plans: Array<{
  id: PlanId;
  name: string;
  price: string;
  cadence: string;
  highlight: string;
  note: string;
  cta: string;
  features: string[];
  recommended?: boolean;
}> = [
  {
    id: "kuboweb_pro_monthly",
    name: "Pro",
    price: "R$ 29,99",
    cadence: "/mês",
    highlight: "7 dias grátis · cancele a qualquer momento",
    note: "Cobrança recorrente no cartão. Após os 7 dias grátis, R$ 29,99/mês até cancelar.",
    cta: "Começar 7 dias grátis",
    features: baseFeatures,
  },
  {
    id: "kuboweb_pro_plus_monthly",
    name: "Pro+",
    price: "R$ 49,99",
    cadence: "/mês",
    highlight: "7 dias grátis · tudo incluso, sem limites",
    note: "Cobrança recorrente no cartão. Após os 7 dias grátis, R$ 49,99/mês até cancelar.",
    cta: "Começar 7 dias grátis",
    features: proPlusFeatures,
    recommended: true,
  },
];

export default function Pricing() {
  const { user, loading: authLoading, signOut } = useAuth();
  const { isActive, loading: subLoading } = useSubscription();
  const { isAdmin, loading: adminLoading } = useIsAdmin();
  const [loadingPlan, setLoadingPlan] = useState<PlanId | null>(null);
  const navigate = useNavigate();

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

  const handleCheckout = async (planId: PlanId) => {
    setLoadingPlan(planId);
    try {
      const { data, error } = await supabase.functions.invoke("create-mp-preference", {
        body: {
          planId,
          returnUrl: `${window.location.origin}/checkout/return`,
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

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card/60 backdrop-blur sticky top-0 z-30">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="h-7 w-7 rounded-md bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0">
              {(user?.email?.[0] ?? "?").toUpperCase()}
            </div>
            <span className="text-sm text-muted-foreground truncate">
              Logado como <span className="text-foreground font-medium">{user?.email}</span>
            </span>
          </div>
          <Button variant="outline" size="sm" onClick={handleSignOut} className="shrink-0">
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
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

        <div className="grid md:grid-cols-2 gap-6">
          {plans.map((plan) => {
            const isLoading = loadingPlan === plan.id;
            return (
              <div
                key={plan.id}
                className={cn(
                  "rounded-xl border bg-card p-8 shadow-sm transition-all flex flex-col",
                  plan.recommended ? "border-primary ring-2 ring-primary/30" : "border-border",
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">{plan.name}</h2>
                    <p className="text-sm text-muted-foreground mt-1">KUBOWEB Pro · tudo incluso</p>
                  </div>
                  {plan.recommended && (
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                      Mais escolhido
                    </span>
                  )}
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.cadence}</span>
                  <p className="text-sm text-primary font-medium mt-2">{plan.highlight}</p>
                </div>
                <ul className="space-y-3 mb-6 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  size="lg"
                  className="w-full"
                  disabled={isLoading || loadingPlan !== null}
                  onClick={() => handleCheckout(plan.id)}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Redirecionando...
                    </>
                  ) : (
                    plan.cta
                  )}
                </Button>
                <p className="text-xs text-muted-foreground mt-4">{plan.note}</p>
              </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Pagamento 100% seguro processado pelo Mercado Pago.
        </p>
      </div>
    </div>
  );
}
