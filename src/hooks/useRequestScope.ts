import { useEffect, useRef } from "react";

/** Invalidate asynchronous work when its owner changes, including A → B → A. */
export function useRequestScope(key: string) {
  const state = useRef({ key, revision: 0, mounted: true });
  if (state.current.key !== key) {
    state.current.key = key;
    state.current.revision += 1;
  }
  useEffect(() => {
    state.current.mounted = true;
    return () => { state.current.mounted = false; state.current.revision += 1; };
  }, []);
  return () => {
    const revision = state.current.revision;
    return () => state.current.mounted && state.current.revision === revision;
  };
}
