import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const BREVO_SMTP_KEY = Deno.env.get("BREVO_SMTP_KEY");
const BREVO_FROM_EMAIL = Deno.env.get("BREVO_FROM_EMAIL") ?? "no-reply@kuboweb.com";

async function sendEmail(to: string, subject: string, html: string) {
  if (!BREVO_SMTP_KEY) {
    console.warn("BREVO_SMTP_KEY não configurada — email não enviado");
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
    <div style="font-size:12px;color:#6366f1;font-weight:600;letter-spacing:0.04em;text-transform:uppercase">KUBOWEB Pro+ · Alerta inteligente</div>
    <h1 style="font-size:20px;margin:8px 0 12px;color:#0f1117">${opts.title}</h1>
    <p style="font-size:14px;color:#374151;line-height:1.5;margin:0 0 16px">${opts.message}</p>
    <div style="font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb;padding-top:14px;margin-top:18px">
      Projeto: <strong style="color:#0f1117">${opts.projectName}</strong>
    </div>
    <a href="https://cubie-dash.lovable.app/alerts" style="display:inline-block;margin-top:18px;background:#6366f1;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-size:13px;font-weight:500">Ver no painel</a>
    <p style="font-size:11px;color:#9ca3af;margin-top:24px">Você recebeu este email porque assina o plano Pro+. Para ajustar alertas, acesse Configurações.</p>
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

// Only internal callers (cron / service_role) may run this job: it processes
// every tenant and sends real transactional emails.
function isAuthorized(req: Request): boolean {
  const auth = req.headers.get("Authorization") ?? "";
  const token = auth.toLowerCase().startsWith("bearer ") ? auth.slice(7).trim() : "";
  if (!token) return false;

  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
  if (serviceKey && token === serviceKey) return true;

  const claims = parseJwtClaims(token);
  return claims?.role === "service_role";
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

  const { data: projects } = await supabase.from("projects").select("id, name, client_id");
  if (!projects) {
    return new Response(JSON.stringify({ ok: true, alerts: 0 }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  let created = 0;
  let emailsSent = 0;

  // Cache user_id -> { email, isProPlus }
  const userCache = new Map<string, { email: string | null; isProPlus: boolean }>();
  async function getUserPlan(clientId: string) {
    const { data: client } = await supabase
      .from("clients").select("user_id").eq("id", clientId).maybeSingle();
    const userId = client?.user_id;
    if (!userId) return null;
    if (userCache.has(userId)) return userCache.get(userId)!;

    const { data: sub } = await supabase
      .from("subscriptions")
      .select("plan_id, status, current_period_end, payer_email")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const isProPlus = sub?.plan_id === "kuboweb_pro_plus_monthly";
    const okStatus = sub && ["active", "trialing", "authorized", "approved"].includes(sub.status);
    const periodOk = !sub?.current_period_end || new Date(sub.current_period_end) > new Date();
    const planActive = !!(okStatus && periodOk);

    let email: string | null = sub?.payer_email ?? null;
    if (!email) {
      const { data: u } = await supabase.auth.admin.getUserById(userId);
      email = u?.user?.email ?? null;
    }
    const result = { email, isProPlus: isProPlus && planActive };
    userCache.set(userId, result);
    return result;
  }

  async function createAlertAndMaybeEmail(
    project: { id: string; name: string; client_id: string },
    payload: { type: string; severity: string; title: string; message: string; metadata: any },
  ) {
    await supabase.from("alerts").insert({ project_id: project.id, ...payload });
    created++;

    const userPlan = await getUserPlan(project.client_id);
    if (userPlan?.isProPlus && userPlan.email) {
      await sendEmail(
        userPlan.email,
        `[KUBOWEB] ${payload.title}`,
        alertEmailHtml({ title: payload.title, message: payload.message, projectName: project.name }),
      );
      emailsSent++;
    }
  }

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

    if (avg7 > 0) {
      const change = ((yCount - avg7) / avg7) * 100;
      if (change >= threshold) {
        await createAlertAndMaybeEmail(project, {
          type: "traffic_spike",
          severity: "success",
          title: `📈 Tráfego subiu ${change.toFixed(0)}%`,
          message: `${project.name} teve ${yCount} visitas ontem, ${change.toFixed(0)}% acima da média semanal (${avg7.toFixed(0)}).`,
          metadata: { yesterday: yCount, avg7, change },
        });
      } else if (change <= -threshold) {
        await createAlertAndMaybeEmail(project, {
          type: "traffic_drop",
          severity: "warning",
          title: `📉 Tráfego caiu ${Math.abs(change).toFixed(0)}%`,
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
        await createAlertAndMaybeEmail(project, {
          type: "leads_goal",
          severity: "success",
          title: `🎯 Meta de leads batida!`,
          message: `${project.name} gerou ${leads} leads ontem (meta: ${leadsGoal}).`,
          metadata: { leads, goal: leadsGoal },
        });
      }
    }
  }

  return new Response(JSON.stringify({ ok: true, alerts: created, emails_sent: emailsSent }), {
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
