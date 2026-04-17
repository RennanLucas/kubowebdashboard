import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/useSubscription";

export default function CheckoutReturn() {
  const [params] = useSearchParams();
  const sessionId = params.get("session_id");
  const { refresh, isActive } = useSubscription();
  const [waited, setWaited] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => refresh(), 1500);
    const t2 = setTimeout(() => refresh(), 4000);
    const t3 = setTimeout(() => setWaited(true), 6000);
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, [refresh]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        {isActive ? (
          <>
            <CheckCircle2 className="h-16 w-16 text-primary mx-auto mb-4" />
            <h1 className="text-2xl font-semibold text-foreground mb-2">Trial ativado!</h1>
            <p className="text-muted-foreground mb-6">
              Seus 7 dias grátis começaram. Aproveite o KUBOWEB Pro.
            </p>
            <Button asChild>
              <Link to="/dashboard">Ir para o Dashboard</Link>
            </Button>
          </>
        ) : (
          <>
            <Loader2 className="h-12 w-12 text-primary mx-auto mb-4 animate-spin" />
            <h1 className="text-xl font-semibold text-foreground mb-2">
              {waited ? "Confirmando assinatura..." : "Processando pagamento..."}
            </h1>
            <p className="text-sm text-muted-foreground">
              {sessionId ? `Sessão: ${sessionId.slice(0, 20)}...` : "Aguarde alguns segundos."}
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
