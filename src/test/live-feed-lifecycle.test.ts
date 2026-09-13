import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
const mock = vi.hoisted(() => ({
  query: vi.fn(), remove: vi.fn(),
  insert: null as null | ((payload: { new: unknown }) => void),
  status: null as null | ((status: string) => void),
}));
vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    from: () => { const query = {
      select: () => query, eq: () => query, gte: () => query,
      order: () => query, limit: () => mock.query(),
    }; return query; },
    channel: () => { const channel = {
      on: (_event: string, _filter: unknown, callback: typeof mock.insert) => { mock.insert = callback; return channel; },
      subscribe: (callback: typeof mock.status) => { mock.status = callback; return channel; },
    }; return channel; },
    removeChannel: mock.remove,
  },
}));
import { useLiveFeed } from "@/hooks/useLiveFeed";
const row = (id: string, age = 0) => ({
  id, created_at: new Date(Date.now() - age).toISOString(),
  page_path: "/", city: null, country: null, referrer: null,
});
const flush = async () => { await act(async () => { await Promise.resolve(); }); };
beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(new Date("2026-09-13T12:00:00Z"));
  mock.query.mockReset().mockResolvedValue({ data: [], error: null });
  mock.remove.mockReset();
});
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe("live feed lifecycle", () => {
  it("deduplicates realtime events and expires visits without another event", async () => {
    const visit = row("a", 30 * 60000 - 5000);
    mock.query.mockResolvedValue({ data: [visit], error: null });
    const { result } = renderHook(() => useLiveFeed("A"));
    await flush();
    act(() => mock.insert?.({ new: visit }));
    expect(result.current.visitors).toHaveLength(1);
    await act(async () => { await vi.advanceTimersByTimeAsync(10000); });
    expect(result.current.visitors).toEqual([]);
  });
  it("does not leak the previous project or late responses after switching", async () => {
    let resolve!: (result: { data: ReturnType<typeof row>[]; error: null }) => void;
    mock.query.mockReturnValueOnce(new Promise(done => { resolve = done; }));
    const { result, rerender } = renderHook(({ id }) => useLiveFeed(id), { initialProps: { id: "A" } });
    act(() => mock.insert?.({ new: row("a") }));
    rerender({ id: "B" });
    await flush();
    await act(async () => { resolve({ data: [row("late-A")], error: null }); });
    expect(result.current.visitors).toEqual([]);
    expect(mock.remove).toHaveBeenCalledTimes(1);
  });
  it("keeps events received during initial loading", async () => {
    let resolve!: (result: { data: ReturnType<typeof row>[]; error: null }) => void;
    mock.query.mockReturnValueOnce(new Promise(done => { resolve = done; }));
    const { result } = renderHook(() => useLiveFeed("A"));
    act(() => mock.insert?.({ new: row("fresh") }));
    await act(async () => { resolve({ data: [row("old", 1000)], error: null }); });
    expect(result.current.visitors.map(item => item.id)).toEqual(["fresh", "old"]);
  });
  it("exposes request failure and allows retry", async () => {
    mock.query.mockResolvedValueOnce({ data: null, error: { message: "denied" } });
    const { result } = renderHook(() => useLiveFeed("A"));
    await flush();
    expect(result.current.error).toContain("Não foi possível");
    act(() => result.current.retry());
    await flush();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });
  it("reports stream failure and recovers on reconnect, cleaning up timers", async () => {
    const { result, unmount } = renderHook(() => useLiveFeed("A"));
    await flush();
    act(() => mock.status?.("CHANNEL_ERROR"));
    expect(result.current.error).toContain("interrompida");
    act(() => mock.status?.("SUBSCRIBED"));
    await flush();
    expect(result.current.error).toBeNull();
    unmount();
    expect(vi.getTimerCount()).toBe(0);
    expect(mock.remove).toHaveBeenCalledTimes(1);
  });
});
