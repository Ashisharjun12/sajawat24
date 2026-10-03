import { logout, refresh } from "@/api/auth.api";
import { useAuthStore } from "@/store/auth.store";

export async function hydrateAuth() {
  const store = useAuthStore.getState();
  store.setStatus("loading");
  try {
    const payload = await refresh();
    if (!payload?.user || payload.user.role !== "admin") {
      try {
        await logout();
      } catch {
        // cookie may already be gone
      }
      store.clear();
      return;
    }
    store.setSession(payload);
  } catch {
    store.clear();
  }
}
