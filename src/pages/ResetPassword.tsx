import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import logoKuboweb from "@/assets/logo-kuboweb.png";

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [validLink, setValidLink] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const markValid = () => {
      if (!cancelled) {
        setValidLink(true);
        setReady(true);
      }
    };
    const finish = () => {
      if (!cancelled) setReady(true);
    };

    // 1) Listener para PASSWORD_RECOVERY (formato hash legado)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") markValid();
      else if (session && window.location.hash.includes("type=recovery")) markValid();
    });

    // 2) Trata o formato novo (PKCE): ?code=...
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const hasRecoveryHash =
      window.location.hash.includes("type=recovery") ||
      window.location.hash.includes("access_token");

    (async () => {
      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          window.history.replaceState({}, "", window.location.pathname);
          markValid();
          return;
        }

        const { data: { session } } = await supabase.auth.getSession();
        if (session && hasRecoveryHash) {
          markValid();
          return;
        }

        // Pequeno delay para o listener disparar antes de declarar inválido
        setTimeout(() => finish(), 800);
      } catch (err) {
        console.error("[reset-password] code exchange failed:", err);
        finish();
      }
    })();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    if (password !== confirm) {
      toast.error("As senhas não coincidem.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Senha redefinida com sucesso!");
      await supabase.auth.signOut();
      navigate("/login", { replace: true });
    } catch (err: any) {
      toast.error(err.message || "Não foi possível redefinir a senha.");
    } finally {
      setLoading(false);
    }
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <img src={logoKuboweb} alt="KUBOWEB" className="h-10 w-auto" />
        </div>
        <h2 className="text-2xl font-semibold text-foreground mb-1 text-center">
          Redefinir senha
        </h2>
        <p className="text-muted-foreground mb-8 text-center">
          {validLink
            ? "Escolha uma nova senha para sua conta."
            : "Link inválido ou expirado. Solicite um novo email de recuperação."}
        </p>

        {validLink ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nova senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmar nova senha</Label>
              <Input
                id="confirm"
                type={show ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={6}
                placeholder="••••••••"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  Redefinir senha
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>
        ) : (
          <Button className="w-full" onClick={() => navigate("/login")}>
            Voltar para login
          </Button>
        )}
      </div>
    </div>
  );
};

export default ResetPassword;
