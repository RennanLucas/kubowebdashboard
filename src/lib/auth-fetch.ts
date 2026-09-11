/** Keep Auth requests same-origin in hosted builds, without moving JWT storage
 * or OAuth redirect URLs. Only the configured Supabase Auth path is proxied. */
export function createAuthFetch(supabaseUrl: string, hostname: string, transport: typeof fetch = fetch): typeof fetch {
  const local = !hostname || ["localhost", "127.0.0.1", "::1", "[::1]"].includes(hostname);
  return (input, init) => {
    const source = input instanceof Request ? input.url : String(input);
    const url = new URL(source);
    // This rewrite targets production. Never send staging/preview-project credentials to it.
    if (!local && url.origin === "https://gitzmynfamubetgujtmm.supabase.co" && url.origin === new URL(supabaseUrl).origin && url.pathname.startsWith("/auth/v1/")) {
      // Avoid `/api` and authentication-related path names: privacy extensions
      // can block those patterns before a request reaches our own deployment.
      const target = `${window.location.origin}/kubo-bridge/${url.pathname.slice("/auth/v1/".length)}${url.search}`;
      return transport(input instanceof Request ? new Request(target, input) : target, init);
    }
    return transport(input, init);
  };
}
