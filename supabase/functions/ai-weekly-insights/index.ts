import { createClient } from "https://esm.sh/@supabase/supabase-js@2.95.0";
import { getCorsHeaders } from "../_shared/cors.ts";
import { rateLimitResponse } from "../_shared/rate-limit.ts";
import { checkSharedRateLimit } from "../_shared/shared-rate-limit.ts";
import { errorResponse } from "../_shared/plan-gate.ts";
import { GEMINI_MODEL, generateGeminiInsight } from "./_gemini.ts";
import { type AIStatus, runAIGeneration } from "./_service.ts";
const UUID = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i;

Deno.serve(async (req) => {
  const cors = getCorsHeaders(req);
  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: {
        ...cors,
        "Content-Type": "application/json",
        "Cache-Control": "no-store",
      },
    });
  if (req.method === "OPTIONS") return new Response(null, { headers: cors });
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action") ?? "status";
    if (action !== "status" && action !== "generate") {
      return json({ error: "INVALID_AI_REQUEST" }, 400);
    }
    if (req.method !== (action === "generate" ? "POST" : "GET")) {
      return json({ error: "METHOD_NOT_ALLOWED" }, 405);
    }
    const auth = req.headers.get("Authorization");
    if (!auth?.startsWith("Bearer ")) {
      return json({ error: "Não autorizado" }, 401);
    }
    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );
    const { data: { user }, error: authError } = await admin.auth.getUser(
      auth.slice(7).trim(),
    );
    if (authError || !user) return json({ error: "Sessão inválida" }, 401);
    const rate = await checkSharedRateLimit(
      admin,
      "ai-weekly-insights",
      user.id,
      20,
    );
    if (!rate.allowed) return rateLimitResponse(rate.resetAt, cors, 20);
    const project = url.searchParams.get("project_id") ?? "";
    const org = url.searchParams.get("organization_id") ?? "";
    const body = action === "generate"
      ? await req.json().catch(() => null)
      : null;
    const days = Number(body?.period_days ?? url.searchParams.get("days") ?? 7);
    const requestId = body?.request_id ?? url.searchParams.get("request_id") ??
      null;
    if (
      !UUID.test(project) || !UUID.test(org) || ![7, 30].includes(days) ||
      (requestId !== null &&
        (typeof requestId !== "string" || !UUID.test(requestId))) ||
      (action === "generate" && !requestId)
    ) return json({ error: "INVALID_AI_REQUEST" }, 400);
    const { data: projectData, error: projectError } = await admin.from(
      "projects",
    ).select("organization_id").eq("id", project).maybeSingle();
    if (projectError) throw projectError;
    if (projectData?.organization_id !== org) {
      return json({ error: "Acesso negado ao projeto" }, 403);
    }
    const key = Deno.env.get("GEMINI_API_KEY") ?? "";
    const command = async (
      operation: string,
      content?: string,
      usage?: unknown,
    ) => {
      const { data, error } = await admin.rpc("manage_ai_generation", {
        p_actor: user.id,
        p_project: project,
        p_action: operation,
        p_request: requestId,
        p_days: days,
        p_model: GEMINI_MODEL,
        p_content: content ?? null,
        p_usage: usage ?? null,
      });
      if (error) throw new Error(error.message);
      if (
        !data || typeof data.limit !== "number" ||
        typeof data.remaining !== "number"
      ) throw new Error("AI_LEDGER_UNAVAILABLE");
      return data as AIStatus;
    };
    const result = await runAIGeneration(action, {
      configured: Boolean(key),
      command,
      summary: async () => {
        const { error: aggregateError } = await admin.rpc(
          "aggregate_analytics_jit",
          { p_project_id: project },
        );
        if (aggregateError) throw aggregateError;
        const { data, error } = await admin.rpc("ai_project_summary", {
          p_actor: user.id,
          p_project: project,
          p_days: days,
        });
        if (error || !data?.current || !Array.isArray(data.events)) {
          throw new Error("AI_DATA_UNAVAILABLE");
        }
        return data;
      },
      consumeProviderBudget: async () => {
        const minute = await checkSharedRateLimit(
          admin,
          "ai-provider-minute",
          "gemini-free-project",
          4,
          60,
        );
        if (!minute.allowed) throw new Error("AI_PROVIDER_RATE_LIMIT");
        const daily = await checkSharedRateLimit(
          admin,
          "ai-provider-daily",
          "gemini-free-project",
          15,
          86_400,
        );
        if (!daily.allowed) throw new Error("AI_PROVIDER_DAILY_LIMIT");
      },
      generate: (summary) => generateGeminiInsight(key, summary),
    });
    return json(
      { ...(result.body as object), model: GEMINI_MODEL },
      result.httpStatus,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    const errors: Record<string, [number, string]> = {
      PLAN_REQUIRED: [402, "Insights com IA são exclusivos do plano Pro."],
      AI_LIMIT_REACHED: [
        429,
        "Você atingiu o limite mensal de análises com IA da organização.",
      ],
      AI_PROVIDER_RATE_LIMIT: [
        429,
        "Muitas análises foram iniciadas agora. Aguarde um minuto e tente novamente.",
      ],
      AI_PROVIDER_DAILY_LIMIT: [
        429,
        "O limite diário compartilhado da IA foi atingido. Tente novamente amanhã.",
      ],
      AI_ACCESS_DENIED: [403, "Acesso negado à organização."],
      AI_WRITE_DENIED: [403, "Você não pode gerar análises pagas."],
      AI_PROJECT_NOT_FOUND: [403, "Acesso negado ao projeto."],
      INVALID_AI_REQUEST: [400, "Solicitação inválida."],
      AI_REQUEST_ID_CONFLICT: [
        400,
        "Solicitação incompatível com uma geração anterior.",
      ],
    };
    if (errors[message]) {
      return json(
        { error: message, message: errors[message][1] },
        errors[message][0],
      );
    }
    if (message.startsWith("AI_")) {
      console.error("AI generation failed", { code: message });
      return json({
        error: "AI_UNAVAILABLE",
        provider_code: message,
        message:
          "Não foi possível concluir a análise. Consulte a solicitação antes de gerar novamente; uma chamada iniciada pode estar contabilizada na quota.",
      }, 503);
    }
    return errorResponse(error, cors, "ai-weekly-insights");
  }
});
