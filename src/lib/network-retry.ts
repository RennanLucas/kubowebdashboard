const TRANSIENT_NETWORK_ERROR =
  /failed to fetch|failed to send a request|network request failed|fetch failed|load failed|networkerror|timed out|timeout/i;

export const EDGE_REQUEST_TIMEOUT_MS = 8_000;

export const isTransientNetworkError = (error: unknown) => {
  const message = error instanceof Error ? error.message : String(error ?? "");
  return TRANSIENT_NETWORK_ERROR.test(message);
};

interface RetryOptions {
  attempts?: number;
  delaysMs?: number[];
}

/** Retry only browser/transport failures. HTTP and business errors fail fast. */
export async function withTransientNetworkRetry<T>(
  operation: () => Promise<T>,
  { attempts = 3, delaysMs = [200, 600] }: RetryOptions = {},
): Promise<T> {
  let lastError: unknown;

  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (!isTransientNetworkError(error) || attempt === attempts - 1) throw error;
      const delay = delaysMs[Math.min(attempt, delaysMs.length - 1)] ?? 0;
      if (delay > 0) await new Promise((resolve) => window.setTimeout(resolve, delay));
    }
  }

  throw lastError;
}

/** Ensure a browser request settles instead of leaving the UI in a permanent skeleton. */
export async function withRequestTimeout<T>(
  operation: (signal: AbortSignal) => Promise<T>,
  timeoutMs = EDGE_REQUEST_TIMEOUT_MS,
): Promise<T> {
  const controller = new AbortController();
  let timeoutId: number | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timeoutId = window.setTimeout(() => {
      controller.abort();
      reject(new Error("Request timed out"));
    }, timeoutMs);
  });
  try {
    return await Promise.race([operation(controller.signal), timeout]);
  } finally {
    if (timeoutId !== undefined) window.clearTimeout(timeoutId);
  }
}

export const toCustomerNetworkMessage = (error: unknown, fallback: string) =>
  isTransientNetworkError(error)
    ? "A conexão com o servidor foi interrompida. Tente novamente em alguns instantes."
    : (error instanceof Error && error.message) || fallback;
