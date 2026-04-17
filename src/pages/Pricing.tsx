import { Navigate } from "react-router-dom";
import { Check, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSubscription } from "@/hooks/useSubscription";
import { StripeEmbeddedCheckout } from "@/components/StripeEmbeddedCheckout";

const features = [
  "Rastreamento ilimitado de visitantes",
  "Conversões: WhatsApp, formulários e botões",
  "Múltiplos projetos / sites",
  "Relatórios em PDF",
  "Visitantes em tempo real",
  "Geolocalização e dispositivos",
];

export default function Pricing() {
  const { user, loading: authLoading } = useAuth();
  const { isActive, loading: subLoading } = useSubscription();

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
      <div className="max-w-6xl mx-auto px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-semibold text-foreground mb-3">Comece com 7 dias grátis</h1>
          <p className="text-muted-foreground">
            Acesso completo ao KUBOWEB Pro. Cancele quando quiser durante o trial sem ser cobrado.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          <div className="rounded-xl border border-border bg-card p-8 shadow-sm">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-foreground">KUBOWEB Pro</h2>
              <p className="text-sm text-muted-foreground mt-1">Plano único — tudo incluso</p>
            </div>
            <div className="mb-6">
              <span className="text-4xl font-bold text-foreground">R$ 29,99</span>
              <span className="text-muted-foreground">/mês</span>
              <p className="text-sm text-primary font-medium mt-2">7 dias grátis · cancele a qualquer momento</p>
            </div>
            <ul className="space-y-3">
              {features.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <Check className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                  <span className="text-foreground">{f}</span>
                </li>
              ))}
            </ul>
            <p className="text-xs text-muted-foreground mt-6">
              É necessário cartão de crédito. Você só será cobrado após os 7 dias caso não cancele.
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <StripeEmbeddedCheckout
              priceId="kuboweb_pro_monthly"
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
