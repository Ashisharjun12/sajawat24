import { create } from "zustand";
import { useWishlistStore } from "@/store/wishlist.store";

export const useAuthStore = create((set) => ({
  loginOpen: false,
  user: null,
  accessToken: null,
  status: "idle",
  setLoginOpen: (loginOpen) => set({ loginOpen }),
  setStatus: (status) => set({ status }),
  setSession: ({ user, accessToken }) =>
    set({ user, accessToken, status: "ready", loginOpen: false }),
  updateUser: (user) => set({ user }),
  clear: () => {
    useWishlistStore.getState().resetForLogout();
    set({ user: null, accessToken: null, status: "ready" });
  },
}));
