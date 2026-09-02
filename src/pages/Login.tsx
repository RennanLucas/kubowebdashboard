import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowRight, BarChart3, Sparkles, Activity, Crown, Flame, FileText, History, Shield, Zap, Globe } from "lucide-react";
import logoKuboweb from "@/assets/logo-kuboweb.png";
import logoKubowebWhite from "@/assets/logo-kuboweb-white.png";
import { getAppUrl } from "@/lib/utils";
import { OTPInput } from "@/components/auth/OTPInput";

type AuthStep = "form" | "otp_signup" | "otp_magiclink" | "otp_recovery" | "reset_password";

/**
 * Traduz falhas de envio de email do Supabase Auth para uma mensagem acionável.
 * O erro cru ("Error sending magic link email") chega em inglês e não diz ao
 * usuário que o problema é do nosso lado, não do email dele.
 */
const describeEmailError = (error: any, fallback: string): string => {
  const raw = String(error?.message ?? "");
  const low = raw.toLowerCase();

  if (low.includes("error sending") || low.includes("smtp")) {
    return "Não conseguimos enviar o email agora (falha no nosso serviço de envio). Entre com email e senha ou tente novamente em alguns minutos.";
  }
  if (low.includes("rate limit") || low.includes("too many")) {
    return "Muitas tentativas em pouco tempo. Aguarde alguns minutos antes de pedir um novo código.";
  }
  return raw || fallback;
};

const Login = () => {
  const navigate = useNavigate();
  const { session, loading: authLoading } = useAuth();
  
  const [step, setStep] = useState<AuthStep>("form");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const isBusy = loading || authLoading;

  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Timer para cooldown de reenvio de OTP
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  // Se já está logado e cai no login, redireciona conforme tem ou não cliente/org
  useEffect(() => {
    if (authLoading || !session?.user || step === "reset_password") return;
    let cancelled = false;
    (async () => {
      const [{ data: client }, { data: orgMember }] = await Promise.all([
        supabase.from("clients").select("id").eq("user_id", session.user.id).limit(1).maybeSingle(),
        supabase.from("organization_members").select("id").eq("user_id", session.user.id).limit(1).maybeSingle()
      ]);
      if (!cancelled) navigate((client || orgMember) ? "/dashboard" : "/onboarding", { replace: true });
    })();
    return () => { cancelled = true; };
  }, [session, authLoading, navigate, step]);

  const handleGoogleAuth = async () => {
    if (isBusy) return;
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${getAppUrl()}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Falha ao iniciar login com Google.");
      setLoading(false);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBusy) return;
    setLoading(true);

    try {
      if (isSignUp) {
        if (!fullName.trim()) {
          toast.error("Por favor, preencha seu nome completo.");
          setLoading(false);
          return;
        }

        if (password !== confirmPassword) {
          toast.error("As senhas não coincidem.");
          setLoading(false);
          return;
        }

        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName.trim() }
          }
        });

        if (error) throw error;

        if (data.session) {
          toast.success("Conta criada com sucesso!");
          navigate("/onboarding");
          return;
        }

        toast.success("Código enviado! Verifique seu email.");
        setStep("otp_signup");
        setResendCooldown(60);
        return;
      }

      // Fluxo de Login
      const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;

      const userId = signInData.user?.id;
      if (userId) {
        const [{ data: client }, { data: orgMember }] = await Promise.all([
          supabase.from("clients").select("id").eq("user_id", userId).limit(1).maybeSingle(),
          supabase.from("organization_members").select("id").eq("user_id", userId).limit(1).maybeSingle()
        ]);
        navigate((client || orgMember) ? "/dashboard" : "/onboarding");
        return;
      }
      navigate("/dashboard");
    } catch (error: any) {
      if (error.message?.includes("already registered") || error.message?.includes("User already registered")) {
        toast.error("Este email já está cadastrado. Tente entrar.");
      } else if (error.message?.includes("Invalid login")) {
        toast.error("E-mail ou senha incorretos.");
      } else {
        toast.error(describeEmailError(error, "Não foi possível concluir."));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMagicLinkAuth = async () => {
    if (!email) {
      toast.error("Digite seu email para receber o código.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
      });
      if (error) throw error;
      toast.success("Código enviado! Verifique seu email.");
      setStep("otp_magiclink");
      setResendCooldown(60);
    } catch (error: any) {
      toast.error(describeEmailError(error, "Falha ao enviar código."));
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (code: string) => {
    if (isBusy) return;
    setLoading(true);
    try {
      // "email" é o type documentado para o código de 6 dígitos do signInWithOtp.
      let otpType: "signup" | "email" | "recovery" = "signup";
      if (step === "otp_magiclink") otpType = "email";
      if (step === "otp_recovery") otpType = "recovery";

      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: code,
        type: otpType,
      });

      if (error) throw error;

      if (data.session || otpType === "recovery") {
        toast.success("E-mail verificado com sucesso!");
        
        if (otpType === "recovery") {
          setStep("reset_password");
          setPassword("");
          setConfirmPassword("");
          return;
        }

        const userId = data.user?.id || data.session?.user?.id;
        if (userId) {
          const [{ data: client }, { data: orgMember }] = await Promise.all([
            supabase.from("clients").select("id").eq("user_id", userId).limit(1).maybeSingle(),
            supabase.from("organization_members").select("id").eq("user_id", userId).limit(1).maybeSingle()
          ]);
          navigate((client || orgMember) ? "/dashboard" : "/onboarding");
          return;
        }
        navigate("/onboarding");
      }
    } catch (error: any) {
      let msg = error.message;
      if (msg.toLowerCase().includes("expired")) {
        msg = "O código expirou. Solicite um novo.";
      } else if (msg.toLowerCase().includes("invalid")) {
        msg = "Código inválido. Verifique o número digitado.";
      }
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resending || resendCooldown > 0) return;
    setResending(true);
    try {
      if (step === "otp_recovery") {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
      } else if (step === "otp_magiclink") {
        const { error } = await supabase.auth.signInWithOtp({ email });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.resend({
          type: "signup",
          email,
        });
        if (error) throw error;
      }
      toast.success("Novo código enviado! Verifique seu email.");
      setResendCooldown(60);
    } catch (err: any) {
      toast.error(describeEmailError(err, "Não foi possível reenviar o código."));
    } finally {
      setResending(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error("Digite seu email primeiro para receber o código de recuperação.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      toast.success("Enviamos um código de recuperação para seu email.");
      setStep("otp_recovery");
      setResendCooldown(60);
    } catch (err: any) {
      toast.error(describeEmailError(err, "Não foi possível enviar o código."));
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("As senhas não coincidem.");
      return;
    }
    if (password.length < 6) {
      toast.error("A senha deve ter no mínimo 6 caracteres.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast.success("Senha atualizada com sucesso!");
      navigate("/dashboard");
    } catch (error: any) {
      toast.error(error.message || "Erro ao atualizar a senha.");
    } finally {
      setLoading(false);
    }
  };

  const renderLeftPanel = () => (
    <div className="hidden lg:flex lg:w-1/2 bg-primary items-center justify-center p-12 relative overflow-hidden">
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
  );

  return (
    <>
      <Helmet>
        <title>{isSignUp ? "Criar conta" : "Entrar"} — KUBOWEB</title>
        <meta name="description" content="Acesse seu painel de analytics e leads da KUBOWEB." />
        <meta property="og:title" content="Entrar — KUBOWEB" />
        <meta property="og:url" content="https://kubowebdashboard.lovable.app/login" />
        <link rel="canonical" href="https://kubowebdashboard.lovable.app/login" />
      </Helmet>
      <div className="min-h-screen flex bg-background">
        
        {renderLeftPanel()}

        <div className="flex-1 flex items-center justify-center p-8 bg-background relative overflow-hidden">
          <div className="absolute inset-0 bg-noise opacity-[0.03] pointer-events-none" />
          <div className="absolute -top-1/4 -right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />
          
          <div className="w-full max-w-md animate-scale-in glass-strong p-8 sm:p-10 rounded-2xl relative z-10 shadow-2xl">
            <div className="mb-8 flex justify-center lg:justify-start">
              <img src={logoKuboweb} alt="KUBOWEB" className="h-10 w-auto dark:hidden block" />
              <img src={logoKubowebWhite} alt="KUBOWEB" className="h-10 w-auto hidden dark:block" />
            </div>

            {step === "reset_password" ? (
              <div className="animate-fade-in space-y-5">
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">
                    Criar nova senha
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Digite sua nova senha abaixo
                  </p>
                </div>
                
                <form onSubmit={handleUpdatePassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">Nova Senha</Label>
                    <div className="relative">
                      <Input
                        id="newPassword"
                        type={showPassword ? "text" : "password"}
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
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmNewPassword">Confirmar Nova Senha</Label>
                    <Input
                      id="confirmNewPassword"
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="focus-ring bg-surface-sunken"
                    />
                  </div>
                  <Button type="submit" className="w-full h-11 text-base font-medium transition-all duration-300 gradient-primary shadow-lg hover:shadow-xl hover:scale-[1.02] overflow-hidden relative group" disabled={isBusy}>
                    {isBusy ? (
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground relative z-10" />
                    ) : (
                      <div className="flex items-center justify-center relative z-10">
                        Atualizar Senha
                      </div>
                    )}
                  </Button>
                </form>
              </div>
            ) : step.startsWith("otp") ? (
              <div className="space-y-6 animate-fade-in">
                <div className="text-center">
                  <h2 className="text-2xl font-bold tracking-tight text-foreground mb-2">
                    Verifique seu e-mail
                  </h2>
                  <p className="text-muted-foreground text-sm">
                    Enviamos um código de 6 dígitos para o e-mail: <br />
                    <span className="font-medium text-foreground">{email}</span>
                  </p>
                </div>
                
                <OTPInput 
                  length={6}
                  loading={loading}
                  resendCooldown={resendCooldown}
                  onComplete={handleVerifyOtp}
                  onResend={handleResendOtp}
                />

                <Button
                  type="button"
                  variant="ghost"
                  className="w-full text-muted-foreground"
                  onClick={() => setStep("form")}
                  disabled={loading}
                >
                  Voltar e alterar e-mail
                </Button>
              </div>
            ) : (
              <div className="animate-fade-in">
                <h2 className="text-3xl font-bold tracking-tight text-foreground mb-2">
                  {isSignUp ? "Criar conta" : "Bem-vindo de volta"}
                </h2>
                <p className="text-muted-foreground mb-8">
                  {isSignUp ? "Comece a acompanhar seu desempenho" : "Entre no seu painel"}
                </p>

                <form onSubmit={handleAuth} className="space-y-5">
                  {isSignUp && (
                    <div className="space-y-2">
                      <Label htmlFor="fullName">Nome Completo</Label>
                      <Input
                        id="fullName"
                        type="text"
                        placeholder="João da Silva"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="focus-ring bg-surface-sunken"
                      />
                    </div>
                  )}

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
                        tabIndex={-1}
                      >
                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </button>
                    </div>
                    {!isSignUp && (
                      <button
                        type="button"
                        onClick={handleForgotPassword}
                        className="text-xs text-primary hover:underline self-end block ml-auto mt-2"
                      >
                        Esqueci minha senha
                      </button>
                    )}
                  </div>

                  {isSignUp && (
                    <div className="space-y-2">
                      <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                      <Input
                        id="confirmPassword"
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        minLength={6}
                        className="focus-ring bg-surface-sunken"
                      />
                    </div>
                  )}

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

                <div className="my-6 flex items-center gap-4">
                  <div className="h-px flex-1 bg-border" />
                  <span className="text-xs text-muted-foreground uppercase tracking-wide">Ou</span>
                  <div className="h-px flex-1 bg-border" />
                </div>

                <div className="space-y-3">
                  {!isSignUp && (
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full h-11 bg-surface-sunken hover:bg-surface-sunken/80 transition-colors border-border"
                      onClick={handleMagicLinkAuth}
                      disabled={isBusy}
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Entrar sem senha (código por e-mail)
                    </Button>
                  )}
                  
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-11 bg-surface-sunken hover:bg-surface-sunken/80 transition-colors border-border"
                    onClick={handleGoogleAuth}
                    disabled={isBusy}
                  >
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continuar com Google
                  </Button>
                </div>

                <p className="text-center text-sm text-muted-foreground mt-8">
                  {isSignUp ? "Já tem uma conta?" : "Não tem uma conta?"}{" "}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignUp(!isSignUp);
                      setStep("form");
                    }}
                    disabled={isBusy}
                    className="text-primary hover:underline font-medium"
                  >
                    {isSignUp ? "Entrar" : "Cadastrar"}
                  </button>
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default Login;
