import { useEffect, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, AlertCircle, ArrowLeft, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";
import { useAuth } from "@/contexts/AuthContext";

export default function CheckoutReturn() {
  const [params] = useSearchParams();
  const status = params.get("status") || params.get("collection_status");
  const { refresh, isActive } = useSubscription();
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const [waited, setWaited] = useState(false);

  useEffect(() => {
    const timers = [
      setTimeout(() => refresh(), 1500),
      setTimeout(() => refresh(), 4000),
      setTimeout(() => refresh(), 8000),
      setTimeout(() => setWaited(true), 10000),
    ];
    return () => timers.forEach(clearTimeout);
  }, [refresh]);

  const isFailure = status === "failure" || status === "rejected";

  const handleSignOut = async () => {
    await signOut();
    navigate("/login", { replace: true });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header com botão de sair sempre disponível */}
      <header className="border-b bg-card/60 backdrop-blur">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/pricing">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar para os planos
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          {isActive ? (
            <>
              <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" />
              <h1 className="text-2xl font-semibold text-foreground mb-2">Plano ativado!</h1>
              <p className="text-muted-foreground mb-6">
                Tudo certo — você já pode acessar o KUBOWEB Pro.
              </p>
              <Button asChild>
                <Link to="/dashboard">Ir para o Dashboard</Link>
              </Button>
            </>
          ) : isFailure ? (
            <>
              <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
              <h1 className="text-xl font-semibold text-foreground mb-2">Pagamento não concluído</h1>
              <p className="text-sm text-muted-foreground mb-6">
                O pagamento foi recusado ou cancelado. Você pode tentar novamente ou voltar para escolher outro plano.
              </p>
              <div className="flex flex-col sm:flex-row gap-2 justify-center">
                <Button asChild>
                  <Link to="/pricing">Tentar novamente</Link>
                </Button>
                <Button variant="outline" onClick={handleSignOut}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair da conta
                </Button>
              </div>
            </>
          ) : (
            <>
              <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
              <h1 className="text-xl font-semibold text-foreground mb-2">
                {waited ? "Confirmando assinatura..." : "Processando pagamento..."}
              </h1>
              <p className="text-sm text-muted-foreground">
                Aguarde alguns segundos enquanto o Mercado Pago confirma sua compra.
              </p>
              {waited && (
                <div className="flex flex-col sm:flex-row gap-2 justify-center mt-6">
                  <Button variant="outline" onClick={() => refresh()}>
                    Verificar novamente
                  </Button>
                  <Button variant="ghost" asChild>
                    <Link to="/pricing">Voltar para os planos</Link>
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
