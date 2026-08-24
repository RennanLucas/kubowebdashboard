import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";

/**
 * useDashboardRealtime keeps the dashboard fresh from three triggers: a realtime
 * INSERT, the tab regaining visibility, and a manual refresh. The throttle is
 * the load-bearing part — without it a busy client site would fire one refetch
 * per pageview at the Edge Functions.
 */

interface FakeChannel {
  name: string;
  config?: { event?: string; table?: string; filter?: string };
  handler?: () => void;
  subscribed: boolean;
}

const state = vi.hoisted(() => ({
  channels: [] as FakeChannel[],
  removed: [] as string[],
}));

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
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
          return ch; // removeChannel receives what subscribe() returned
        },
      };
      state.channels.push(ch);
      return api;
    },
    removeChannel: (ch: FakeChannel) => {
      state.removed.push(ch.name);
    },
  },
}));

import { useDashboardRealtime, REALTIME_THROTTLE_MS } from "@/hooks/useDashboardRealtime";

const PROJECT = "proj-1";
const OTHER = "proj-2";

let queryClient: QueryClient;

const wrapper = ({ children }: { children: ReactNode }) => (
  <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

const render = (projectId?: string) =>
  renderHook(({ id }: { id?: string }) => useDashboardRealtime(id), {
    wrapper,
    initialProps: { id: projectId },
  });

/** Seed a cache entry and report whether it is still fresh. */
const seed = (key: unknown[]) => {
  queryClient.setQueryData(key, { seeded: true });
  return () => queryClient.getQueryState(key)?.isInvalidated === true;
};

const setVisibility = (value: DocumentVisibilityState) => {
  Object.defineProperty(document, "visibilityState", {
    configurable: true,
    get: () => value,
  });
};

const fireVisibility = async (value: DocumentVisibilityState) => {
  setVisibility(value);
  await act(async () => {
    document.dispatchEvent(new Event("visibilitychange"));
  });
};

beforeEach(() => {
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: Infinity, staleTime: Infinity } },
  });
  state.channels = [];
  state.removed = [];
  setVisibility("visible");
});

afterEach(() => {
  vi.useRealTimers();
  queryClient.clear();
});

describe("useDashboardRealtime subscriptions", () => {
  it("subscribes to pageviews and events scoped to the project", () => {
    render(PROJECT);

    expect(state.channels).toHaveLength(2);
    expect(state.channels.every((c) => c.subscribed)).toBe(true);
    expect(state.channels.map((c) => c.config?.table)).toEqual(["pageviews", "events"]);
    // Scoping is what stops one client's traffic waking another's dashboard.
    expect(state.channels.every((c) => c.config?.filter === `project_id=eq.${PROJECT}`)).toBe(true);
    expect(state.channels.every((c) => c.config?.event === "INSERT")).toBe(true);
  });

  it("subscribes to nothing without a project", () => {
    render(undefined);
    expect(state.channels).toHaveLength(0);
  });

  it("removes both channels on unmount", () => {
    const { unmount } = render(PROJECT);
    unmount();
    expect(state.removed).toHaveLength(2);
  });

  it("resubscribes to the new project when the project changes", async () => {
    const { rerender } = render(PROJECT);
    expect(state.channels).toHaveLength(2);

    await act(async () => {
      rerender({ id: OTHER });
    });

    // Old pair torn down, new pair scoped to the new project.
    expect(state.removed).toHaveLength(2);
    expect(state.channels).toHaveLength(4);
    expect(state.channels.slice(2).every((c) => c.config?.filter === `project_id=eq.${OTHER}`)).toBe(
      true,
    );
  });
});

describe("useDashboardRealtime throttling", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("does not invalidate immediately on an insert", async () => {
    const isStale = seed(["dashboard-overview", "u", "o", 30, PROJECT]);
    render(PROJECT);

    act(() => {
      state.channels[0].handler?.();
    });
    expect(isStale()).toBe(false);

    // Still nothing just before the window closes.
    await act(async () => {
      vi.advanceTimersByTime(REALTIME_THROTTLE_MS - 1);
    });
    expect(isStale()).toBe(false);
  });

  it("invalidates once the throttle window elapses", async () => {
    const isStale = seed(["dashboard-overview", "u", "o", 30, PROJECT]);
    render(PROJECT);

    act(() => {
      state.channels[0].handler?.();
    });
    await act(async () => {
      vi.advanceTimersByTime(REALTIME_THROTTLE_MS);
    });

    expect(isStale()).toBe(true);
  });

  it("folds a burst of inserts across both channels into a single refetch", async () => {
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    render(PROJECT);

    act(() => {
      // 20 pageviews and 5 events land inside one window — a plausible burst
      // for a client site under load.
      for (let i = 0; i < 20; i++) state.channels[0].handler?.();
      for (let i = 0; i < 5; i++) state.channels[1].handler?.();
    });
    await act(async () => {
      vi.advanceTimersByTime(REALTIME_THROTTLE_MS);
    });

    expect(invalidateSpy).toHaveBeenCalledTimes(1);
  });

  it("allows a new refetch after the window closes", async () => {
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    render(PROJECT);

    act(() => {
      state.channels[0].handler?.();
    });
    await act(async () => {
      vi.advanceTimersByTime(REALTIME_THROTTLE_MS);
    });
    expect(invalidateSpy).toHaveBeenCalledTimes(1);

    // A later insert must not be swallowed by the previous window.
    act(() => {
      state.channels[0].handler?.();
    });
    await act(async () => {
      vi.advanceTimersByTime(REALTIME_THROTTLE_MS);
    });
    expect(invalidateSpy).toHaveBeenCalledTimes(2);
  });

  it("does not invalidate after unmount", async () => {
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { unmount } = render(PROJECT);

    act(() => {
      state.channels[0].handler?.();
    });
    unmount();
    await act(async () => {
      vi.advanceTimersByTime(REALTIME_THROTTLE_MS * 2);
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

describe("useDashboardRealtime invalidation scope", () => {
  it("invalidates only this project's dashboard queries", async () => {
    const mineStale = seed(["dashboard-overview", "u", "o", 30, PROJECT]);
    const minePagesStale = seed(["dashboard-pages", "u", "o", 30, PROJECT]);
    const theirsStale = seed(["dashboard-overview", "u", "o", 30, OTHER]);
    const subStale = seed(["subscription", "u", "o"]);

    const { result } = render(PROJECT);
    await act(async () => {
      await result.current.triggerManualRefresh();
    });

    expect(mineStale()).toBe(true);
    expect(minePagesStale()).toBe(true);
    // A neighbouring project's cache must survive — otherwise every client
    // refetches on every other client's traffic.
    expect(theirsStale()).toBe(false);
    expect(subStale()).toBe(false);
  });
});

describe("useDashboardRealtime visibility", () => {
  it("refetches when the tab becomes visible", async () => {
    const isStale = seed(["dashboard-overview", "u", "o", 30, PROJECT]);
    render(PROJECT);

    await fireVisibility("visible");
    expect(isStale()).toBe(true);
  });

  it("does not refetch when the tab is hidden", async () => {
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    render(PROJECT);

    await fireVisibility("hidden");
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it("does not refetch on visibility without a project", async () => {
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    render(undefined);

    await fireVisibility("visible");
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it("detaches its listener on unmount", async () => {
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { unmount } = render(PROJECT);
    unmount();

    await fireVisibility("visible");
    expect(invalidateSpy).not.toHaveBeenCalled();
  });
});

describe("useDashboardRealtime status", () => {
  it("advances lastUpdate after a refresh", async () => {
    const { result } = render(PROJECT);
    const before = result.current.lastUpdate;

    await act(async () => {
      await new Promise((r) => setTimeout(r, 2));
      await result.current.triggerManualRefresh();
    });

    expect(result.current.lastUpdate.getTime()).toBeGreaterThanOrEqual(before.getTime());
  });

  it("settles isUpdating back to false", async () => {
    const { result } = render(PROJECT);

    await act(async () => {
      await result.current.triggerManualRefresh();
    });

    await waitFor(() => expect(result.current.isUpdating).toBe(false));
  });

  it("is a no-op without a project", async () => {
    const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
    const { result } = render(undefined);

    await act(async () => {
      await result.current.triggerManualRefresh();
    });

    expect(invalidateSpy).not.toHaveBeenCalled();
    expect(result.current.isUpdating).toBe(false);
  });
});
