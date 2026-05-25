import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Eye, EyeOff, ArrowRight, Loader2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import logoKuboweb from "@/assets/logo-kuboweb.png";

// Schema de validação da nova senha
const passwordSchema = z
  .object({
    password: z
      .string()
      .min(8, { message: "A senha deve ter no mínimo 8 caracteres." })
      .max(72, { message: "A senha deve ter no máximo 72 caracteres." })
      .regex(/[A-Za-z]/, { message: "Inclua pelo menos uma letra." })
      .regex(/[0-9]/, { message: "Inclua pelo menos um número." }),
    confirm: z.string(),
  })
  .refine((d) => d.password === d.confirm, {
    path: ["confirm"],
    message: "As senhas não coincidem.",
  });

const emailSchema = z
  .string()
  .trim()
  .email({ message: "Informe um email válido." })
  .max(255, { message: "Email muito longo." });

const ResetPassword = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const [validLink, setValidLink] = useState(false);
  const [errorReason, setErrorReason] = useState<string | null>(null);
  const [resendOpen, setResendOpen] = useState(false);
  const [resendEmail, setResendEmail] = useState("");
  const [resending, setResending] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  // Cooldown timer para evitar spam de reenvios
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = emailSchema.safeParse(resendEmail);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Email inválido.");
      return;
    }
    setResending(true);
    try {
      const redirectTo = `${window.location.origin}/reset-password`;
      const { error } = await supabase.auth.resetPasswordForEmail(parsed.data, { redirectTo });
      if (error) throw error;
      toast.success("Enviamos um novo link de recuperação. Verifique seu email.");
      setResendCooldown(60);
      setResendOpen(false);
    } catch (err: any) {
      toast.error(mapAuthError(err?.message || "") || "Não foi possível enviar o email.");
    } finally {
      setResending(false);
    }
  };


  // Mapeia mensagens técnicas do Supabase para mensagens amigáveis em PT-BR
  const mapAuthError = (raw: string): string => {
    const msg = (raw || "").toLowerCase();
    if (msg.includes("expired") || msg.includes("expirou"))
      return "Este link de recuperação expirou. Solicite um novo email para redefinir sua senha.";
    if (msg.includes("invalid") && (msg.includes("code") || msg.includes("token") || msg.includes("grant")))
      return "Código de recuperação inválido. O link pode já ter sido usado. Solicite um novo email.";
    if (msg.includes("already") && msg.includes("used"))
      return "Este link já foi utilizado. Solicite um novo email de recuperação.";
    if (msg.includes("otp") && msg.includes("expired"))
      return "O código de verificação expirou. Solicite um novo email de recuperação.";
    if (msg.includes("rate") || msg.includes("too many"))
      return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
    if (msg.includes("network") || msg.includes("failed to fetch"))
      return "Erro de conexão. Verifique sua internet e tente novamente.";
    if (msg.includes("flow_state") || msg.includes("pkce"))
      return "Sessão de recuperação não encontrada. O link pode ter sido aberto em outro navegador. Abra o link diretamente do email neste mesmo dispositivo.";
    return raw || "Não foi possível validar o link de recuperação.";
  };

  useEffect(() => {
    let cancelled = false;

    const markValid = () => {
      if (!cancelled) {
        setValidLink(true);
        setErrorReason(null);
        setReady(true);
      }
    };
    const failWith = (reason: string) => {
      if (!cancelled) {
        setErrorReason(reason);
        setValidLink(false);
        setReady(true);
      }
    };

    // 1) Listener para PASSWORD_RECOVERY (formato hash legado)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY") markValid();
      else if (session && window.location.hash.includes("type=recovery")) markValid();
    });

    // 2) Trata o formato novo (PKCE): ?code=...
    const url = new URL(window.location.href);
    const code = url.searchParams.get("code");
    const errParam = url.searchParams.get("error_description") || url.searchParams.get("error");
    const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
    const hashErr = hashParams.get("error_description") || hashParams.get("error");
    const hasRecoveryHash =
      window.location.hash.includes("type=recovery") ||
      window.location.hash.includes("access_token");

    (async () => {
      try {
        // Erro vindo direto do Supabase na URL
        if (errParam || hashErr) {
          failWith(mapAuthError(decodeURIComponent(errParam || hashErr || "")));
          return;
        }

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
        setTimeout(() => {
          if (!cancelled && !validLink) {
            failWith(
              !code && !hasRecoveryHash
                ? "Link de recuperação ausente ou incompleto. Acesse a página através do link recebido por email."
                : "Não foi possível validar o link de recuperação. Ele pode ter expirado ou já ter sido usado."
            );
          }
        }, 800);
      } catch (err: any) {
        console.error("[reset-password] code exchange failed:", err);
        failWith(mapAuthError(err?.message || ""));
      }
    })();

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  // Validações em tempo real
  const checks = useMemo(
    () => ({
      length: password.length >= 8,
      letter: /[A-Za-z]/.test(password),
      number: /[0-9]/.test(password),
      match: password.length > 0 && password === confirm,
    }),
    [password, confirm]
  );

  const isFormValid = checks.length && checks.letter && checks.number && checks.match;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = passwordSchema.safeParse({ password, confirm });
    if (!result.success) {
      toast.error(result.error.issues[0]?.message || "Dados inválidos.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: result.data.password });
      if (error) throw error;
      toast.success("Senha redefinida com sucesso!");
      await supabase.auth.signOut();
      navigate("/login", { replace: true });
    } catch (err: any) {
      toast.error(mapAuthError(err?.message || "") || "Não foi possível redefinir a senha.");
    } finally {
      setLoading(false);
    }
  };

  const Requirement = ({ ok, label }: { ok: boolean; label: string }) => (
    <li className={cn("flex items-center gap-2 text-xs", ok ? "text-primary" : "text-muted-foreground")}>
      {ok ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
      <span>{label}</span>
    </li>
  );

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Recuperar senha — KUBOWEB</title>
        <meta name="description" content="Redefina sua senha de acesso ao KUBOWEB Client Portal." />
        <meta property="og:title" content="Recuperar senha — KUBOWEB" />
        <meta property="og:description" content="Redefina sua senha de acesso ao KUBOWEB Client Portal." />
        <meta property="og:url" content="https://kubowebdashboard.lovable.app/reset-password" />
        <meta property="og:image" content="https://kubowebdashboard.lovable.app/og-image.png" />
        <meta name="twitter:title" content="Recuperar senha — KUBOWEB" />
        <meta name="twitter:description" content="Redefina sua senha de acesso ao KUBOWEB Client Portal." />
        <meta name="twitter:image" content="https://kubowebdashboard.lovable.app/og-image.png" />
        <link rel="canonical" href="https://kubowebdashboard.lovable.app/reset-password" />
      </Helmet>
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
            : errorReason || "Não foi possível validar o link de recuperação."}
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
                  minLength={8}
                  maxLength={72}
                  autoComplete="new-password"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShow(!show)}
                  aria-label={show ? "Ocultar senha" : "Mostrar senha"}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <ul className="mt-2 space-y-1">
                <Requirement ok={checks.length} label="Mínimo de 8 caracteres" />
                <Requirement ok={checks.letter} label="Pelo menos uma letra" />
                <Requirement ok={checks.number} label="Pelo menos um número" />
              </ul>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirmar nova senha</Label>
              <Input
                id="confirm"
                type={show ? "text" : "password"}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
                placeholder="••••••••"
                aria-invalid={confirm.length > 0 && !checks.match}
                className={cn(
                  confirm.length > 0 && !checks.match && "border-destructive focus-visible:ring-destructive"
                )}
              />
              {confirm.length > 0 && !checks.match && (
                <p className="text-xs text-destructive">As senhas não coincidem.</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={loading || !isFormValid}>
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
          <div className="space-y-3">
            {!resendOpen ? (
              <>
                <Button
                  className="w-full"
                  onClick={() => setResendOpen(true)}
                  disabled={resendCooldown > 0}
                >
                  {resendCooldown > 0
                    ? `Aguarde ${resendCooldown}s para reenviar`
                    : "Reenviar link de recuperação"}
                </Button>
                <Button variant="outline" className="w-full" onClick={() => navigate("/login")}>
                  Voltar para login
                </Button>
              </>
            ) : (
              <form onSubmit={handleResend} className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor="resend-email">Seu email</Label>
                  <Input
                    id="resend-email"
                    type="email"
                    value={resendEmail}
                    onChange={(e) => setResendEmail(e.target.value)}
                    placeholder="voce@exemplo.com"
                    autoComplete="email"
                    maxLength={255}
                    required
                    autoFocus
                  />
                </div>
                <Button type="submit" className="w-full" disabled={resending}>
                  {resending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Enviar novo link"
                  )}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="w-full"
                  onClick={() => setResendOpen(false)}
                  disabled={resending}
                >
                  Cancelar
                </Button>
              </form>
            )}
          </div>
        )}
      </div>
    </div>
  </>
  );
};

export default ResetPassword;
