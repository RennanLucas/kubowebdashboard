// Creates organization invite with secure token generation
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { corsHeaders } from "../_shared/cors.ts";
import { checkRateLimit, rateLimitResponse } from "../_shared/rate-limit.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_ANON = Deno.env.get("SUPABASE_ANON_KEY")!;

// Validação pragmática de formato (não RFC 5322 completa): um @, sem espaços,
// domínio com ponto. Suficiente para rejeitar entrada obviamente inválida.
const EMAIL_RE = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return json({ error: "Unauthorized" }, 401);
    }

    const token = authHeader.replace("Bearer ", "");

    // Rate limiting: 10 req/min por usuário (evita spam de convites)
    const rateCheck = checkRateLimit(token, 10, "user");
    if (!rateCheck.allowed) {
      return rateLimitResponse(rateCheck.resetAt, corsHeaders, 10);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !user) return json({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => ({}));
    const { organizationId, email, role } = body;

    if (!organizationId || !email || !role) {
      return json({ error: "organizationId, email, and role are required" }, 400);
    }

    if (typeof email !== "string") {
      return json({ error: "Invalid email" }, 400);
    }

    // Normaliza antes de validar para que o valor checado seja o mesmo gravado.
    const normalizedEmail = email.trim().toLowerCase();

    // `email` cai numa coluna TEXT sem CHECK e é usado depois como chave de
    // busca em accept_invite. Sem limite de tamanho/formato dá para gravar
    // megabytes de lixo ou um valor que nunca casaria com um usuário real.
    if (normalizedEmail.length > 254 || !EMAIL_RE.test(normalizedEmail)) {
      return json({ error: "Invalid email" }, 400);
    }

    if (!["owner", "admin", "editor", "viewer"].includes(role)) {
      return json({ error: "Invalid role" }, 400);
    }

    // Verify user has permission (owner or admin)
    const { data: memberData, error: memberErr } = await supabase
      .from("organization_members")
      .select("role")
      .eq("organization_id", organizationId)
      .eq("user_id", user.id)
      .single();

    if (memberErr || !memberData || !["owner", "admin"].includes(memberData.role)) {
      return json({ error: "Acesso negado. Apenas owners e admins podem convidar membros." }, 403);
    }

    // Admin cannot invite owners (enforced by trigger but check here too)
    if (memberData.role === "admin" && role === "owner") {
      return json({ error: "Admins cannot invite owners" }, 403);
    }

    // Generate secure random token (32 bytes = 256 bits)
    const tokenBytes = new Uint8Array(32);
    crypto.getRandomValues(tokenBytes);
    const token_plain = Array.from(tokenBytes, byte => byte.toString(16).padStart(2, '0')).join('');

    // Hash the token for storage
    const encoder = new TextEncoder();
    const data = encoder.encode(token_plain);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const token_hash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');

    // Set expiration to 7 days from now
    const expires_at = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

    // Insert invite
    const { data: inviteData, error: insertErr } = await supabase
      .from("organization_invites")
      .insert({
        organization_id: organizationId,
        email: normalizedEmail,
        role,
        token_hash,
        invited_by: user.id,
        expires_at,
        status: "pending"
      })
      .select("id")
      .single();

    if (insertErr) {
      // Não devolve a mensagem do Postgres (vaza nomes de constraint/coluna).
      console.error("create-invite insert error:", insertErr);
      return json({ error: "Falha ao criar convite" }, 500);
    }

    // TODO: Send email with token_plain via process-email-queue or direct email service
    // For now, return success without email (will be implemented in future iteration)

    return json({
      success: true,
      inviteId: inviteData.id,
    });

  } catch (e) {
    console.error("create-invite error:", e);
    return json({ error: "Internal server error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
