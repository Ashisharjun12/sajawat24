import { useEffect } from "react";
import { isAuthSessionError, refreshSession } from "@/api/api";
import { useAuthStore } from "@/store/auth.store";

const REFRESH_MARGIN_MS = 2 * 60_000;
const INITIAL_RETRY_DELAY_MS = 15_000;
const MAX_RETRY_DELAY_MS = 60_000;
const FALLBACK_REFRESH_DELAY_MS = 10 * 60_000;

function millisecondsUntilRefresh(accessToken) {
  if (!accessToken) return 0;
  try {
    const encodedPayload = accessToken.split(".")[1];
    if (!encodedPayload) return FALLBACK_REFRESH_DELAY_MS;

    const base64 = encodedPayload
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(encodedPayload.length / 4) * 4, "=");
    const payload = JSON.parse(window.atob(base64));
    if (typeof payload.exp !== "number") return FALLBACK_REFRESH_DELAY_MS;

    return Math.max(0, payload.exp * 1000 - Date.now() - REFRESH_MARGIN_MS);
  } catch {
    return FALLBACK_REFRESH_DELAY_MS;
  }
}

export function SessionRefresher() {
  const accessToken = useAuthStore((state) => state.accessToken);
  const refreshToken = useAuthStore((state) => state.refreshToken);

  useEffect(() => {
    if (!accessToken && !refreshToken) return undefined;

    let timer;
    let stopped = false;
    let retryDelay = INITIAL_RETRY_DELAY_MS;

    function scheduleRefresh(delay) {
      window.clearTimeout(timer);
      timer = window.setTimeout(refresh, delay);
    }

    async function refresh() {
      if (typeof navigator !== "undefined" && !navigator.onLine) {
        if (!stopped) scheduleRefresh(retryDelay);
        return;
      }

      try {
        await refreshSession();
        retryDelay = INITIAL_RETRY_DELAY_MS;
      } catch (error) {
        if (isAuthSessionError(error)) {
          useAuthStore.getState().clear();
          if (window.location.pathname !== "/login") {
            window.location.assign("/login");
          }
          return;
        }

        if (!stopped) {
          scheduleRefresh(retryDelay);
          retryDelay = Math.min(retryDelay * 1.5, MAX_RETRY_DELAY_MS);
        }
      }
    }

    function refreshIfExpiring() {
      if (
        document.visibilityState === "visible" &&
        millisecondsUntilRefresh(accessToken) <= 60_000
      ) {
        void refresh();
      }
    }

    function handleOnline() {
      if (millisecondsUntilRefresh(accessToken) <= 60_000) {
        void refresh();
      }
    }

    if (!accessToken && refreshToken) {
      void refresh();
    } else {
      scheduleRefresh(millisecondsUntilRefresh(accessToken));
    }

    document.addEventListener("visibilitychange", refreshIfExpiring);
    window.addEventListener("focus", refreshIfExpiring);
    window.addEventListener("online", handleOnline);

    return () => {
      stopped = true;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", refreshIfExpiring);
      window.removeEventListener("focus", refreshIfExpiring);
      window.removeEventListener("online", handleOnline);
    };
  }, [accessToken, refreshToken]);

  return null;
}
