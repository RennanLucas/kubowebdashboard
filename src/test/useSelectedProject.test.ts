import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import {
  useSelectedProject,
  SELECTED_PROJECT_STORAGE_KEY,
} from "@/hooks/useSelectedProject";

beforeEach(() => {
  window.localStorage.clear();
});

describe("useSelectedProject", () => {
  it("starts undefined when nothing is persisted", () => {
    const { result } = renderHook(() => useSelectedProject());
    expect(result.current.selectedProjectId).toBeUndefined();
  });

  it("hydrates from localStorage on mount", () => {
    window.localStorage.setItem(SELECTED_PROJECT_STORAGE_KEY, "proj-1");
    const { result } = renderHook(() => useSelectedProject());
    expect(result.current.selectedProjectId).toBe("proj-1");
  });

  it("updates state and persists on setSelectedProjectId", () => {
    const { result } = renderHook(() => useSelectedProject());
    act(() => result.current.setSelectedProjectId("proj-2"));
    expect(result.current.selectedProjectId).toBe("proj-2");
    expect(window.localStorage.getItem(SELECTED_PROJECT_STORAGE_KEY)).toBe("proj-2");
  });

  it("clears storage when set back to undefined", () => {
    const { result } = renderHook(() => useSelectedProject());
    act(() => result.current.setSelectedProjectId("proj-3"));
    act(() => result.current.setSelectedProjectId(undefined));
    expect(result.current.selectedProjectId).toBeUndefined();
    expect(window.localStorage.getItem(SELECTED_PROJECT_STORAGE_KEY)).toBeNull();
  });

  it("broadcasts changes to other mounted consumers via the project-changed event", () => {
    const a = renderHook(() => useSelectedProject());
    const b = renderHook(() => useSelectedProject());
    act(() => a.result.current.setSelectedProjectId("shared-proj"));
    expect(b.result.current.selectedProjectId).toBe("shared-proj");
  });

  it("syncs from a cross-tab storage event", () => {
    const { result } = renderHook(() => useSelectedProject());
    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", {
          key: SELECTED_PROJECT_STORAGE_KEY,
          newValue: "from-other-tab",
        }),
      );
    });
    expect(result.current.selectedProjectId).toBe("from-other-tab");
  });

  it("ignores storage events for unrelated keys", () => {
    window.localStorage.setItem(SELECTED_PROJECT_STORAGE_KEY, "keep-me");
    const { result } = renderHook(() => useSelectedProject());
    act(() => {
      window.dispatchEvent(
        new StorageEvent("storage", { key: "some-other-key", newValue: "noise" }),
      );
    });
    expect(result.current.selectedProjectId).toBe("keep-me");
  });
});
