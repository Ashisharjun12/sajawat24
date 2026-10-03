import { create } from "zustand";

export const useAuthStore = create((set) => ({
  user: null,
  accessToken: null,
  status: "idle",
  setStatus: (status) => set({ status }),
  setSession: ({ user, accessToken }) =>
    set({ user, accessToken, status: "ready" }),
  patchUser: (partial) =>
    set((state) =>
      state.user ? { user: { ...state.user, ...partial } } : state,
    ),
  clear: () => set({ user: null, accessToken: null, status: "ready" }),
}));
