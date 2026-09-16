import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { clearPendingInvite, rememberInvite, validInviteToken } from "@/lib/pending-invite";

export default function AcceptInvite() {
  const { session, loading } = useAuth();
  const { setOrganization } = useOrganization();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const token = new URLSearchParams(location.hash.slice(1)).get("token")
    || new URLSearchParams(location.search).get("token");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const valid = validInviteToken(token);

  const accept = async () => {
    if (!valid || busy || !session) return;
    setBusy(true);
    setError("");
    try {
      const { data, error: rpcError } = await supabase.rpc("accept_invite_token", { invite_token: token });
      if (rpcError || !data) throw rpcError || new Error("Invalid invite");
      clearPendingInvite();
      await queryClient.invalidateQueries({ queryKey: ["organizations", session.user.id] });
      setOrganization(data);
      navigate("/dashboard", { replace: true });
    } catch {
      setError("Não foi possível aceitar. Confira se entrou com o e-mail convidado e se o convite não expirou ou foi revogado.");
    } finally { setBusy(false); }
  };
  return (
    <main className="min-h-screen bg-background flex items-center justify-center p-6">
      <Helmet><title>Convite para a equipe — KUBOWEB</title><meta name="referrer" content="no-referrer" /><meta name="robots" content="noindex" /></Helmet>
      <section className="w-full max-w-lg rounded-2xl border bg-card p-8 space-y-5">
        <h1 className="text-2xl font-semibold">Convite para a equipe</h1>
        {!valid ? <p role="alert">Este link de convite é inválido. Peça um novo link ao administrador da equipe.</p>
          : loading ? <p role="status">Verificando sua sessão…</p>
          : !session ? <>
            <p>Entre ou crie sua conta com o e-mail que recebeu o convite. Depois, confirme sua participação.</p>
            <Button asChild><Link to="/login" onClick={() => rememberInvite(token)}>Entrar para continuar</Link></Button>
          </> : <>
            <p>Você está conectado como <strong className="break-all">{session.user.email}</strong>. Confirme para participar da equipe que enviou o convite.</p>
            {error && <p role="alert" className="text-destructive">{error}</p>}
            <Button onClick={accept} disabled={busy}>{busy ? "Aceitando…" : "Aceitar convite"}</Button>
          </>}
        <Link className="block text-sm text-primary underline" to="/dashboard">Voltar ao painel</Link>
      </section>
    </main>
  );
}
