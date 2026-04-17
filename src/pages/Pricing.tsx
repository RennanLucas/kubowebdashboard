import { useState } from "react";
import { Navigate } from "react-router-dom";
import { Check, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";
import { cn } from "@/lib/utils";

const features = [
  "Rastreamento ilimitado de visitantes",
  "Conversões: WhatsApp, formulários e botões",
  "Múltiplos projetos / sites",
  "Relatórios em PDF",
  "Visitantes em tempo real",
  "Geolocalização e dispositivos",
];

type PlanId = "kuboweb_pro_monthly" | "kuboweb_pro_yearly";

const plans: Array<{
  id: PlanId;
  name: string;
  price: string;
  cadence: string;
  highlight: string;
  note: string;
  badge?: string;
  recommended?: boolean;
}> = [
  {
    id: "kuboweb_pro_monthly",
    name: "Mensal",
    price: "R$ 29,99",
    cadence: "/mês",
    highlight: "7 dias grátis · cancele a qualquer momento",
    note: "É necessário cartão de crédito. Cobrado após 7 dias caso não cancele.",
  },
  {
    id: "kuboweb_pro_yearly",
    name: "Anual à vista",
    price: "R$ 392,99",
    cadence: "/ano",
    highlight: "Pague com Pix ou cartão · sem renovação automática",
    note: "Pagamento único de R$ 392,99 por 12 meses de acesso. Você renova manualmente quando quiser.",
    recommended: true,
  },
];

export default function Pricing() {
  const { user, loading: authLoading } = useAuth();
  const { isActive, loading: subLoading } = useSubscription();
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("kuboweb_pro_yearly");

  if (authLoading || subLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;
  if (isActive) return <Navigate to="/dashboard" replace />;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold text-foreground mb-3">Escolha seu plano KUBOWEB Pro</h1>
          <p className="text-muted-foreground">
            Acesso completo à plataforma. Comece grátis no mensal ou economize com o anual via Pix.
          </p>
        </div>

        <div className="grid lg:grid-cols-[1fr_1fr_1.1fr] gap-6">
          {plans.map((plan) => {
            const isSelected = selectedPlan === plan.id;
            return (
              <button
                key={plan.id}
                type="button"
                onClick={() => setSelectedPlan(plan.id)}
                className={cn(
                  "text-left rounded-xl border bg-card p-8 shadow-sm transition-all",
                  isSelected
                    ? "border-primary ring-2 ring-primary/30 shadow-md"
                    : "border-border hover:border-primary/50",
                )}
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">{plan.name}</h2>
                    <p className="text-sm text-muted-foreground mt-1">KUBOWEB Pro · tudo incluso</p>
                  </div>
                  {plan.badge && (
                    <span className="text-xs font-medium px-2 py-1 rounded-full bg-primary/10 text-primary">
                      {plan.badge}
                    </span>
                  )}
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.cadence}</span>
                  <p className="text-sm text-primary font-medium mt-2">{plan.highlight}</p>
                </div>
                <ul className="space-y-3">
                  {features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <span className="text-foreground">{f}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground mt-6">{plan.note}</p>
              </button>
            );
          })}

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm lg:sticky lg:top-4 h-fit">
            <StripeEmbeddedCheckout
              key={selectedPlan}
              priceId={selectedPlan}
              customerEmail={user.email}
              userId={user.id}
              returnUrl={`${window.location.origin}/checkout/return?session_id={CHECKOUT_SESSION_ID}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
