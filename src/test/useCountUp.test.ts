import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCountUp } from "@/hooks/useCountUp";

// On mount previousValue === end, so useCountUp settles on `end` immediately
// (no animation). That lets us assert the pure formatting logic deterministically.

describe("useCountUp", () => {
  it("exposes the target value on mount", () => {
    const { result } = renderHook(() => useCountUp(1000));
    expect(result.current.value).toBe(1000);
  });

  it("formats integers with a thousands separator", () => {
    const { result } = renderHook(() => useCountUp(1234567));
    expect(result.current.formatted).toBe("1.234.567");
  });

  it("formats decimals with the configured decimal separator", () => {
    const { result } = renderHook(() => useCountUp(1234.5, { decimals: 2 }));
    expect(result.current.formatted).toBe("1.234,50");
  });

  it("applies prefix and suffix", () => {
    const { result } = renderHook(() =>
      useCountUp(50, { prefix: "R$ ", suffix: "%" }),
    );
    expect(result.current.formatted).toBe("R$ 50%");
  });

  it("honours custom separators", () => {
    const { result } = renderHook(() =>
      useCountUp(1234.5, { decimals: 1, separator: ",", decimalSeparator: "." }),
    );
    expect(result.current.formatted).toBe("1,234.5");
  });

  it("jumps straight to a new value when animateOnChange is false", () => {
    const { result, rerender } = renderHook(
      ({ end }) => useCountUp(end, { animateOnChange: false }),
      { initialProps: { end: 10 } },
    );
    expect(result.current.value).toBe(10);
    rerender({ end: 250 });
    expect(result.current.value).toBe(250);
    expect(result.current.formatted).toBe("250");
  });
});
