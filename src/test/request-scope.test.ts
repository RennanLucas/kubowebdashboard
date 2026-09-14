import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { useRequestScope } from "@/hooks/useRequestScope";

afterEach(cleanup);
describe("asynchronous request ownership", () => {
  it("invalidates pending work after changing users, organizations or projects", () => {
    const { result, rerender } = renderHook(({ key }) => useRequestScope(key), { initialProps: { key: "user:org:A" } });
    const isCurrent = result.current();
    expect(isCurrent()).toBe(true);
    rerender({ key: "user:org:B" });
    expect(isCurrent()).toBe(false);
    // Returning to A must not revive the old in-flight request.
    rerender({ key: "user:org:A" });
    expect(isCurrent()).toBe(false);
    expect(result.current()()).toBe(true);
  });
  it("does not invalidate an ordinary rerender but rejects unmounted results", () => {
    const { result, rerender, unmount } = renderHook(() => useRequestScope("user:org:A"));
    const isCurrent = result.current();
    act(() => rerender());
    expect(isCurrent()).toBe(true);
    unmount();
    expect(isCurrent()).toBe(false);
  });
});
