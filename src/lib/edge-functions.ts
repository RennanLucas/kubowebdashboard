const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);

export const shouldUseSameOriginEdgeProxy = (
  hostname = typeof window === "undefined" ? "" : window.location.hostname,
) => Boolean(hostname) && !LOCAL_HOSTS.has(hostname);

export const getEdgeFunctionUrl = (
  name: string,
  query = "",
  hostname = typeof window === "undefined" ? "" : window.location.hostname,
) => {
  const encodedName = encodeURIComponent(name);
  const suffix = query ? `?${query.replace(/^\?/, "")}` : "";

  if (shouldUseSameOriginEdgeProxy(hostname)) {
    return `/api/edge/${encodedName}${suffix}`;
  }

  return `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${encodedName}${suffix}`;
};

interface EdgeFunctionRequestOptions {
  method?: "GET" | "POST" | "PUT" | "DELETE";
  query?: URLSearchParams;
  headers?: Record<string, string>;
  body?: unknown;
  signal?: AbortSignal;
}

export async function requestEdgeFunction<T>(
  name: string,
  accessToken: string,
  options: EdgeFunctionRequestOptions = {},
): Promise<T> {
  const response = await fetch(getEdgeFunctionUrl(name, options.query?.toString()), {
    cache: "no-store",
    method: options.method ?? "GET",
    signal: options.signal,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
      "Content-Type": "application/json",
      ...options.headers,
    },
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    if (response.ok) throw new Error("O servidor retornou uma resposta inválida.");
  }

  if (!response.ok) {
    const errorPayload = payload as { error?: string; message?: string } | null;
    throw new Error(
      errorPayload?.error || errorPayload?.message || `Erro ao buscar dados (${response.status})`,
    );
  }

  return payload as T;
}
