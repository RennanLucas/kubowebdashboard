import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

interface ThemeContextType {
  theme: Theme;
  resolvedTheme: ResolvedTheme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
}

export const CANONICAL_STORAGE_KEY = "kuboweb:theme";
export const LEGACY_STORAGE_KEY = "theme";
export const STORAGE_KEY = CANONICAL_STORAGE_KEY;

const ThemeContext = createContext<ThemeContextType>({
  theme: "light",
  resolvedTheme: "light",
  toggleTheme: () => {},
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export const applyTheme = (resolved: ResolvedTheme) => {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (resolved === "dark") {
    root.classList.add("dark");
  } else {
    root.classList.remove("dark");
  }
  const metaTheme = document.querySelector('meta[name="theme-color"]');
  if (metaTheme) {
    metaTheme.setAttribute("content", resolved === "dark" ? "#0a0b14" : "#ffffff");
  }
};

export const getInitialTheme = (): Theme => {
  if (typeof window === "undefined") return "light";
  try {
    let stored = window.localStorage.getItem(CANONICAL_STORAGE_KEY);
    if (!stored) {
      stored = window.localStorage.getItem(LEGACY_STORAGE_KEY);
      if (stored && (stored === "dark" || stored === "light" || stored === "system")) {
        try {
          window.localStorage.setItem(CANONICAL_STORAGE_KEY, stored);
        } catch {
          /* ignore */
        }
      }
    }
    if (stored === "dark" || stored === "light" || stored === "system") {
      return stored;
    }
  } catch {
    /* ignore storage errors */
  }
  // Primeiro acesso: SEMPRE claro, independentemente do OS
  return "light";
};

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setThemeState] = useState<Theme>(() => getInitialTheme());
  const [resolvedTheme, setResolvedTheme] = useState<ResolvedTheme>(() => {
    const initial = getInitialTheme();
    if (initial === "system") {
      if (typeof window !== "undefined" && window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
      }
      return "light";
    }
    return initial;
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const computeResolved = (t: Theme): ResolvedTheme => {
      if (t === "dark") return "dark";
      if (t === "light") return "light";
      if (window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches) {
        return "dark";
      }
      return "light";
    };

    const resolved = computeResolved(theme);
    setResolvedTheme(resolved);
    applyTheme(resolved);

    try {
      window.localStorage.setItem(STORAGE_KEY, theme);
      window.localStorage.setItem(LEGACY_STORAGE_KEY, theme);
    } catch {
      /* ignore storage errors */
    }

    if (theme === "system" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent | MediaQueryList) => {
        const nextResolved: ResolvedTheme = e.matches ? "dark" : "light";
        setResolvedTheme(nextResolved);
        applyTheme(nextResolved);
      };

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener("change", handleChange);
        return () => mediaQuery.removeEventListener("change", handleChange);
      } else if ((mediaQuery as any).addListener) {
        (mediaQuery as any).addListener(handleChange);
        return () => (mediaQuery as any).removeListener(handleChange);
      }
    }
  }, [theme]);

  // Sincronização entre abas abertas
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handleStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY || e.key === LEGACY_STORAGE_KEY) {
        const val = e.newValue;
        if (val === "light" || val === "dark" || val === "system") {
          setThemeState(val);
        }
      }
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  const setTheme = (t: Theme) => setThemeState(t);
  const toggleTheme = () => {
    setThemeState((prev) => {
      if (prev === "dark") return "light";
      if (prev === "light") return "dark";
      return resolvedTheme === "dark" ? "light" : "dark";
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, resolvedTheme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
