import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

/**
 * useIsAdmin is an authorization gate, so the only acceptable failure mode is
 * fail-closed. A dropped connection, an RLS denial, or a malformed row must all
 * resolve to "not an admin" — never to a granted one. These tests exist to keep
 * that property from being refactored away.
 */

interface FromCall {
  table: string;
  columns?: string;
  filters: Record<string, unknown>;
}

const state = vi.hoisted(() => ({
  auth: { user: { id: "u1" } as { id: string } | null, loading: false },
  row: null as Record<string, unknown> | null,
  error: null as { message: string } | null,
  fromCalls: [] as FromCall[],
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => {
      const call: FromCall = { table, filters: {} };
      state.fromCalls.push(call);
      const builder: Record<string, unknown> = {
        select: (columns: string) => {
          call.columns = columns;
          return builder;
        },
        eq: (col: string, val: unknown) => {
          call.filters[col] = val;
          return builder;
        },
        maybeSingle: async () => ({ data: state.row, error: state.error }),
      };
      return builder;
    },
  },
}));

vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => state.auth }));

import { useIsAdmin } from "@/hooks/useIsAdmin";

let queryClient: QueryClient;

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

const render = (enabled?: boolean) => renderHook(() => useIsAdmin(enabled), { wrapper });

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  state.auth = { user: { id: "u1" }, loading: false };
  state.row = null;
  state.error = null;
  state.fromCalls = [];
  vi.spyOn(console, "error").mockImplementation(() => {});
});

describe("useIsAdmin query shape", () => {
  it("asks user_roles for this user's admin row and nothing else", async () => {
    state.row = { role: "admin" };
    const { result } = render();
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(state.fromCalls).toHaveLength(1);
    const call = state.fromCalls[0];
    expect(call.table).toBe("user_roles");
    expect(call.columns).toBe("role");
    // Both filters matter: user_id scopes the row to the caller, role narrows it
    // so a non-admin role on the same user can never be mistaken for a grant.
    expect(call.filters).toEqual({ user_id: "u1", role: "admin" });
  });
});

describe("useIsAdmin grants", () => {
  it("grants admin when the row exists", async () => {
    state.row = { role: "admin" };
    const { result } = render();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isAdmin).toBe(true);
  });

  it("denies admin when no row matches", async () => {
    const { result } = render();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isAdmin).toBe(false);
  });
});

describe("useIsAdmin fails closed", () => {
  it("denies admin when the query errors, without throwing", async () => {
    state.error = { message: "permission denied for table user_roles" };
    const { result } = render();
    await waitFor(() => expect(result.current.loading).toBe(false));
    // A DB blip must never be an escalation.
    expect(result.current.isAdmin).toBe(false);
  });

  it("denies admin while auth is still resolving, and issues no query", () => {
    state.auth = { user: null, loading: true };
    const { result } = render();
    expect(result.current.isAdmin).toBe(false);
    expect(result.current.loading).toBe(true);
    expect(state.fromCalls).toHaveLength(0);
  });

  it("denies admin with no signed-in user, and issues no query", async () => {
    state.auth = { user: null, loading: false };
    const { result } = render();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isAdmin).toBe(false);
    expect(state.fromCalls).toHaveLength(0);
  });
});

describe("useIsAdmin disabled", () => {
  it("reports a settled denial and issues no query", async () => {
    state.row = { role: "admin" };
    const { result } = render(false);
    expect(result.current.loading).toBe(false);
    expect(result.current.isAdmin).toBe(false);
    expect(state.fromCalls).toHaveLength(0);
  });

  it("still denies even if an admin answer is already cached", async () => {
    state.row = { role: "admin" };
    const on = render(true);
    await waitFor(() => expect(on.result.current.isAdmin).toBe(true));

    // Same QueryClient, so the cached `true` is right there — the disabled flag
    // has to win anyway.
    const off = render(false);
    expect(off.result.current.isAdmin).toBe(false);
    expect(off.result.current.loading).toBe(false);
  });
});
