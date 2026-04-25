import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type SourceFilter = "all" | "direct" | "organic" | "social" | "paid" | "referral" | "email";
export type DeviceFilter = "all" | "desktop" | "mobile" | "tablet";

export const SOURCE_OPTIONS: Array<{ value: SourceFilter; label: string }> = [
  { value: "all", label: "Todas as origens" },
  { value: "direct", label: "Direto" },
  { value: "organic", label: "Orgânico" },
  { value: "social", label: "Social" },
  { value: "paid", label: "Pago" },
  { value: "referral", label: "Referência" },
  { value: "email", label: "E-mail" },
];

export const DEVICE_OPTIONS: Array<{ value: DeviceFilter; label: string }> = [
  { value: "all", label: "Todos os dispositivos" },
  { value: "desktop", label: "Desktop" },
  { value: "mobile", label: "Mobile" },
  { value: "tablet", label: "Tablet" },
];

interface FilterState {
  source: SourceFilter;
  device: DeviceFilter;
}

interface DashboardFiltersContextValue extends FilterState {
  projectId?: string;
  setSource: (s: SourceFilter) => void;
  setDevice: (d: DeviceFilter) => void;
  reset: () => void;
  hasActiveFilters: boolean;
}

const DashboardFiltersContext = createContext<DashboardFiltersContextValue | null>(null);

const DEFAULT_STATE: FilterState = { source: "all", device: "all" };

const storageKey = (projectId?: string) =>
  projectId ? `dashboard-filters:${projectId}` : null;

const readStored = (projectId?: string): FilterState => {
  const key = storageKey(projectId);
  if (!key || typeof window === "undefined") return DEFAULT_STATE;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return {
      source: (parsed.source as SourceFilter) ?? "all",
      device: (parsed.device as DeviceFilter) ?? "all",
    };
  } catch {
    return DEFAULT_STATE;
  }
};

interface ProviderProps {
  projectId?: string;
  children: ReactNode;
}

export const DashboardFiltersProvider = ({ projectId, children }: ProviderProps) => {
  const [state, setState] = useState<FilterState>(() => readStored(projectId));

  // Reload state when project changes (filters are scoped per project).
  useEffect(() => {
    setState(readStored(projectId));
  }, [projectId]);

  // Persist on change.
  useEffect(() => {
    const key = storageKey(projectId);
    if (!key || typeof window === "undefined") return;
    try {
      window.localStorage.setItem(key, JSON.stringify(state));
    } catch {
      /* ignore quota errors */
    }
  }, [projectId, state]);

  const setSource = useCallback((source: SourceFilter) => setState((s) => ({ ...s, source })), []);
  const setDevice = useCallback((device: DeviceFilter) => setState((s) => ({ ...s, device })), []);
  const reset = useCallback(() => setState(DEFAULT_STATE), []);

  const value = useMemo<DashboardFiltersContextValue>(
    () => ({
      ...state,
      projectId,
      setSource,
      setDevice,
      reset,
      hasActiveFilters: state.source !== "all" || state.device !== "all",
    }),
    [state, projectId, setSource, setDevice, reset],
  );

  return <DashboardFiltersContext.Provider value={value}>{children}</DashboardFiltersContext.Provider>;
};

export const useDashboardFilters = () => {
  const ctx = useContext(DashboardFiltersContext);
  if (!ctx) throw new Error("useDashboardFilters must be used inside DashboardFiltersProvider");
  return ctx;
};
