import { createContext, useContext, useEffect, useState, ReactNode } from "react";

import { readThemePreference, THEME_CHOICE_KEY, type Theme } from "@/lib/theme-preference";

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}


const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  toggleTheme: () => {},
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

const applyTheme = (t: Theme) => {
  const root = document.documentElement;
  if (t === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
};

export const getInitialTheme = readThemePreference;

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => getInitialTheme());

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const setTheme = (t: Theme) => {
    try { window.localStorage.setItem(THEME_CHOICE_KEY, t); } catch { /* storage may be disabled */ }
    setThemeState(t);
  };
  const toggleTheme = () => setTheme(theme === "dark" ? "light" : "dark");

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
