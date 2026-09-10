export type Theme = "dark" | "light";
// The old key was automatically populated with dark, even without a user choice.
export const THEME_CHOICE_KEY = "kuboweb:theme-choice:v2";
export function readThemePreference(): Theme {
  try { return localStorage.getItem(THEME_CHOICE_KEY) === "dark" ? "dark" : "light"; }
  catch { return "light"; }
}
