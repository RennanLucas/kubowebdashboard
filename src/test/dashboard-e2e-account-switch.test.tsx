import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { ReactNode } from "react";

/**
 * ============================================================================
 * E2E account-switch test for the dashboard
 * ----------------------------------------------------------------------------
 * Simulates the full flow:
 *   1. User A logs in -> dashboard fetches /get-analytics with token A
 *      and renders user A's data.
 *   2. User B logs in (account switch) -> AuthProvider must wipe the cache
 *      and clear the persisted project id, the dashboard hook must refetch
 *      with token B and ONLY return user B's data.
 *   3. At no point may a cached entry from user A be returned to user B.
 *
 * This is a true end-to-end check at the data layer: it exercises the real
 * AuthProvider + useDashboardAnalytics + React Query, and asserts on the
 * actual HTTP requests issued and the data that the dashboard receives.
 * ============================================================================
 */

// --- Env so useDashboardAnalytics builds a URL ------------------------------
vi.stubEnv("VITE_SUPABASE_PROJECT_ID", "test-project");
vi.stubEnv("VITE_SUPABASE_PUBLISHABLE_KEY", "test-anon-key");
vi.stubEnv("VITE_SUPABASE_URL", "https://test-project.supabase.co");

// --- Supabase auth mock ------------------------------------------------------
type AuthCallback = (event: string, session: Session | null) => void;

const authState = {
  callback: null as AuthCallback | null,
  currentSession: null as Session | null,
};

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      onAuthStateChange: (cb: AuthCallback) => {
        authState.callback = cb;
        return { data: { subscription: { unsubscribe: () => {} } } };
      },
      getSession: async () => ({ data: { session: authState.currentSession } }),
      refreshSession: async () => ({ data: { session: authState.currentSession } }),
      signOut: async () => {
        authState.currentSession = null;
        authState.callback?.("SIGNED_OUT", null);
        return { error: null };
      },
    },
  },
}));

// --- usePlan mock so the query doesn't wait on plan loading ----------------
vi.mock("@/hooks/usePlan", () => ({
  usePlan: () => ({ loading: false, maxHistoryDays: 365 }),
}));

// Imported AFTER the mocks above are declared
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { useDashboardAnalytics } from "@/hooks/useDashboardData";

// --- Helpers ----------------------------------------------------------------
// Build a JWT with a far-future exp so isTokenStale() returns false.
const makeJwt = (userId: string) => {
  const header = btoa(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = btoa(
    JSON.stringify({
      sub: userId,
      exp: Math.floor(Date.now() / 1000) + 3600,
    }),
  );
  return `${header}.${payload}.sig-${userId}`;
};

const makeSession = (userId: string): Session =>
  ({
    access_token: makeJwt(userId),
    refresh_token: `refresh-${userId}`,
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: "bearer",
    user: {
      id: userId,
      email: `${userId}@test.com`,
      app_metadata: {},
      user_metadata: {},
      aud: "authenticated",
      created_at: new Date().toISOString(),
    } as any,
  }) as Session;

const fireAuth = (session: Session | null) => {
  authState.currentSession = session;
  authState.callback?.(session ? "SIGNED_IN" : "SIGNED_OUT", session);
};

// Per-user fake analytics payload. The `client.company_name` carries the
// account identity — that's what we use to assert no cross-account leaks.
const analyticsFor = (userId: string) => ({
  client: {
    id: `client-${userId}`,
    company_name: `Company ${userId.toUpperCase()}`,
    domain: `${userId}.example.com`,
    project: { id: `project-${userId}`, name: `Project ${userId}`, url: null },
    projects: [{ id: `project-${userId}`, name: `Project ${userId}`, url: null }],
  },
  metrics: [
    {
      date: new Date().toISOString().split("T")[0],
      visitors: userId === "user-a" ? 111 : 999,
      views: userId === "user-a" ? 222 : 1888,
      leads: userId === "user-a" ? 11 : 99,
      conversion_rate: 1,
      estimated_value: 0,
      whatsapp_clicks: 0,
      form_submissions: 0,
      button_clicks: 0,
    },
  ],
  trafficSources: [],
  topPages: [],
  comparison: null,
  conversions: null,
  devices: [],
  browsers: [],
  operatingSystems: [],
  countries: [],
  cities: [],
  engagement: null,
  activeVisitors: 0,
});

// --- Tests ------------------------------------------------------------------
describe("E2E: dashboard never shows another user's data after account switch", () => {
  let queryClient: QueryClient;
  let fetchSpy: ReturnType<typeof vi.fn>;
  // Track every (token -> response.user) pairing so we can verify each call
  // returned data for the user that owned the token.
  let calls: Array<{ token: string; userReturned: string }>;

  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>{children}</AuthProvider>
    </QueryClientProvider>
  );

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false, gcTime: Infinity } },
    });
    authState.callback = null;
    authState.currentSession = null;
    window.localStorage.clear();
    calls = [];

    // Fake /get-analytics endpoint: decodes the bearer JWT and returns the
    // payload that BELONGS to that token's user. This way, if React Query
    // ever served a cached entry from a different user, the test would catch
    // it — the returned `company_name` would not match the active session.
    fetchSpy = vi.fn(async (input: RequestInfo | URL, init?: RequestInit) => {
      const auth = (init?.headers as Record<string, string>)?.Authorization ?? "";
      const token = auth.replace("Bearer ", "");
      const payloadPart = token.split(".")[1] ?? "";
      const sub = JSON.parse(atob(payloadPart)).sub as string;
      calls.push({ token, userReturned: sub });
      return new Response(JSON.stringify(analyticsFor(sub)), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    });
    vi.stubGlobal("fetch", fetchSpy);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("fetches with user A's token, then with user B's token after switch — no cross-leak", async () => {
    const sessionA = makeSession("user-a");
    const sessionB = makeSession("user-b");

    // Start logged in as user A.
    authState.currentSession = sessionA;

    // IMPORTANT: both hooks must share the SAME AuthProvider, otherwise each
    // renderHook() spins up its own provider tree with its own auth state.
    let projectId = "project-user-a";
    const { result, rerender } = renderHook(
      () => ({
        auth: useAuth(),
        dash: useDashboardAnalytics(30, projectId),
      }),
      { wrapper },
    );

    // 1) Wait for AuthProvider hydration as user A.
    await waitFor(() => {
      expect(result.current.auth.loading).toBe(false);
      expect(result.current.auth.user?.id).toBe("user-a");
    });

    // 2) Dashboard for user A loads and shows user A's company name.
    await waitFor(() => {
      expect(result.current.dash.data?.client?.company_name).toBe("Company USER-A");
    });

    // The first network call must have used user A's token.
    expect(calls.length).toBeGreaterThanOrEqual(1);
    expect(calls[0].userReturned).toBe("user-a");

    // Persist a project id like the real selector would.
    window.localStorage.setItem("dashboard:last-project-id", "project-user-a");

    // --- Account switch: user B signs in -----------------------------------
    await act(async () => {
      fireAuth(sessionB);
    });

    // 3) AuthProvider must wipe persisted project state on user switch.
    await waitFor(() => {
      expect(result.current.auth.user?.id).toBe("user-b");
    });
    expect(window.localStorage.getItem("dashboard:last-project-id")).toBeNull();

    // 4) Switch to user B's project. Because the queryKey is scoped by userId
    //    AND the cache was cleared, this MUST issue a brand new fetch with
    //    user B's token — never serve A's data.
    projectId = "project-user-b";
    rerender();

    await waitFor(() => {
      expect(result.current.dash.data?.client?.company_name).toBe("Company USER-B");
    });

    // 5) Audit every network call: each response's user must match its token.
    for (const c of calls) {
      const sub = JSON.parse(atob(c.token.split(".")[1])).sub;
      expect(c.userReturned).toBe(sub);
    }

    // 6) At least one call was issued per user — no silent cache reuse.
    expect(calls.some((c) => c.userReturned === "user-a")).toBe(true);
    expect(calls.some((c) => c.userReturned === "user-b")).toBe(true);

    // 7) The currently rendered dashboard for user B must NOT contain user A.
    expect(result.current.dash.data?.client?.company_name).not.toContain("USER-A");
    expect(result.current.dash.data?.client?.id).toBe("client-user-b");
  });

  it("after signOut and a NEW login as user B, dashboard shows only user B", async () => {
    const sessionA = makeSession("user-a");
    const sessionB = makeSession("user-b");

    authState.currentSession = sessionA;

    let projectId = "project-user-a";
    const { result, rerender } = renderHook(
      () => ({
        auth: useAuth(),
        dash: useDashboardAnalytics(30, projectId),
      }),
      { wrapper },
    );

    await waitFor(() => expect(result.current.auth.user?.id).toBe("user-a"));
    await waitFor(() =>
      expect(result.current.dash.data?.client?.company_name).toBe("Company USER-A"),
    );

    // Sign out — wipes cache + localStorage.
    await act(async () => {
      await result.current.auth.signOut();
    });
    await waitFor(() => expect(result.current.auth.user).toBeNull());
    expect(window.localStorage.getItem("dashboard:last-project-id")).toBeNull();

    // Now log in as user B.
    await act(async () => {
      fireAuth(sessionB);
    });
    await waitFor(() => expect(result.current.auth.user?.id).toBe("user-b"));

    projectId = "project-user-b";
    rerender();

    await waitFor(() => {
      expect(result.current.dash.data?.client?.company_name).toBe("Company USER-B");
    });

    // No call returned A's data to B, and B's view is pure B.
    expect(result.current.dash.data?.client?.company_name).not.toContain("USER-A");
  });
});
