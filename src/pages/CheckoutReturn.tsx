import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";

export default function CheckoutReturn() {
  const [params] = useSearchParams();
  const status = params.get("status") || params.get("collection_status");
  const { refresh, isActive } = useSubscription();
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
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
              O pagamento foi recusado ou cancelado. Você pode tentar novamente.
            </p>
            <Button asChild>
              <Link to="/pricing">Voltar para os planos</Link>
            </Button>
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
              <Button variant="outline" className="mt-6" onClick={() => refresh()}>
                Verificar novamente
              </Button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
