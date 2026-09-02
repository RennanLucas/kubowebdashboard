import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

/**
 * useSubscription resolves access from two rows: the org subscription and the
 * legacy "ambiguous" row (organization_id IS NULL, kept for accounts created
 * before organizations existed). Either one being valid grants access, so both
 * the query shape and the fallback are worth pinning down.
 */

interface FromCall {
  table: string;
  filters: Record<string, unknown>;
  isNull: string[];
}

interface FakeChannel {
  name: string;
  config?: { filter?: string; table?: string };
  handler?: () => void;
  subscribed: boolean;
}

const state = vi.hoisted(() => ({
  auth: { user: { id: "u1" } as { id: string } | null, loading: false },
  org: {
    activeOrganization: { id: "org1" } as { id: string } | null,
    loading: false,
  },
  orgRow: null as Record<string, unknown> | null,
  legacyRow: null as Record<string, unknown> | null,
  fromCalls: [] as FromCall[],
  channels: [] as FakeChannel[],
  removed: [] as unknown[],
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: (table: string) => {
      const call: FromCall = { table, filters: {}, isNull: [] };
      state.fromCalls.push(call);
      const builder: Record<string, unknown> = {
        select: () => builder,
        eq: (col: string, val: unknown) => {
          call.filters[col] = val;
          return builder;
        },
        is: (col: string) => {
          call.isNull.push(col);
          return builder;
        },
        order: () => builder,
        limit: () => builder,
        maybeSingle: async () => ({
          data: call.isNull.includes("organization_id") ? state.legacyRow : state.orgRow,
          error: null,
        }),
      };
      return builder;
    },
    channel: (name: string) => {
      const ch: FakeChannel = { name, subscribed: false };
      const api = {
        on: (_event: string, config: FakeChannel["config"], handler: () => void) => {
          ch.config = config;
          ch.handler = handler;
          return api;
        },
        subscribe: () => {
          ch.subscribed = true;
          return api;
        },
        __ch: ch,
      };
      state.channels.push(ch);
      return api;
    },
    removeChannel: (ch: unknown) => {
      state.removed.push(ch);
    },
  },
}));

vi.mock("@/contexts/AuthContext", () => ({ useAuth: () => state.auth }));
vi.mock("@/contexts/OrganizationContext", () => ({ useOrganization: () => state.org }));

import { useSubscription } from "@/hooks/useSubscription";

const HOUR = 3_600_000;
const future = () => new Date(Date.now() + 24 * HOUR).toISOString();
const past = () => new Date(Date.now() - 24 * HOUR).toISOString();

const row = (over: Record<string, unknown> = {}) => ({
  id: "sub1",
  status: "active",
  current_period_end: future(),
  trial_end: null,
  cancel_at_period_end: false,
  ...over,
});

let queryClient: QueryClient;

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

const render = (enabled?: boolean) =>
  renderHook(() => useSubscription(enabled), { wrapper });

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  state.auth = { user: { id: "u1" }, loading: false };
  state.org = { activeOrganization: { id: "org1" }, loading: false };
  state.orgRow = null;
  state.legacyRow = null;
  state.fromCalls = [];
  state.channels = [];
  state.removed = [];
});

afterEach(() => {
  queryClient.clear();
});

describe("useSubscription gating", () => {
  it("reports loading while auth is resolving and issues no query", () => {
    state.auth = { user: null, loading: true };
    const { result } = render();
    expect(result.current.loading).toBe(true);
    expect(result.current.isActive).toBe(false);
    expect(state.fromCalls).toHaveLength(0);
  });

  it("reports loading while the organization is resolving", () => {
    state.org = { activeOrganization: null, loading: true };
    const { result } = render();
    expect(result.current.loading).toBe(true);
    expect(state.fromCalls).toHaveLength(0);
  });

  it("issues no query and settles when disabled", async () => {
    state.orgRow = row();
    const { result } = render(false);
    expect(result.current.loading).toBe(false);
    expect(state.fromCalls).toHaveLength(0);
    expect(state.channels).toHaveLength(0);
    expect(result.current.isActive).toBe(false);
  });

  it("issues no query without a signed-in user", () => {
    state.auth = { user: null, loading: false };
    render();
    expect(state.fromCalls).toHaveLength(0);
  });
});

describe("useSubscription queries", () => {
  it("scopes the org query to the active organization", async () => {
    state.orgRow = row();
    const { result } = render();
    await waitFor(() => expect(result.current.loading).toBe(false));

    const orgCall = state.fromCalls.find((c) => "organization_id" in c.filters);
    expect(orgCall?.table).toBe("subscriptions");
    expect(orgCall?.filters.organization_id).toBe("org1");
    expect(result.current.subscription).toMatchObject({ id: "sub1" });
    expect(result.current.isActive).toBe(true);
  });

  it("always scopes the legacy query to the user with a null organization", async () => {
    state.legacyRow = row({ id: "legacy1" });
    const { result } = render();
    await waitFor(() => expect(result.current.loading).toBe(false));

    const legacyCall = state.fromCalls.find((c) => c.isNull.includes("organization_id"));
    expect(legacyCall?.filters.user_id).toBe("u1");
    expect(result.current.ambiguousSubscription).toMatchObject({ id: "legacy1" });
  });

  it("skips the org query when there is no active organization", async () => {
    state.org = { activeOrganization: null, loading: false };
    state.legacyRow = row({ id: "legacy1" });
    const { result } = render();
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(state.fromCalls).toHaveLength(1);
    expect(state.fromCalls[0].isNull).toContain("organization_id");
    expect(result.current.subscription).toBeNull();
    expect(result.current.isActive).toBe(true);
  });
});

describe("useSubscription isActive", () => {
  it("is false when neither row exists", async () => {
    const { result } = render();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isActive).toBe(false);
    expect(result.current.subscription).toBeNull();
    expect(result.current.ambiguousSubscription).toBeNull();
  });

  it("falls back to the legacy row when the org row has lapsed", async () => {
    state.orgRow = row({ current_period_end: past() });
    state.legacyRow = row({ id: "legacy1", current_period_end: future() });
    const { result } = render();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isActive).toBe(true);
  });

  it("is false when both rows have lapsed", async () => {
    state.orgRow = row({ current_period_end: past() });
    state.legacyRow = row({ id: "legacy1", current_period_end: past() });
    const { result } = render();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isActive).toBe(false);
  });

  it("honours the canceled grace period on the org row", async () => {
    state.orgRow = row({ status: "canceled", current_period_end: future() });
    const { result } = render();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isActive).toBe(true);
  });

  it("denies access on an unpaid row", async () => {
    state.orgRow = row({ status: "unpaid" });
    const { result } = render();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isActive).toBe(false);
  });
});

describe("useSubscription realtime", () => {
  it("subscribes to the org and user channels and removes both on unmount", async () => {
    const { result, unmount } = render();
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(state.channels).toHaveLength(2);
    expect(state.channels.every((c) => c.subscribed)).toBe(true);
    expect(state.channels.map((c) => c.config?.filter)).toEqual([
      "organization_id=eq.org1",
      "user_id=eq.u1",
    ]);

    unmount();
    expect(state.removed).toHaveLength(2);
  });

  it("subscribes only to the user channel without an organization", async () => {
    state.org = { activeOrganization: null, loading: false };
    const { result, unmount } = render();
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(state.channels).toHaveLength(1);
    expect(state.channels[0].config?.filter).toBe("user_id=eq.u1");

    unmount();
    expect(state.removed).toHaveLength(1);
  });

  it("subscribes to no channel while disabled", () => {
    render(false);
    expect(state.channels).toHaveLength(0);
  });

  it("refetches when a subscription row changes", async () => {
    const { result } = render();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.isActive).toBe(false);

    state.orgRow = row();
    await act(async () => {
      state.channels[0].handler?.();
    });
    await waitFor(() => expect(result.current.isActive).toBe(true));
  });

  it("refetches on demand via refresh()", async () => {
    const { result } = render();
    await waitFor(() => expect(result.current.loading).toBe(false));
    const callsBefore = state.fromCalls.length;

    state.orgRow = row();
    await act(async () => {
      await result.current.refresh();
    });
    expect(state.fromCalls.length).toBeGreaterThan(callsBefore);
    await waitFor(() => expect(result.current.isActive).toBe(true));
  });
});
