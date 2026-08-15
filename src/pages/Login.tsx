import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowRight, BarChart3, Users, Target, Zap, Shield, TrendingUp, Globe, Bell, Sparkles, Activity, Crown, Maximize2, Flame, FileText, History } from "lucide-react";
import logoKuboweb from "@/assets/logo-kuboweb.png";
import logoKubowebWhite from "@/assets/logo-kuboweb-white.png";

async function ensureConfirmationEmailSent(email: string, signupStartedAt: string) {
  // Aguarda alguns segundos para o webhook auth-email-hook enfileirar o email.
  // Se nada aparecer no email_send_log, reenviamos via auth.resend como fallback.
  const maxAttempts = 3;
  const delayMs = 2500;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    await new Promise((r) => setTimeout(r, delayMs));

    const { data, error } = await supabase
      .from("email_send_log")
      .select("id, status")
      .eq("recipient_email", email)
      .gte("created_at", signupStartedAt)
      .in("status", ["pending", "sent"])
      .limit(1);

    if (!error && data && data.length > 0) return; // email já enfileirado/enviado
  }

  // Fallback: reenvia explicitamente o email de confirmação
  const { error: resendError } = await supabase.auth.resend({
    type: "signup",
    email,
    options: { emailRedirectTo: window.location.origin },
  });

  if (resendError) {
    console.error("[signup-fallback] resend failed:", resendError);
    toast.error("Não conseguimos confirmar o envio do email. Tente reenviar pela tela de login.");
    return;
  }

  toast.info("Reenviamos o email de confirmação. Verifique sua caixa de entrada e a pasta de spam.");
}

const Login = () => {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isBusy = loading || authLoading;

  // Se já está logado, redireciona conforme tem ou não cliente
  useEffect(() => {
    if (authLoading || !session?.user) return;
    let cancelled = false;
    (async () => {
      const { data: client } = await supabase
        .from("clients")
        .select("id")
        .eq("user_id", session.user.id)
        .limit(1)
        .maybeSingle();
      if (!cancelled) navigate(client ? "/dashboard" : "/onboarding", { replace: true });
    })();
    return () => { cancelled = true; };
  }, [session, authLoading, navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBusy) return;
    setLoading(true);

    try {
      if (isSignUp) {
        const signupStartedAt = new Date().toISOString();
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: window.location.origin },
        });

        if (error) throw error;

        if (data.session) {
          toast.success("Conta criada com sucesso! Você já pode acessar o dashboard.");
          navigate("/onboarding");
          return;
        }

        toast.success("Conta criada! Verifique seu email para confirmar a conta.");

        // Fallback: se o webhook não disparar o email em ~6s, reenviamos via auth.resend
        ensureConfirmationEmailSent(email, signupStartedAt);
        return;
      }

      const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      // Decide rota: se já tem cliente, vai pro dashboard; senão pro onboarding
      const userId = signInData.user?.id;
      if (userId) {
        const { data: client } = await supabase
          .from("clients")
          .select("id")
          .eq("user_id", userId)
          .limit(1)
          .maybeSingle();
        navigate(client ? "/dashboard" : "/onboarding");
        return;
      }
      navigate("/dashboard");
    } catch (error: any) {
      if (error.message?.includes("User already registered")) {
        toast.error("Este email já está cadastrado. Tente entrar.");
      } else {
        toast.error(error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Digite seu email primeiro para receber o link de recuperação.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      toast.success("Enviamos um link de recuperação para seu email.");
    } catch (err: any) {
      toast.error(err.message || "Não foi possível enviar o email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Entrar — KUBOWEB Client Portal</title>
        <meta name="description" content="Acesse seu painel de analytics e leads da KUBOWEB." />
        <meta property="og:title" content="Entrar — KUBOWEB Client Portal" />
        <meta property="og:description" content="Acesse seu painel de analytics e leads da KUBOWEB." />
        <meta property="og:url" content="https://kubowebdashboard.lovable.app/login" />
        <meta property="og:image" content="https://kubowebdashboard.lovable.app/og-image.png" />
        <meta name="twitter:title" content="Entrar — KUBOWEB Client Portal" />
        <meta name="twitter:description" content="Acesse seu painel de analytics e leads da KUBOWEB." />
        <meta name="twitter:image" content="https://kubowebdashboard.lovable.app/og-image.png" />
        <link rel="canonical" href="https://kubowebdashboard.lovable.app/login" />
      </Helmet>
      <div className="min-h-screen flex bg-background">
      {/* Left: Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center p-12 relative overflow-hidden">
        {/* Decorative gradient blobs */}
        <div className="absolute inset-0 bg-grid opacity-10 pointer-events-none" />
        <div className="absolute top-[10%] right-[10%] w-[500px] h-[500px] bg-primary/20 rounded-full blur-[100px] mix-blend-screen animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-[10%] left-[10%] w-[600px] h-[600px] bg-primary-glow/20 rounded-full blur-[120px] mix-blend-screen animate-pulse" style={{ animationDuration: '6s', animationDelay: "1s" }} />

        <div className="max-w-md relative z-10">
          <img
            src={logoKubowebWhite}
            alt="KUBOWEB"
            className="h-12 w-auto mb-6"
          />
          <h1 className="text-primary-foreground text-4xl font-bold tracking-tight leading-tight mb-4 animate-fade-up" style={{ animationDelay: "100ms" }}>
            O painel completo para o desempenho do seu site.
          </h1>
          <p className="text-primary-foreground/80 text-lg leading-relaxed mb-10 animate-fade-up" style={{ animationDelay: "200ms" }}>
            Acompanhe visitantes, monitore leads e tome decisões baseadas em dados — tudo em tempo real, em um só lugar.
          </p>

          {/* Features grid */}
          <div className="grid grid-cols-1 gap-4 mb-10 animate-fade-up stagger-children" style={{ animationDelay: "300ms" }}>
            {[
              { icon: BarChart3, title: "Analytics em tempo real", desc: "Métricas de visitantes e leads 100% sem cookies.", badge: null },
              { icon: Flame, title: "Heatmaps & Replay de Sessões", desc: "Veja a gravação exata de onde os usuários clicam e interagem.", badge: "Pro" },
              { icon: Sparkles, title: "IA & Insights Avançados", desc: "Análises automáticas de otimização via Inteligência Artificial.", badge: "Pro" },
              { icon: FileText, title: "Relatórios White-label", desc: "Exporte PDFs com a sua própria marca para enviar aos clientes.", badge: "Pro" },
              { icon: Activity, title: "Visualização Live", desc: "Acompanhe os usuários navegando no seu site ao vivo na sua tela.", badge: "Pro" },
              { icon: History, title: "Histórico Ilimitado", desc: "Nunca perca dados. Acesse o histórico completo e compare meses.", badge: "Pro" },
            ].map(({ icon: Icon, title, desc, badge }) => (
              <div key={title} className="flex items-start gap-3 p-4 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:bg-white/10 transition-colors relative group overflow-hidden">
                <div className="shrink-0 w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
                  <Icon className="h-5 w-5 text-primary-foreground group-hover:scale-110 transition-transform" />
                </div>
                <div className="flex-1 pr-8">
                  <p className="text-primary-foreground font-medium text-sm flex items-center gap-2">
                    {title}
                  </p>
                  <p className="text-primary-foreground/70 text-xs mt-0.5 leading-relaxed">{desc}</p>
                </div>
                {badge && (
                  <div className="absolute top-4 right-4 flex items-center gap-1 px-1.5 py-0.5 rounded border border-white/20 bg-white/10 shadow-sm backdrop-blur-md">
                    <Crown className="h-3 w-3 text-yellow-400" />
                    <span className="text-[9px] font-bold text-white uppercase tracking-wider">{badge}</span>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Trust badges */}
          <div className="flex items-center gap-6 pt-8 border-t border-white/10 animate-fade-up" style={{ animationDelay: "400ms" }}>
            <div className="flex items-center gap-2 text-primary-foreground/80 text-sm font-medium">
              <Shield className="h-3.5 w-3.5" />
              <span>LGPD compliant</span>
            </div>
            <div className="flex items-center gap-2 text-primary-foreground/80 text-sm font-medium">
              <Zap className="h-4 w-4" />
              <span>Script &lt; 1KB</span>
            </div>
            <div className="flex items-center gap-2 text-primary-foreground/80 text-sm font-medium">
              <Globe className="h-4 w-4" />
              <span>Multi-site</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Form */}
      <div className="flex-1 flex items-center justify-center p-8 bg-background relative overflow-hidden">
        <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />
        <div className="absolute -top-1/4 -right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="w-full max-w-md animate-scale-in glass-strong p-8 sm:p-10 rounded-2xl relative z-10 shadow-2xl">
          <div className="mb-8 flex justify-center lg:justify-start">
            <img src={logoKuboweb} alt="KUBOWEB" className="h-10 w-auto dark:hidden block" />
            <img src={logoKubowebWhite} alt="KUBOWEB" className="h-10 w-auto hidden dark:block" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight text-foreground mb-2">
            {isSignUp ? "Criar conta" : "Bem-vindo de volta"}
          </h2>
          <p className="text-muted-foreground mb-8">
            {isSignUp ? "Comece a acompanhar seu desempenho" : "Entre no seu painel"}
          </p>

          <form onSubmit={handleAuth} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="voce@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="focus-ring bg-surface-sunken"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="focus-ring bg-surface-sunken pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-xs text-primary hover:underline self-end"
                >
                  Esqueci minha senha
                </button>
              )}
            </div>
            <Button type="submit" className="w-full h-11 text-base font-medium transition-all duration-300 gradient-primary shadow-lg hover:shadow-xl hover:scale-[1.02] overflow-hidden relative group" disabled={isBusy}>
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
              {isBusy ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground relative z-10" />
              ) : (
                <div className="flex items-center justify-center relative z-10">
                  {isSignUp ? "Criar Conta" : "Entrar"}
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </div>
              )}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            {isSignUp ? "Já tem uma conta?" : "Não tem uma conta?"}{" "}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              disabled={isBusy}
              className="text-primary hover:underline font-medium"
            >
              {isSignUp ? "Entrar" : "Cadastrar"}
            </button>
          </p>
        </div>
      </div>
    </div>
  </>
  );
};

export default Login;
