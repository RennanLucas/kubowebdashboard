import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor, act } from "@testing-library/react";

/**
 * useSubscriptionStatus feeds the billing page (src/pages/Subscription.tsx),
 * which renders a null subscription as "você ainda não tem uma assinatura
 * ativa" next to a buy button. That makes the failure path a billing-accuracy
 * problem, not a cosmetic one: if a transient Edge Function error nulled the
 * status out, a paying customer would be invited into a second charge. So the
 * tests below pin the error path as hard as the happy path.
 */

interface FakeChannel {
  name: string;
  event?: string;
  config?: { table?: string; schema?: string; filter?: string; event?: string };
  handler?: () => void;
  subscribed: boolean;
}

const state = vi.hoisted(() => ({
  auth: { user: { id: "u1" } as { id: string } | null, loading: false },
  organization: { activeOrganization: { id: "11111111-1111-4111-8111-111111111111" }, loading: false },
  invokes: [] as { fn: string; opts: unknown }[],
  result: {
    data: null as unknown,
    error: null as { message: string } | null,
  },
  queuedResults: [] as Array<{ data: unknown; error: { message: string } | null }>,
  channels: [] as FakeChannel[],
  removed: [] as unknown[],
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    auth: {
      getSession: async () => ({
        data: { session: { access_token: "real-test-access-token" } },
        error: null,
      }),
    },
    channel: (name: string) => {
      const ch: FakeChannel = { name, subscribed: false };
      const api = {
        on: (event: string, config: FakeChannel["config"], handler: () => void) => {
          ch.event = event;
          ch.config = config;
          ch.handler = handler;
          return api;
        },
        subscribe: () => {
          ch.subscribed = true;
          return api;
        },
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
vi.mock("@/contexts/OrganizationContext", () => ({ useOrganization: () => state.organization }));

import { useSubscriptionStatus } from "@/hooks/useSubscriptionStatus";
import type { SubscriptionStatus } from "@/hooks/useSubscriptionStatus";

const statusPayload = (over: Partial<SubscriptionStatus> = {}): SubscriptionStatus => ({
  hasSubscription: true,
  subscription: {
    id: "sub1",
    status: "active",
    plan_id: "pro",
    environment: "production",
    provider: "mercadopago",
    amount: 9900,
    current_period_start: "2026-08-01T00:00:00Z",
    current_period_end: "2026-09-01T00:00:00Z",
    trial_end: null,
    cancel_at_period_end: false,
    external_id: "mp-1",
    updated_at: "2026-08-01T00:00:00Z",
  },
  plan: null,
  isActive: true,
  isTrialing: false,
  willCancel: false,
  nextChargeAt: "2026-09-01T00:00:00Z",
  accessUntil: "2026-09-01T00:00:00Z",
  availablePlans: [],
  ...over,
});

const ok = (payload: SubscriptionStatus = statusPayload()) => {
  state.result = { data: payload, error: null };
};

const render = (enabled?: boolean) => renderHook(() => useSubscriptionStatus(enabled));

beforeEach(() => {
  state.auth = { user: { id: "u1" }, loading: false };
  state.organization = { activeOrganization: { id: "11111111-1111-4111-8111-111111111111" }, loading: false };
  state.invokes = [];
  state.channels = [];
  state.removed = [];
  state.queuedResults = [];
  vi.stubGlobal("fetch", vi.fn(async (url: string, opts: unknown) => {
    const fn = url.split("/").pop()?.split("?")[0] ?? "";
    state.invokes.push({ fn, opts });
    const next = state.queuedResults.length ? state.queuedResults.shift()! : state.result;
    if (next.error) throw new Error(next.error.message);
    return {
      ok: true,
      status: 200,
      json: async () => next.data,
    };
  }));
  ok();
});

describe("useSubscriptionStatus gating", () => {
  it("issues no request and settles immediately when disabled", async () => {
    const { result } = render(false);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(state.invokes).toHaveLength(0);
    expect(state.channels).toHaveLength(0);
    expect(result.current.status).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("stays loading while auth is resolving, without requesting", async () => {
    state.auth = { user: null, loading: true };
    const { result } = render();
    expect(result.current.loading).toBe(true);
    expect(state.invokes).toHaveLength(0);
    expect(state.channels).toHaveLength(0);
  });

  it("issues no request and opens no channel without a signed-in user", async () => {
    state.auth = { user: null, loading: false };
    const { result } = render();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(state.invokes).toHaveLength(0);
    expect(state.channels).toHaveLength(0);
    expect(result.current.status).toBeNull();
  });
});

describe("useSubscriptionStatus happy path", () => {
  it("calls get-subscription-status over GET and exposes the payload", async () => {
    const { result } = render();
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(state.invokes).toHaveLength(1);
    expect(state.invokes[0].fn).toBe("get-subscription-status");
    expect(state.invokes[0].opts).toMatchObject({
      method: "GET",
      headers: {
        Authorization: "Bearer real-test-access-token",
        "X-Organization-Id": "11111111-1111-4111-8111-111111111111",
      },
    });
    expect(result.current.status?.isActive).toBe(true);
    expect(result.current.status?.subscription?.id).toBe("sub1");
    expect(result.current.error).toBeNull();
  });

  it("reports an inactive subscription as data, not as an error", async () => {
    ok(statusPayload({ hasSubscription: false, subscription: null, isActive: false }));
    const { result } = render();
    await waitFor(() => expect(result.current.loading).toBe(false));

    // A genuine "no plan" answer and a failed request must stay
    // distinguishable: the page upsells on the first, retries on the second.
    expect(result.current.status).not.toBeNull();
    expect(result.current.status?.isActive).toBe(false);
    expect(result.current.error).toBeNull();
  });
});

describe("useSubscriptionStatus failure path", () => {
  it("recovers automatically from a temporary browser fetch failure", async () => {
    state.queuedResults = [
      { data: null, error: { message: "Failed to fetch" } },
      { data: statusPayload(), error: null },
    ];
    const { result } = render();
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(state.invokes).toHaveLength(2);
    expect(result.current.status?.subscription?.id).toBe("sub1");
    expect(result.current.error).toBeNull();
  });

  it("retries a timeout, shows a readable message and leaves status null on a cold first load", async () => {
    state.result = { data: null, error: { message: "Function timed out" } };
    const { result } = render();
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(state.invokes).toHaveLength(3);
    expect(result.current.error).toBe(
      "A conexão com o servidor foi interrompida. Tente novamente em alguns instantes.",
    );
    // Nothing was ever loaded, so there is no good value to keep. The page has
    // to branch on `error` here — a null status alone does not mean "no plan".
    expect(result.current.status).toBeNull();
  });

  it("surfaces an error carried in a 200 body", async () => {
    state.result = { data: { error: "assinatura indisponível" }, error: null };
    const { result } = render();
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.error).toBe("assinatura indisponível");
    expect(result.current.status).toBeNull();
  });

  it("falls back to a readable message when the failure carries none", async () => {
    state.result = { data: null, error: { message: "" } };
    const { result } = render();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe("Falha ao carregar assinatura");
  });

  it("keeps the last known good status when a refetch fails", async () => {
    const { result } = render();
    await waitFor(() => expect(result.current.status?.isActive).toBe(true));

    state.result = { data: null, error: { message: "502 Bad Gateway" } };
    await act(async () => {
      await result.current.refresh();
    });

    // The regression this guards: nulling the status here would make the
    // billing page tell a paying customer they have no subscription and offer
    // them a plan, i.e. a second charge on a transient blip.
    expect(result.current.error).toBe("502 Bad Gateway");
    expect(result.current.status?.isActive).toBe(true);
    expect(result.current.status?.subscription?.id).toBe("sub1");
  });

  it("clears the error once a later fetch succeeds", async () => {
    state.result = { data: null, error: { message: "502 Bad Gateway" } };
    const { result } = render();
    await waitFor(() => expect(result.current.error).toBe("502 Bad Gateway"));

    ok();
    await act(async () => {
      await result.current.refresh();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.status?.isActive).toBe(true);
  });
});

describe("useSubscriptionStatus realtime", () => {
  it("watches only the active organization's subscription rows and detaches on unmount", async () => {
    const { result, unmount } = render();
    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(state.channels).toHaveLength(1);
    const ch = state.channels[0];
    expect(ch.subscribed).toBe(true);
    expect(ch.event).toBe("postgres_changes");
    expect(ch.config).toMatchObject({
      event: "*",
      schema: "public",
      table: "subscriptions",
      // Tenant isolation: without this filter every client would wake up on
      // every other client's billing change.
      filter: "organization_id=eq.11111111-1111-4111-8111-111111111111",
    });

    unmount();
    expect(state.removed).toHaveLength(1);
  });

  it("refetches when the subscription row changes", async () => {
    const { result } = render();
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.status?.willCancel).toBe(false);

    ok(statusPayload({ willCancel: true }));
    await act(async () => {
      state.channels[0].handler?.();
    });

    await waitFor(() => expect(result.current.status?.willCancel).toBe(true));
    expect(state.invokes).toHaveLength(2);
  });

  it("gives each mount its own channel name", async () => {
    const a = render();
    await waitFor(() => expect(a.result.current.loading).toBe(false));
    const b = render();
    await waitFor(() => expect(b.result.current.loading).toBe(false));

    // Supabase keys channels by topic, so two mounts sharing a name would
    // leave the second one deaf. Both names must still be scoped to the org.
    expect(state.channels).toHaveLength(2);
    expect(state.channels[0].name).not.toBe(state.channels[1].name);
    expect(
      state.channels.every((c) =>
        c.name.startsWith("sub-status-11111111-1111-4111-8111-111111111111-"),
      ),
    ).toBe(true);

    a.unmount();
    b.unmount();
    expect(state.removed).toHaveLength(2);
  });
});
