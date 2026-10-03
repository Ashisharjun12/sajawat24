import { logout, refresh } from "@/api/auth.api";
import { useAuthStore } from "@/store/auth.store";
import { useCartStore } from "@/store/cart.store";
import { isConsumerAppEligible } from "@/module/auth/lib/consumer-eligibility";

export { isConsumerAppEligible, isConsumerAppEligible as isCustomer } from "@/module/auth/lib/consumer-eligibility";

export async function applyCustomerSession(payload) {
  if (!isConsumerAppEligible(payload?.user)) {
    try {
      await logout();
    } catch {
      // cookie may already be gone
    }
    useAuthStore.getState().clear();
    throw new Error("This Google account cannot sign in here");
  }
  useAuthStore.getState().setSession(payload);
  try {
    await useCartStore.getState().merge();
  } catch {
    try {
      await useCartStore.getState().load();
    } catch {
      // bag hydrate is best-effort after login
    }
  }
}

export async function hydrateAuth() {
  const store = useAuthStore.getState();
  store.setStatus("loading");
  try {
    const payload = await refresh();
    await applyCustomerSession(payload);
  } catch {
    const { user, accessToken } = useAuthStore.getState();
    if (!user && !accessToken) {
      store.clear();
    } else {
      store.setStatus("ready");
    }
  }
}
