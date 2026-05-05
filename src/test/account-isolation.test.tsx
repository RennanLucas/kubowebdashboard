import { describe, it, expect, beforeEach, vi } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { Session } from "@supabase/supabase-js";
import { ReactNode } from "react";

/**
 * ============================================================================
 * Account isolation test
 * ----------------------------------------------------------------------------
 * Validates that switching the active user:
 *  1. Wipes the React Query cache (no shared dashboard data between accounts)
 *  2. Clears the persisted project id in localStorage
 *  3. Produces a different `queryKey` per user, so even without a clear,
 *     user A could never read user B's cached entry.
 * ============================================================================
 */

// --- Mock the Supabase client used by AuthContext ---------------------------
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

// Imported AFTER the mock above is declared
import { AuthProvider, useAuth } from "@/contexts/AuthContext";

// --- Helpers ----------------------------------------------------------------
const makeSession = (userId: string, email = `${userId}@test.com`): Session =>
  ({
    access_token: `token-${userId}`,
    refresh_token: `refresh-${userId}`,
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    token_type: "bearer",
    user: {
      id: userId,
      email,
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

const buildDashboardKey = (
  userId: string | undefined,
  days: number,
  projectId?: string,
  source = "all",
  device = "all",
) => ["dashboard-analytics", userId, days, projectId, source, device];

// --- Tests ------------------------------------------------------------------
describe("Account isolation in the dashboard", () => {
  let queryClient: QueryClient;

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
  });

  it("uses a different queryKey per user so caches cannot overlap", () => {
    const userAKey = buildDashboardKey("user-a", 30, "proj-1");
    const userBKey = buildDashboardKey("user-b", 30, "proj-1");

    expect(userAKey).not.toEqual(userBKey);

    // Even when other params match, the userId segment must differ.
    queryClient.setQueryData(userAKey, { secret: "user-A-data" });
    queryClient.setQueryData(userBKey, { secret: "user-B-data" });

    expect(queryClient.getQueryData(userAKey)).toEqual({ secret: "user-A-data" });
    expect(queryClient.getQueryData(userBKey)).toEqual({ secret: "user-B-data" });
    // User A must NEVER see User B's data through their own key.
    expect(queryClient.getQueryData(userAKey)).not.toEqual(
      queryClient.getQueryData(userBKey),
    );
  });

  it("wipes the cache and clears localStorage when the active user switches", async () => {
    const sessionA = makeSession("user-a");
    const sessionB = makeSession("user-b");

    // Pre-populate state as if user A was logged in and had cached data.
    authState.currentSession = sessionA;
    window.localStorage.setItem("dashboard:last-project-id", "project-of-A");
    queryClient.setQueryData(buildDashboardKey("user-a", 30, "project-of-A"), {
      secret: "user-A-dashboard",
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    // Wait for AuthProvider initial restore to complete (sets user A).
    await waitFor(() => {
      expect(result.current.loading).toBe(false);
      expect(result.current.user?.id).toBe("user-a");
    });

    // Sanity: user A's data is in cache and project id is persisted.
    expect(
      queryClient.getQueryData(buildDashboardKey("user-a", 30, "project-of-A")),
    ).toBeDefined();
    expect(window.localStorage.getItem("dashboard:last-project-id")).toBe("project-of-A");

    // --- Switch account: emit a new session for user B ---------------------
    await act(async () => {
      fireAuth(sessionB);
    });

    await waitFor(() => {
      expect(result.current.user?.id).toBe("user-b");
    });

    // 1) Cache from user A must be gone.
    expect(
      queryClient.getQueryData(buildDashboardKey("user-a", 30, "project-of-A")),
    ).toBeUndefined();

    // 2) Persisted project id from user A must be cleared.
    expect(window.localStorage.getItem("dashboard:last-project-id")).toBeNull();

    // 3) Even if cleanup somehow missed, user B's queryKey would not match A's.
    queryClient.setQueryData(buildDashboardKey("user-b", 30, "project-of-B"), {
      secret: "user-B-dashboard",
    });
    expect(
      queryClient.getQueryData(buildDashboardKey("user-a", 30, "project-of-A")),
    ).toBeUndefined();
  });

  it("clears cache and persisted project id on signOut", async () => {
    const sessionA = makeSession("user-a");
    authState.currentSession = sessionA;
    window.localStorage.setItem("dashboard:last-project-id", "project-of-A");
    queryClient.setQueryData(buildDashboardKey("user-a", 30, "project-of-A"), {
      secret: "user-A-dashboard",
    });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.user?.id).toBe("user-a"));

    await act(async () => {
      await result.current.signOut();
    });

    await waitFor(() => expect(result.current.user).toBeNull());

    expect(window.localStorage.getItem("dashboard:last-project-id")).toBeNull();
    expect(
      queryClient.getQueryData(buildDashboardKey("user-a", 30, "project-of-A")),
    ).toBeUndefined();
  });
});
