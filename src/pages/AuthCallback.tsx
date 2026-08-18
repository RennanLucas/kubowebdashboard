import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const processAuth = async () => {
      try {
        // Obter a sessão resultante do redirecionamento
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) throw sessionError;
        
        if (!session?.user) {
          throw new Error("Sessão não encontrada. Por favor, faça login novamente.");
        }

        const userId = session.user.id;

        // Verificar se já possui organização ou cliente
        const [{ data: client }, { data: orgMember }] = await Promise.all([
          supabase.from("clients").select("id").eq("user_id", userId).limit(1).maybeSingle(),
          supabase.from("organization_members").select("id").eq("user_id", userId).limit(1).maybeSingle()
        ]);

        if (cancelled) return;

        // Redireciona de acordo com o resultado
        if (client || orgMember) {
          navigate("/dashboard", { replace: true });
        } else {
          navigate("/onboarding", { replace: true });
        }
      } catch (err: any) {
        if (!cancelled) {
          console.error("[AuthCallback] Error processing auth:", err);
          setError(err.message || "Ocorreu um erro ao processar sua autenticação.");
          toast.error("Erro na autenticação. Redirecionando para login...");
          setTimeout(() => {
            if (!cancelled) navigate("/login", { replace: true });
          }, 3000);
        }
      }
    };

    processAuth();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <>
      <Helmet>
        <title>Autenticando — KUBOWEB</title>
      </Helmet>
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          {error ? (
            <div className="text-destructive max-w-sm px-6">
              <p className="font-medium mb-2">Ops!</p>
              <p className="text-sm text-muted-foreground">{error}</p>
            </div>
          ) : (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
              <h2 className="text-xl font-semibold text-foreground">
                Autenticando...
              </h2>
              <p className="text-sm text-muted-foreground">
                Aguarde um momento enquanto preparamos seu painel.
              </p>
            </>
          )}
        </div>
      </div>
    </>
  );
}
