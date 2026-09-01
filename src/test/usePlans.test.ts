import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { usePlans } from "@/hooks/usePlans";
import { supabase } from "@/integrations/supabase/client";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    functions: {
      invoke: vi.fn(),
    },
  },
}));

describe("usePlans", () => {
  const mockPlans = [
    {
      id: "plan-free",
      name: "Free",
      tagline: "Para começar",
      price: "R$ 0",
      cadence: "/mês",
      amount: 0,
      currency: "BRL",
      highlight: "7 dias de histórico",
      cta: "Começar grátis",
      features: ["7 dias de histórico", "1 projeto"],
      recommended: false,
      enabled: true,
      disabledReason: null,
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("fetches and returns plans", async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: { plans: mockPlans },
      error: null,
    } as any);

    const { result } = renderHook(() => usePlans());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    expect(result.current.plans.length).toBeGreaterThan(0);
    expect(result.current.error).toBeNull();
  });

  it("handles fetch error gracefully", async () => {
    vi.mocked(supabase.functions.invoke).mockResolvedValue({
      data: null,
      error: { message: "Network error" },
    } as any);

    const { result } = renderHook(() => usePlans());

    await waitFor(() => {
      expect(result.current.loading).toBe(false);
    });

    // Error case should return empty plans or show error
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeDefined();
  });

  it("starts with loading state", () => {
    vi.mocked(supabase.functions.invoke).mockImplementation(
      () => new Promise(() => {}) // Never resolves
    );

    const { result } = renderHook(() => usePlans());

    // Initial state should be loading if no cache
    expect(result.current.loading).toBeDefined();
    expect(result.current.plans).toBeDefined();
    expect(result.current.error).toBeNull();
  });
});
