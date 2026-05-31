import { lazy, type ComponentType } from "react";

const CHUNK_RELOAD_KEY_PREFIX = "kuboweb:chunk-reload";
const CHUNK_LOAD_ERROR_PATTERN =
  /(Importing a module script failed|Failed to fetch dynamically imported module|error loading dynamically imported module|Unable to preload CSS|Failed to import module)/i;

const getChunkReloadKey = (scope = "app") => `${CHUNK_RELOAD_KEY_PREFIX}:${scope}`;

const getErrorMessage = (error: unknown) => {
  if (typeof error === "string") return error;
  if (error && typeof error === "object" && "message" in error) {
    return String((error as { message?: unknown }).message ?? "");
  }
  return "";
};

export const isChunkLoadError = (error: unknown) =>
  CHUNK_LOAD_ERROR_PATTERN.test(getErrorMessage(error));

export const tryReloadOnce = (scope = "app") => {
  const key = getChunkReloadKey(scope);

  try {
    if (sessionStorage.getItem(key)) return false;
    sessionStorage.setItem(key, "1");
    window.location.reload();
    return true;
  } catch {
    window.location.reload();
    return true;
  }
};

export const clearChunkReloadGuard = (scope = "app") => {
  try {
    sessionStorage.removeItem(getChunkReloadKey(scope));
  } catch {
    // ignore storage errors
  }
};

export function lazyWithRetry<T extends ComponentType<any>>(
  loader: () => Promise<{ default: T }>,
  scope: string,
) {
  return lazy(async () => {
    try {
      const mod = await loader();
      clearChunkReloadGuard(scope);
      return mod;
    } catch (error) {
      if (typeof window !== "undefined" && isChunkLoadError(error) && tryReloadOnce(scope)) {
        return new Promise<never>(() => {
          // keep Suspense pending while the page reload is triggered
        });
      }

      throw error;
    }
  });
}