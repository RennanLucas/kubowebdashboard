type ErrorPayload = { error?: unknown; message?: unknown } | null | undefined;

const payloadMessage = (payload: ErrorPayload): string | null => {
  if (!payload || typeof payload !== "object") return null;
  const value = typeof payload.error === "string" ? payload.error : payload.message;
  return typeof value === "string" && value.trim() ? value.trim() : null;
};

const friendlyMessage = (message: string | null, fallback: string): string => {
  if (!message) return fallback;
  if (/organizationId is required/i.test(message)) {
    return "Não foi possível identificar a organização ativa. Atualize a página e tente novamente.";
  }
  if (/unauthorized/i.test(message)) {
    return "Sua sessão expirou. Entre novamente para continuar.";
  }
  if (/invalid planId/i.test(message)) {
    return "Este plano não está disponível. Atualize a página e escolha outro plano.";
  }
  if (/edge function returned|non-2xx|failed to send a request/i.test(message)) {
    return fallback;
  }
  return message;
};

/** Extracts the safe API message without exposing Supabase's technical error text. */
export async function getEdgeFunctionErrorMessage(
  error: unknown,
  data: ErrorPayload,
  fallback: string,
): Promise<string> {
  const directMessage = payloadMessage(data);
  if (directMessage) return friendlyMessage(directMessage, fallback);

  const context = (error as { context?: { clone?: () => unknown; json?: () => Promise<unknown> } } | null)
    ?.context;

  try {
    const readable = context?.clone ? context.clone() : context;
    if (readable && typeof (readable as { json?: unknown }).json === "function") {
      const payload = (await (readable as { json: () => Promise<ErrorPayload> }).json()) ?? null;
      return friendlyMessage(payloadMessage(payload), fallback);
    }
  } catch {
    // A response body can already be consumed; the stable fallback remains user-friendly.
  }

  return friendlyMessage((error as { message?: string } | null)?.message ?? null, fallback);
}
