import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

/**
 * useAllUserProjects feeds the project picker, so the tenant-isolation property
 * here is "a user must see only projects under their active organization, never
 * another org's projects". A faulty filter would leak project names across org
 * boundaries — not the metrics themselves (those have RLS), but the names alone
 * would be a privacy issue and a tell that isolation broke.
 */

interface FromCall {
  table: string;
  columns?: string;
  filters: Record<string, unknown>;
  order?: string;
}

const state = vi.hoisted(() => ({
  org: {
    activeOrganization: { id: "org1", name: "ACME" } as { id: string; name: string } | null,
    loading: false,
  },
  rows: [] as Array<{ id: string; name: string; url: string | null }>,
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
        order: (col: string) => {
          call.order = col;
          return builder;
        },
      };
      (builder as any).then = async (resolve: (v: any) => void) => {
        resolve({ data: state.rows, error: state.error });
      };
      return builder;
    },
  },
}));

vi.mock("@/contexts/OrganizationContext", () => ({ useOrganization: () => state.org }));

import { useAllUserProjects } from "@/hooks/useAllUserProjects";

let queryClient: QueryClient;

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

const render = () => renderHook(() => useAllUserProjects(), { wrapper });

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  state.org = { activeOrganization: { id: "org1", name: "ACME" }, loading: false };
  state.rows = [];
  state.error = null;
  state.fromCalls = [];
});

describe("useAllUserProjects tenant isolation", () => {
  it("scopes the query to the active organization only", async () => {
    state.rows = [
      { id: "proj1", name: "Site A", url: "https://a.test" },
      { id: "proj2", name: "Site B", url: null },
    ];
    const { result } = render();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));

    expect(state.fromCalls).toHaveLength(1);
    const call = state.fromCalls[0];
    expect(call.table).toBe("projects");
    expect(call.columns).toBe("id, name, url");
    // This filter is the tenant boundary: without it, every org's projects show.
    expect(call.filters).toEqual({ organization_id: "org1" });
    expect(call.order).toBe("name");
  });

  it("decorates each project with the org id and name from the context", async () => {
    state.rows = [{ id: "proj1", name: "Site A", url: "https://a.test" }];
    const { result } = render();
    await waitFor(() => expect(result.current.data).toHaveLength(1));

    expect(result.current.data![0]).toEqual({
      id: "proj1",
      name: "Site A",
      url: "https://a.test",
      organizationId: "org1",
      organizationName: "ACME",
    });
  });

  it("returns an empty array when the org has no projects", async () => {
    const { result } = render();
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(result.current.data).toEqual([]);
  });
});

describe("useAllUserProjects gating", () => {
  it("issues no query while the organization is loading", () => {
    state.org = { activeOrganization: null, loading: true };
    const { result } = render();
    expect(result.current.data).toBeUndefined();
    expect(state.fromCalls).toHaveLength(0);
  });

  it("issues no query without an active organization", () => {
    state.org = { activeOrganization: null, loading: false };
    const { result } = render();
    // The query stays disabled, so it never transitions to success or error.
    expect(result.current.data).toBeUndefined();
    expect(result.current.isLoading).toBe(false);
    expect(state.fromCalls).toHaveLength(0);
  });

  it("propagates a query error without throwing", async () => {
    state.error = { message: "connection timeout" };
    const { result } = render();
    await waitFor(() => expect(result.current.isError).toBe(true));
    expect(result.current.error).toBeTruthy();
  });
});
