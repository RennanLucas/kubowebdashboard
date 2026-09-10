import { beforeEach, describe, expect, it, vi } from "vitest";
import { readThemePreference, THEME_CHOICE_KEY } from "@/lib/theme-preference";
beforeEach(() => { vi.restoreAllMocks(); localStorage.clear(); });
describe("white-first theme", () => {
  it("defaults to white", () => expect(readThemePreference()).toBe("light"));
  it("ignores the old automatically persisted dark default", () => {
    localStorage.setItem("kuboweb:theme", "dark"); expect(readThemePreference()).toBe("light");
  });
  it("honors an explicit dark choice", () => {
    localStorage.setItem(THEME_CHOICE_KEY, "dark"); expect(readThemePreference()).toBe("dark");
  });
  it("handles blocked browser storage", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => { throw new Error("blocked"); });
    expect(readThemePreference()).toBe("light");
  });
});
