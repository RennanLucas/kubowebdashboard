import { describe, it, expect, vi, beforeEach } from "vitest";
import {
  getPlanPreview,
  setPlanPreview,
  subscribePlanPreview,
} from "@/lib/plan-preview";

const KEY = "kuboweb.plan-preview";

beforeEach(() => {
  window.localStorage.clear();
});

describe("getPlanPreview", () => {
  it("returns null when nothing is stored", () => {
    expect(getPlanPreview()).toBeNull();
  });

  it("returns the stored tier when it is a valid value", () => {
    window.localStorage.setItem(KEY, "pro");
    expect(getPlanPreview()).toBe("pro");
    window.localStorage.setItem(KEY, "free");
    expect(getPlanPreview()).toBe("free");
  });

  it("returns null for an invalid stored value", () => {
    window.localStorage.setItem(KEY, "enterprise");
    expect(getPlanPreview()).toBeNull();
  });
});

describe("setPlanPreview", () => {
  it("persists a tier so getPlanPreview reads it back", () => {
    setPlanPreview("pro");
    expect(window.localStorage.getItem(KEY)).toBe("pro");
    expect(getPlanPreview()).toBe("pro");
  });

  it("removes the key when set to null", () => {
    setPlanPreview("pro");
    setPlanPreview(null);
    expect(window.localStorage.getItem(KEY)).toBeNull();
    expect(getPlanPreview()).toBeNull();
  });

  it("dispatches a preview event carrying the new tier", () => {
    const detail: unknown[] = [];
    const handler = (e: Event) => detail.push((e as CustomEvent).detail);
    window.addEventListener("kuboweb:plan-preview", handler);
    setPlanPreview("free");
    window.removeEventListener("kuboweb:plan-preview", handler);
    expect(detail).toEqual(["free"]);
  });
});

describe("subscribePlanPreview", () => {
  it("invokes the callback on change and stops after unsubscribe", () => {
    const cb = vi.fn();
    const unsubscribe = subscribePlanPreview(cb);

    setPlanPreview("pro");
    expect(cb).toHaveBeenCalledTimes(1);

    setPlanPreview("free");
    expect(cb).toHaveBeenCalledTimes(2);

    unsubscribe();
    setPlanPreview(null);
    expect(cb).toHaveBeenCalledTimes(2);
  });
});
