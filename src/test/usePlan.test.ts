import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { setPlanPreview } from "@/lib/plan-preview";
import { PLAN_CAPABILITIES } from "@/lib/plan-features";
import { usePlan } from "@/hooks/usePlan";

// Auth/subscription/admin are network-backed; the preview is real (localStorage)
// so the hook's reaction to a preview switch is exercised end to end.
const { useAuthMock, useSubscriptionMock, useIsAdminMock } = vi.hoisted(() => ({
  useAuthMock: vi.fn(),
  useSubscriptionMock: vi.fn(),
  useIsAdminMock: vi.fn(),
}));

vi.mock("@/contexts/AuthContext", () => ({ useAuth: useAuthMock }));
vi.mock("@/hooks/useSubscription", () => ({ useSubscription: useSubscriptionMock }));
vi.mock("@/hooks/useIsAdmin", () => ({ useIsAdmin: useIsAdminMock }));

function setup(opts: { isActive?: boolean; subLoading?: boolean; isAdmin?: boolean; adminLoading?: boolean } = {}) {
  useAuthMock.mockReturnValue({ user: { id: "u1" }, loading: false });
  useSubscriptionMock.mockReturnValue({
    subscription: opts.isActive ? { id: "sub1", status: "active" } : null,
    isActive: !!opts.isActive,
    loading: !!opts.subLoading,
  });
  useIsAdminMock.mockReturnValue({ isAdmin: !!opts.isAdmin, loading: !!opts.adminLoading });
}

beforeEach(() => {
  window.localStorage.clear();
  vi.clearAllMocks();
});

describe("usePlan tier resolution", () => {
  it("defaults to free when there is no active subscription", () => {
    setup();
    const { result } = renderHook(() => usePlan());
    expect(result.current.tier).toBe("free");
    expect(result.current.isFree).toBe(true);
    expect(result.current.isPro).toBe(false);
    expect(result.current.isPreview).toBe(false);
  });

  it("promotes to pro on an active subscription and exposes the pro limits", () => {
    setup({ isActive: true });
    const { result } = renderHook(() => usePlan());
    expect(result.current.tier).toBe("pro");
    expect(result.current.isPro).toBe(true);
    expect(result.current.label).toBe(PLAN_CAPABILITIES.pro.label);
    expect(result.current.maxProjects).toBe(Number.POSITIVE_INFINITY);
    expect(result.current.maxHistoryDays).toBe(365);
    expect(result.current.aiMonthlyLimit).toBe(10);
  });

  it("exposes the free limits on the free tier", () => {
    setup();
    const { result } = renderHook(() => usePlan());
    expect(result.current.label).toBe(PLAN_CAPABILITIES.free.label);
    expect(result.current.maxProjects).toBe(1);
    expect(result.current.maxHistoryDays).toBe(7);
    expect(result.current.aiMonthlyLimit).toBe(0);
  });

  it("promotes admins to pro without a subscription", () => {
    setup({ isAdmin: true });
    const { result } = renderHook(() => usePlan());
    expect(result.current.tier).toBe("pro");
  });

  it("lets a preview downgrade an admin — the preview wins over the admin bypass", () => {
    setPlanPreview("free");
    setup({ isAdmin: true, isActive: true });
    const { result } = renderHook(() => usePlan());
    expect(result.current.isPreview).toBe(true);
    expect(result.current.tier).toBe("free");
  });

  it("lets a preview upgrade a free user", () => {
    setPlanPreview("pro");
    setup();
    const { result } = renderHook(() => usePlan());
    expect(result.current.tier).toBe("pro");
    expect(result.current.isPreview).toBe(true);
  });

  it("re-resolves the tier when the preview changes at runtime", () => {
    setup();
    const { result } = renderHook(() => usePlan());
    expect(result.current.tier).toBe("free");

    act(() => setPlanPreview("pro"));
    expect(result.current.tier).toBe("pro");
    expect(result.current.isPreview).toBe(true);

    act(() => setPlanPreview(null));
    expect(result.current.tier).toBe("free");
    expect(result.current.isPreview).toBe(false);
  });
});

describe("usePlan.can", () => {
  it("follows the free capability map on the free tier", () => {
    setup();
    const { result } = renderHook(() => usePlan());
    expect(result.current.can("in_app_alerts")).toBe(true);
    expect(result.current.can("ai_insights")).toBe(false);
    expect(result.current.can("csv_export")).toBe(false);
  });

  it("unlocks pro features on an active subscription", () => {
    setup({ isActive: true });
    const { result } = renderHook(() => usePlan());
    expect(result.current.can("ai_insights")).toBe(true);
    expect(result.current.can("heatmap")).toBe(true);
  });

  it("bypasses the capability map for admins", () => {
    setup({ isAdmin: true });
    const { result } = renderHook(() => usePlan());
    expect(result.current.can("ai_insights")).toBe(true);
  });

  it("drops the admin bypass while a free preview is active", () => {
    setPlanPreview("free");
    setup({ isAdmin: true, isActive: true });
    const { result } = renderHook(() => usePlan());
    expect(result.current.can("ai_insights")).toBe(false);
    expect(result.current.can("in_app_alerts")).toBe(true);
  });

  it("re-exports requiredTierFor from plan-features", () => {
    setup();
    const { result } = renderHook(() => usePlan());
    expect(result.current.requiredTierFor("in_app_alerts")).toBe("free");
    expect(result.current.requiredTierFor("ai_insights")).toBe("pro");
  });
});

describe("usePlan loading", () => {
  it("is loading while the subscription is in flight", () => {
    setup({ subLoading: true });
    const { result } = renderHook(() => usePlan());
    expect(result.current.loading).toBe(true);
  });

  it("is loading while the admin check is in flight", () => {
    setup({ adminLoading: true });
    const { result } = renderHook(() => usePlan());
    expect(result.current.loading).toBe(true);
  });

  it("settles immediately for admins even with the subscription in flight", () => {
    setup({ isAdmin: true, subLoading: true });
    const { result } = renderHook(() => usePlan());
    expect(result.current.loading).toBe(false);
  });

  it("settles immediately in preview mode even with the subscription in flight", () => {
    setPlanPreview("pro");
    setup({ subLoading: true });
    const { result } = renderHook(() => usePlan());
    expect(result.current.loading).toBe(false);
  });

  it("is settled once both checks resolve", () => {
    setup();
    const { result } = renderHook(() => usePlan());
    expect(result.current.loading).toBe(false);
  });
});

describe("usePlan enabled flag", () => {
  it("passes enabled through to the subscription and admin queries", () => {
    setup();
    renderHook(() => usePlan(false));
    expect(useSubscriptionMock).toHaveBeenCalledWith(false);
    expect(useIsAdminMock).toHaveBeenCalledWith(false);
  });

  it("defaults enabled to true", () => {
    setup();
    renderHook(() => usePlan());
    expect(useSubscriptionMock).toHaveBeenCalledWith(true);
    expect(useIsAdminMock).toHaveBeenCalledWith(true);
  });
});
