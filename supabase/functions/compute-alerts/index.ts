import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BREVO_SMTP_KEY = Deno.env.get("BREVO_SMTP_KEY");
const BREVO_FROM_EMAIL = Deno.env.get("BREVO_FROM_EMAIL") ?? "no-reply@kuboweb.com";

async function sendEmail(to: string, subject: string, html: string) {
  if (!BREVO_SMTP_KEY) {
    console.warn("BREVO_SMTP_KEY não configurada â€” email não enviado");
    return;
  }
  try {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "api-key": BREVO_SMTP_KEY,
      },
      body: JSON.stringify({
        sender: { name: "KUBOWEB Alertas", email: BREVO_FROM_EMAIL },
        to: [{ email: to }],
        subject,
        htmlContent: html,
      }),
    });
    if (!res.ok) {
      const t = await res.text();
      console.error("Brevo send failed", res.status, t);
    }
  } catch (e) {
    console.error("Brevo send exception", e);
  }
}

function alertEmailHtml(opts: { title: string; message: string; projectName: string }) {
  return `<!doctype html><html><body style="font-family:Arial,sans-serif;background:#f8f9fb;padding:24px;color:#0f1117">
  <div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:28px;border:1px solid #e5e7eb">
    <div style="font-size:12px;color:#6366f1;font-weight:600;letter-spacing:0.04em;text-transform:uppercase">KUBOWEB Pro Â· Alerta inteligente</div>
    <h1 style="font-size:20px;margin:8px 0 12px;color:#0f1117">${opts.title}</h1>
    <p style="font-size:14px;color:#374151;line-height:1.5;margin:0 0 16px">${opts.message}</p>
    <div style="font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb;padding-top:14px;margin-top:18px">
      Projeto: <strong style="color:#0f1117">${opts.projectName}</strong>
    </div>
    <a href="https://cubie-dash.lovable.app/alerts" style="display:inline-block;margin-top:18px;background:#6366f1;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:500">Ver no painel</a>
    <p style="font-size:11px;color:#9ca3af;margin-top:24px">Você recebeu este email porque sua organização assina o plano Pro. Para ajustar alertas, acesse Configurações.</p>
  </div></body></html>`;
}

function parseJwtClaims(token: string): Record<string, unknown> | null {
  const parts = token.split(".");
  if (parts.length < 2) return null;
  try {
    const payload = parts[1]
      .replaceAll("-", "+")
      .replaceAll("_", "/")
      .padEnd(Math.ceil(parts[1].length / 4) * 4, "=");
    return JSON.parse(atob(payload)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function isAuthorized(req: Request): boolean {
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  if (!token) return false;

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (serviceKey && token === serviceKey) return true;

  const claims = parseJwtClaims(token);
  return claims?.role === "service_role";
}

// Fonte única para checagem de plano
const getOrgPlanStatus = async (supabase: any, orgId: string) => {
  // 1. Assinatura pela organização
  const { data: orgSub } = await supabase
    .from("subscriptions")
    .select("plan_id, status, current_period_end")
    .eq("organization_id", orgId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const planActive = (sub: any) => {
    const okStatus = sub && ["active", "trialing", "authorized", "approved"].includes(sub.status);
    const periodOk = !sub?.current_period_end || new Date(sub.current_period_end) > new Date();
    return okStatus && periodOk;
  };

  const isPro = (sub: any) => sub?.plan_id === "kuboweb_pro_plus_monthly" || sub?.plan_id === "kuboweb_pro_monthly";

  if (orgSub) {
    return isPro(orgSub) && planActive(orgSub);
  }

  // 2. Fallback: Procura o owner e checa a assinatura antiga dele
  const { data: memberships } = await supabase
    .from("organization_members")
    .select("user_id, role")
    .eq("organization_id", orgId);
  
  if (memberships) {
    const owner = memberships.find((m: any) => m.role === "owner");
    if (owner) {
      const { data: ownerSub } = await supabase
        .from("subscriptions")
        .select("plan_id, status, current_period_end")
        .eq("user_id", owner.user_id)
        .is("organization_id", null)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      
      if (ownerSub && isPro(ownerSub) && planActive(ownerSub)) {
        return true;
      }
    }
  }
  return false;
};

async function getAdminEmailsForOrg(supabase: SupabaseClient, orgId: string): Promise<string[]> {
  const { data: members } = await supabase
    .from("organization_members")
    .select("user_id")
    .eq("organization_id", orgId)
    .in("role", ["owner", "admin"]);

  if (!members || members.length === 0) return [];

  const emails: string[] = [];
  for (const m of members) {
    const { data: u } = await supabase.auth.admin.getUserById(m.user_id);
    if (u?.user?.email) emails.push(u.user.email);
  }
  return emails;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  if (!isAuthorized(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  );

  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yStart = new Date(yesterday); yStart.setHours(0, 0, 0, 0);
  const yEnd = new Date(yesterday); yEnd.setHours(23, 59, 59, 999);
  const sevenAgo = new Date(today); sevenAgo.setDate(sevenAgo.getDate() - 8);

  const { data: organizations } = await supabase.from("organizations").select("id, name");
  if (!organizations) {
    return new Response(JSON.stringify({ ok: true, alerts: 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let created = 0;
  let emailsSent = 0;

  for (const org of organizations) {
    try {
      const isProPlusActive = await getOrgPlanStatus(supabase, org.id);
      let targetEmails: string[] = [];
      if (isProPlusActive) {
        targetEmails = await getAdminEmailsForOrg(supabase, org.id);
      }

      const { data: projects } = await supabase.from("projects").select("id, name").eq("organization_id", org.id);
      if (!projects) continue;

      for (const project of projects) {
        const { data: pref } = await supabase
          .from("alert_preferences")
          .select("*")
          .eq("project_id", project.id)
          .maybeSingle();

        if (pref && !pref.enabled) continue;
        const threshold = pref?.traffic_threshold_pct ?? 20;
        const leadsGoal = pref?.leads_goal_daily ?? null;

        const { count: yesterdayCount } = await supabase
          .from("pageviews")
          .select("*", { count: "exact", head: true })
          .eq("project_id", project.id)
          .gte("created_at", yStart.toISOString())
          .lte("created_at", yEnd.toISOString());

        const prevStart = new Date(sevenAgo); prevStart.setHours(0, 0, 0, 0);
        const prevEnd = new Date(yesterday); prevEnd.setDate(prevEnd.getDate() - 1); prevEnd.setHours(23, 59, 59, 999);
        const { count: prevCount } = await supabase
          .from("pageviews")
          .select("*", { count: "exact", head: true })
          .eq("project_id", project.id)
          .gte("created_at", prevStart.toISOString())
          .lte("created_at", prevEnd.toISOString());

        const avg7 = (prevCount ?? 0) / 7;
        const yCount = yesterdayCount ?? 0;

        const sendAlert = async (payload: any) => {
          await supabase.from("alerts").insert({ project_id: project.id, ...payload });
          created++;
          for (const email of targetEmails) {
            await sendEmail(
              email,
              `[KUBOWEB] ${payload.title}`,
              alertEmailHtml({ title: payload.title, message: payload.message, projectName: project.name }),
            );
            emailsSent++;
          }
        };

        if (avg7 > 0) {
          const change = ((yCount - avg7) / avg7) * 100;
          if (change >= threshold) {
            await sendAlert({
              type: "traffic_spike",
              severity: "success",
              title: `ðŸ“ˆ Tráfego subiu ${change.toFixed(0)}%`,
              message: `${project.name} teve ${yCount} visitas ontem, ${change.toFixed(0)}% acima da média semanal (${avg7.toFixed(0)}).`,
              metadata: { yesterday: yCount, avg7, change },
            });
          } else if (change <= -threshold) {
            await sendAlert({
              type: "traffic_drop",
              severity: "warning",
              title: `ðŸ“‰ Tráfego caiu ${Math.abs(change).toFixed(0)}%`,
              message: `${project.name} teve ${yCount} visitas ontem, ${Math.abs(change).toFixed(0)}% abaixo da média semanal (${avg7.toFixed(0)}).`,
              metadata: { yesterday: yCount, avg7, change },
            });
          }
        }

        if (leadsGoal && leadsGoal > 0) {
          const { count: leadsCount } = await supabase
            .from("events")
            .select("*", { count: "exact", head: true })
            .eq("project_id", project.id)
            .in("event_type", ["whatsapp_click", "form_submit"])
            .gte("created_at", yStart.toISOString())
            .lte("created_at", yEnd.toISOString());

          const leads = leadsCount ?? 0;
          if (leads >= leadsGoal) {
            await sendAlert({
              type: "leads_goal",
              severity: "success",
              title: `ðŸŽ¯ Meta de leads batida!`,
              message: `${project.name} gerou ${leads} leads ontem (meta: ${leadsGoal}).`,
              metadata: { leads, goal: leadsGoal },
            });
          }
        }
      }
    } catch (err) {
      console.error(`Erro ao processar organização ${org.id}`, err);
      // Isolamento: Falha em uma org não interrompe as outras
    }
  }

  return new Response(JSON.stringify({ ok: true, alerts: created, emails_sent: emailsSent }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
