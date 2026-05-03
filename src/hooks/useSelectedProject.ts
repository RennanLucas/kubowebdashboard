import { useCallback, useEffect, useState } from "react";

export const SELECTED_PROJECT_STORAGE_KEY = "dashboard:last-project-id";
const PROJECT_CHANGED_EVENT = "project-changed";

const readStored = (): string | undefined => {
  if (typeof window === "undefined") return undefined;
  try {
    return window.localStorage.getItem(SELECTED_PROJECT_STORAGE_KEY) ?? undefined;
  } catch {
    return undefined;
  }
};

const writeStored = (id: string | undefined) => {
  if (typeof window === "undefined") return;
  try {
    if (id) window.localStorage.setItem(SELECTED_PROJECT_STORAGE_KEY, id);
    else window.localStorage.removeItem(SELECTED_PROJECT_STORAGE_KEY);
  } catch {
    /* ignore quota / privacy errors */
  }
};

/**
 * Single source of truth for the active project id across the app.
 * - Hydrates from localStorage on mount (so the selector restores the last
 *   project the user picked).
 * - Persists every change back to localStorage.
 * - Broadcasts a `project-changed` CustomEvent so other mounted components
 *   (e.g. dashboard widgets) can react instantly.
 * - Listens to the same event + the cross-tab `storage` event so multiple
 *   tabs / consumers stay in sync.
 */
export const useSelectedProject = () => {
  const [selectedProjectId, setSelectedProjectIdState] = useState<string | undefined>(readStored);

  const setSelectedProjectId = useCallback((id: string | undefined) => {
    setSelectedProjectIdState(id);
    writeStored(id);
    if (typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent(PROJECT_CHANGED_EVENT, { detail: { id } }));
    }
  }, []);

  // Listen to in-app broadcasts and cross-tab storage updates.
  useEffect(() => {
    if (typeof window === "undefined") return;

    const onProjectChanged = (e: Event) => {
      const id = (e as CustomEvent<{ id?: string }>).detail?.id;
      setSelectedProjectIdState(id ?? undefined);
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key !== SELECTED_PROJECT_STORAGE_KEY) return;
      setSelectedProjectIdState(e.newValue ?? undefined);
    };

    window.addEventListener(PROJECT_CHANGED_EVENT, onProjectChanged);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(PROJECT_CHANGED_EVENT, onProjectChanged);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return { selectedProjectId, setSelectedProjectId };
};
