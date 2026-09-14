export interface AIStatus {
  state: "reserved" | "started" | "succeeded" | "failed" | "uncertain" | null;
  request_id: string | null;
  used: number;
  remaining: number;
  limit: number;
  resets_at: string;
  can_generate: boolean;
  started: boolean;
  latest: {
    id: string;
    content: string;
    created_at: string;
    period_days: number;
    model: string;
    project_id: string;
  } | null;
}
export interface AIDependencies {
  configured: boolean;
  command: (
    action: "status" | "reserve" | "start" | "complete" | "fail",
    content?: string,
    usage?: unknown,
  ) => Promise<AIStatus>;
  summary: () => Promise<
    { current: { views: number }; events: { total: number }[] }
  >;
  generate: (summary: unknown) => Promise<{ content: string; usage: unknown }>;
}
export async function runAIGeneration(
  action: "status" | "generate",
  deps: AIDependencies,
) {
  const status = await deps.command("status");
  const reply = (body: unknown, httpStatus = 200) => ({ body, httpStatus });
  const failure = (error: string, message: string, httpStatus: number) =>
    reply({ error, message }, httpStatus);
  if (action === "status") {
    return reply({ ...status, configured: deps.configured });
  }
  if (!status.limit) {
    return failure(
      "PLAN_REQUIRED",
      "Insights com IA são exclusivos do plano Pro.",
      402,
    );
  }
  if (!status.can_generate) {
    return failure(
      "AI_WRITE_DENIED",
      "Seu acesso permite leitura, mas não gerar análises pagas.",
      403,
    );
  }
  if (status.state === "succeeded") {
    return status.latest
      ? reply({ ...status, configured: deps.configured })
      : failure(
        "AI_REPORT_REMOVED",
        "Esta geração já foi utilizada e o relatório foi removido do histórico.",
        409,
      );
  }
  if (status.state === "started") {
    return failure(
      "AI_PROCESSING",
      "Esta geração está em processamento. Consulte o resultado antes de iniciar outra.",
      409,
    );
  }
  if (status.state === "uncertain") {
    return failure(
      "AI_REQUEST_UNCERTAIN",
      "Não foi possível confirmar esta geração. Ela permanece contabilizada para evitar chamadas pagas duplicadas.",
      409,
    );
  }
  if (status.state === "failed") {
    return failure(
      "AI_REQUEST_EXPIRED",
      "Esta solicitação expirou antes de gerar. Inicie uma nova análise.",
      409,
    );
  }
  if (!deps.configured) {
    return failure(
      "AI_NOT_CONFIGURED",
      "A integração de IA ainda não está disponível. Nenhuma geração foi realizada.",
      503,
    );
  }
  if (!status.remaining && status.state !== "reserved") {
    return failure(
      "AI_LIMIT_REACHED",
      "Você atingiu o limite mensal de análises com IA da organização.",
      429,
    );
  }
  const summary = await deps.summary();
  if (
    !summary.current.views && !summary.events.some((event) => event.total > 0)
  ) {
    return failure(
      "AI_INSUFFICIENT_DATA",
      "Ainda não há dados registrados neste período para gerar uma análise com IA.",
      422,
    );
  }
  let reserved = false;
  try {
    const reservation = await deps.command("reserve");
    reserved = reservation.state === "reserved";
    if (reservation.state === "succeeded" && reservation.latest) {
      return reply({ ...reservation, configured: deps.configured });
    }
    const started = await deps.command("start");
    if (!started.started) {
      return failure(
        "AI_PROCESSING",
        "A solicitação já foi iniciada ou expirou. Consulte seu resultado.",
        409,
      );
    }
    const generated = await deps.generate(summary);
    const completed = await deps.command(
      "complete",
      generated.content,
      generated.usage,
    );
    if (completed.state !== "succeeded" || !completed.latest) {
      throw new Error("AI_SAVE_FAILED");
    }
    return reply({ ...completed, configured: deps.configured });
  } catch (error) {
    if (reserved) {
      try {
        await deps.command("fail");
      } catch {
        console.error(
          "AI ledger finalization unavailable; reservation remains protected",
        );
      }
    }
    // No automatic retry after a provider call: it may already be billable.
    throw error;
  }
}
