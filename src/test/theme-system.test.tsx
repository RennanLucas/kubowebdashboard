import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { renderHook, act, render, screen, fireEvent, waitFor } from "@testing-library/react";
import {
  ThemeProvider,
  useTheme,
  getInitialTheme,
  STORAGE_KEY,
  LEGACY_STORAGE_KEY,
} from "@/contexts/ThemeContext";
import { ThemeToggle } from "@/components/ThemeToggle";

describe("Theme System (Kubo Analytics)", () => {
  let listeners: ((e: any) => void)[] = [];
  let matchesDark = false;

  beforeEach(() => {
    window.localStorage.clear();
    document.documentElement.classList.remove("dark");
    listeners = [];
    matchesDark = false;

    // Mock window.matchMedia
    window.matchMedia = vi.fn().mockImplementation((query: string) => ({
      matches: matchesDark,
      media: query,
      onchange: null,
      addListener: vi.fn((fn) => listeners.push(fn)),
      removeListener: vi.fn((fn) => {
        listeners = listeners.filter((l) => l !== fn);
      }),
      addEventListener: vi.fn((_type, fn) => listeners.push(fn)),
      removeEventListener: vi.fn((_type, fn) => {
        listeners = listeners.filter((l) => l !== fn);
      }),
      dispatchEvent: vi.fn(),
    }));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe("Regra 1: Primeiro Acesso (Padrão Obrigatório = Claro)", () => {
    it("retorna 'light' quando não existe preferência salva no localStorage", () => {
      expect(getInitialTheme()).toBe("light");
    });

    it("abre em Claro mesmo que o SO do usuário esteja em modo escuro", () => {
      matchesDark = true;
      expect(getInitialTheme()).toBe("light");

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      expect(result.current.theme).toBe("light");
      expect(result.current.resolvedTheme).toBe("light");
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    it("a lógica anti-FOUC não adiciona 'dark' no primeiro acesso", () => {
      const stored = window.localStorage.getItem(STORAGE_KEY) || window.localStorage.getItem(LEGACY_STORAGE_KEY);
      let isDark = false;
      if (stored === "dark") {
        isDark = true;
      } else if (stored === "system") {
        isDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
      } else {
        isDark = false;
      }

      if (isDark) {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }

      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });
  });

  describe("Regra 2: Tema Claro Manual", () => {
    it("aplica modo claro, remove classe 'dark' e persiste no localStorage", () => {
      document.documentElement.classList.add("dark");
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      act(() => {
        result.current.setTheme("light");
      });

      expect(result.current.theme).toBe("light");
      expect(result.current.resolvedTheme).toBe("light");
      expect(document.documentElement.classList.contains("dark")).toBe(false);
      expect(window.localStorage.getItem(STORAGE_KEY)).toBe("light");
      expect(window.localStorage.getItem(LEGACY_STORAGE_KEY)).toBe("light");
    });
  });

  describe("Regra 3: Tema Escuro Manual", () => {
    it("aplica dark mode, adiciona classe 'dark' e persiste nas chaves de storage", () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      act(() => {
        result.current.setTheme("dark");
      });

      expect(result.current.theme).toBe("dark");
      expect(result.current.resolvedTheme).toBe("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
      expect(window.localStorage.getItem(STORAGE_KEY)).toBe("dark");
      expect(window.localStorage.getItem(LEGACY_STORAGE_KEY)).toBe("dark");
    });

    it("mantém tema escuro após simulação de recarga (F5)", () => {
      window.localStorage.setItem(STORAGE_KEY, "dark");
      expect(getInitialTheme()).toBe("dark");

      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      expect(result.current.theme).toBe("dark");
      expect(result.current.resolvedTheme).toBe("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });
  });

  describe("Regra 4: Modo Sistema (Sincronização com Dispositivo/SO)", () => {
    it("quando SO é escuro, modo 'system' resolve para escuro", () => {
      matchesDark = true;
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      act(() => {
        result.current.setTheme("system");
      });

      expect(result.current.theme).toBe("system");
      expect(result.current.resolvedTheme).toBe("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
      expect(window.localStorage.getItem(STORAGE_KEY)).toBe("system");
    });

    it("quando SO é claro, modo 'system' resolve para claro", () => {
      matchesDark = false;
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      act(() => {
        result.current.setTheme("system");
      });

      expect(result.current.theme).toBe("system");
      expect(result.current.resolvedTheme).toBe("light");
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    it("reage em tempo real quando o SO alterna entre claro e escuro", () => {
      matchesDark = false;
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      act(() => {
        result.current.setTheme("system");
      });

      expect(result.current.resolvedTheme).toBe("light");
      expect(document.documentElement.classList.contains("dark")).toBe(false);

      act(() => {
        matchesDark = true;
        listeners.forEach((listener) => listener({ matches: true }));
      });

      expect(result.current.resolvedTheme).toBe("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);

      act(() => {
        matchesDark = false;
        listeners.forEach((listener) => listener({ matches: false }));
      });

      expect(result.current.resolvedTheme).toBe("light");
      expect(document.documentElement.classList.contains("dark")).toBe(false);
    });
  });

  describe("Regra 5: Sincronização entre Abas (Multi-Tab)", () => {
    it("atualiza o tema quando outra aba altera a chave 'theme'", () => {
      const { result } = renderHook(() => useTheme(), {
        wrapper: ThemeProvider,
      });

      expect(result.current.theme).toBe("light");

      act(() => {
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: STORAGE_KEY,
            newValue: "dark",
          })
        );
      });

      expect(result.current.theme).toBe("dark");
      expect(result.current.resolvedTheme).toBe("dark");
      expect(document.documentElement.classList.contains("dark")).toBe(true);
    });
  });

  describe("Regra 6: Componente Seletor de Tema (ThemeToggle)", () => {
    it("renderiza o seletor com botão acessível", () => {
      render(
        <ThemeProvider>
          <ThemeToggle />
        </ThemeProvider>
      );

      const trigger = screen.getByRole("button", { name: /tema/i });
      expect(trigger).toBeInTheDocument();
      expect(trigger.getAttribute("title")).toContain("Claro");
    });

    it("permite alternar tema através do ThemeProvider e atualizar o botão", () => {
      const Consumer = () => {
        const { setTheme } = useTheme();
        return (
          <div>
            <ThemeToggle />
            <button onClick={() => setTheme("dark")}>Set Dark</button>
            <button onClick={() => setTheme("system")}>Set System</button>
          </div>
        );
      };

      render(
        <ThemeProvider>
          <Consumer />
        </ThemeProvider>
      );

      const trigger = screen.getByRole("button", { name: /tema/i });
      expect(trigger.getAttribute("title")).toContain("Claro");

      fireEvent.click(screen.getByText("Set Dark"));
      expect(window.localStorage.getItem(STORAGE_KEY)).toBe("dark");
      expect(trigger.getAttribute("title")).toContain("Escuro");
      expect(document.documentElement.classList.contains("dark")).toBe(true);

      fireEvent.click(screen.getByText("Set System"));
      expect(window.localStorage.getItem(STORAGE_KEY)).toBe("system");
      expect(trigger.getAttribute("title")).toContain("Sistema");
    });
  });
});
