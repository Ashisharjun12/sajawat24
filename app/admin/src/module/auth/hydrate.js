import { logout, refresh } from "@/api/auth.api";
import { isAuthSessionError } from "@/api/api";
import { useAuthStore } from "@/store/auth.store";

export async function hydrateAuth() {
  const store = useAuthStore.getState();
  const hasExistingSession = Boolean(store.user && store.accessToken);

  if (!hasExistingSession) {
    store.setStatus("loading");
  }

  try {
    const payload = await refresh();
    if (!payload?.user || payload.user.role !== "admin") {
      try {
        await logout();
      } catch {
        // cookie or token may already be gone
      }
      store.clear();
      return;
    }
    store.setSession(payload);
  } catch (error) {
    if (isAuthSessionError(error)) {
      store.clear();
    } else if (!hasExistingSession) {
      store.setStatus("ready");
    }
  }
}
