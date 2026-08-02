import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { resolveTier, limitsForTier } from "../_shared/plans.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};


Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      return new Response(JSON.stringify({ error: "LOVABLE_API_KEY ausente" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) {
      return new Response(JSON.stringify({ error: "Sessão inválida" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = userData.user.id;

    const url = new URL(req.url);
    const action = url.searchParams.get("action") ?? "status";

    // Descobre plano ativo do usuário (Pro vs Pro+)
    const { data: subRow } = await admin
      .from("subscriptions")
      .select("plan_id, status, current_period_end")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    const tier = resolveTier(subRow);
    const isProPlus = tier === "pro_plus";
    const MONTHLY_LIMIT = limitsForTier(tier).aiMonthlyLimit;

    // Calcula uso no mês corrente
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const { count: usedThisMonth } = await admin
      .from("ai_insights")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .gte("created_at", monthStart);

    const used = usedThisMonth ?? 0;
    const remaining = Math.max(0, MONTHLY_LIMIT - used);

    // Pega o último insight gerado
    const { data: latest } = await admin
      .from("ai_insights")
      .select("id, content, created_at, period_days, model")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (action === "status") {
      return new Response(
        JSON.stringify({ used, remaining, limit: MONTHLY_LIMIT, latest, plan: tier }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (action !== "generate") {
      return new Response(JSON.stringify({ error: "action inválida" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (MONTHLY_LIMIT <= 0) {
      return new Response(
        JSON.stringify({
          error: "PLAN_REQUIRED",
          message: "Resumos com IA estão disponíveis nos planos Pro (3/mês) e Pro+ (6/mês).",
          used,
          limit: 0,
          plan: tier,
        }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (remaining <= 0) {
      return new Response(
        JSON.stringify({
          error: "LIMIT_REACHED",
          message: `Você já usou seus ${MONTHLY_LIMIT} insights deste mês. Tente novamente no próximo mês.`,
          used,
          limit: MONTHLY_LIMIT,
        }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // Coleta dados dos últimos 7 dias do projeto do usuário
    const { data: client, error: clientErr } = await admin
      .from("clients")
      .select("id, company_name, lead_value")
      .eq("user_id", userId)
      .order("created_at", { ascending: true })
      .limit(1)
      .maybeSingle();

    if (clientErr) console.error("client lookup error", clientErr);
    if (!client) {
      return new Response(JSON.stringify({ error: "Cliente não encontrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: projects } = await admin
      .from("projects")
      .select("id, name, url")
      .eq("client_id", client.id);

    const projectIds = (projects ?? []).map((p) => p.id);
    if (projectIds.length === 0) {
      return new Response(JSON.stringify({ error: "Nenhum projeto cadastrado" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const since7 = new Date(Date.now() - 7 * 86400_000).toISOString();
    const since14 = new Date(Date.now() - 14 * 86400_000).toISOString();

    const [{ data: metrics7 }, { data: metrics14 }, { data: pv }, { data: ev }] = await Promise.all([
      admin
        .from("website_metrics")
        .select("date, visitors, leads, conversion_rate, estimated_value, whatsapp_clicks, form_submissions, button_clicks")
        .in("project_id", projectIds)
        .gte("date", since7.slice(0, 10))
        .order("date"),
      admin
        .from("website_metrics")
        .select("visitors, leads, estimated_value")
        .in("project_id", projectIds)
        .gte("date", since14.slice(0, 10))
        .lt("date", since7.slice(0, 10)),
      admin
        .from("pageviews")
        .select("page_path, country, created_at")
        .in("project_id", projectIds)
        .gte("created_at", since7)
        .limit(5000),
      admin
        .from("events")
        .select("event_type, page_path")
        .in("project_id", projectIds)
        .gte("created_at", since7)
        .limit(5000),
    ]);

    // Agregação simples
    const sum = (arr: any[] | null, key: string) =>
      (arr ?? []).reduce((s, r) => s + (Number(r[key]) || 0), 0);

    const visitors7 = sum(metrics7, "visitors");
    const leads7 = sum(metrics7, "leads");
    const value7 = sum(metrics7, "estimated_value");
    const visitors14 = sum(metrics14, "visitors");
    const leads14 = sum(metrics14, "leads");
    const value14 = sum(metrics14, "estimated_value");

    const pct = (cur: number, prev: number) =>
      prev === 0 ? (cur > 0 ? 100 : 0) : Math.round(((cur - prev) / prev) * 100);

    const topPages = Object.entries(
      (pv ?? []).reduce<Record<string, number>>((acc, r: any) => {
        acc[r.page_path] = (acc[r.page_path] ?? 0) + 1;
        return acc;
      }, {}),
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const topCountries = Object.entries(
      (pv ?? []).reduce<Record<string, number>>((acc, r: any) => {
        if (r.country) acc[r.country] = (acc[r.country] ?? 0) + 1;
        return acc;
      }, {}),
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    const eventCounts = (ev ?? []).reduce<Record<string, number>>((acc, r: any) => {
      acc[r.event_type] = (acc[r.event_type] ?? 0) + 1;
      return acc;
    }, {});

    const dataSummary = {
      empresa: client.company_name,
      periodo: "últimos 7 dias",
      comparativo: "vs 7 dias anteriores",
      totais_7d: { visitantes: visitors7, leads: leads7, valor_estimado: value7 },
      totais_periodo_anterior: { visitantes: visitors14, leads: leads14, valor_estimado: value14 },
      variacao_pct: {
        visitantes: pct(visitors7, visitors14),
        leads: pct(leads7, leads14),
        valor: pct(value7, value14),
      },
      por_dia: metrics7,
      top_paginas: topPages,
      top_paises: topCountries,
      conversoes: eventCounts,
    };

    const systemPrompt = `Você é um analista de dados sênior especializado em marketing digital e performance de sites. Gere um RESUMO SEMANAL CONCISO E ACIONÁVEL em português brasileiro a partir dos dados fornecidos.

ESTRUTURA OBRIGATÓRIA (use markdown):
## 📊 Resumo da semana
2-3 frases destacando o número mais importante (visitantes, leads ou variação).

## 🚀 Destaques positivos
2-3 bullets do que melhorou (com %, números reais).

## ⚠️ Pontos de atenção
2-3 bullets do que caiu ou está abaixo do esperado.

## 💡 Recomendações
3 ações concretas e práticas para a próxima semana.

REGRAS:
- Seja direto, sem enrolação. Máximo 250 palavras.
- Use SEMPRE números reais dos dados.
- Não invente métricas que não estão no JSON.
- Tom profissional mas acessível.`;

    const aiResp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Dados:\n${JSON.stringify(dataSummary, null, 2)}` },
        ],
      }),
    });

    if (aiResp.status === 429) {
      return new Response(
        JSON.stringify({ error: "AI_RATE_LIMIT", message: "Muitas requisições à IA. Tente em alguns minutos." }),
        { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (aiResp.status === 402) {
      return new Response(
        JSON.stringify({ error: "AI_PAYMENT_REQUIRED", message: "Créditos da IA esgotados. Adicione créditos em Settings > Workspace > Usage." }),
        { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }
    if (!aiResp.ok) {
      const t = await aiResp.text();
      console.error("AI gateway error", aiResp.status, t);
      return new Response(JSON.stringify({ error: "Falha ao gerar insights" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const aiJson = await aiResp.json();
    const content: string = aiJson.choices?.[0]?.message?.content ?? "Sem conteúdo gerado.";
    const model = "google/gemini-2.5-flash";

    const { data: inserted, error: insErr } = await admin
      .from("ai_insights")
      .insert({ user_id: userId, project_id: projectIds[0], content, period_days: 7, model })
      .select("id, content, created_at, period_days, model")
      .single();

    if (insErr) {
      console.error("Insert error", insErr);
      return new Response(JSON.stringify({ error: "Falha ao salvar insight" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(
      JSON.stringify({
        latest: inserted,
        used: used + 1,
        remaining: remaining - 1,
        limit: MONTHLY_LIMIT,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e: any) {
    console.error("ai-weekly-insights error", e);
    return new Response(JSON.stringify({ error: e?.message ?? "Erro inesperado" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
