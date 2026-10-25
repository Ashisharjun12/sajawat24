import { create } from "zustand";
import { persist } from "zustand/middleware";

const AUTH_CHANNEL_NAME = "sajawat_admin_auth_channel";
let authChannel = null;

if (typeof window !== "undefined" && "BroadcastChannel" in window) {
  try {
    authChannel = new BroadcastChannel(AUTH_CHANNEL_NAME);
  } catch {
    authChannel = null;
  }
}

function broadcastMessage(data) {
  if (authChannel) {
    try {
      authChannel.postMessage(data);
    } catch {
      // ignore channel post failure
    }
  }
}

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      status: "idle",
      setStatus: (status) => set({ status }),
      setSession: ({ user, accessToken, refreshToken }) => {
        const nextRefreshToken =
          refreshToken ?? get().refreshToken ?? null;
        set({
          user,
          accessToken,
          refreshToken: nextRefreshToken,
          status: "ready",
        });
        broadcastMessage({
          type: "SESSION_UPDATE",
          user,
          accessToken,
          refreshToken: nextRefreshToken,
        });
      },
      patchUser: (partial) =>
        set((state) =>
          state.user ? { user: { ...state.user, ...partial } } : state,
        ),
      clear: () => {
        set({
          user: null,
          accessToken: null,
          refreshToken: null,
          status: "ready",
        });
        broadcastMessage({ type: "LOGOUT" });
      },
    }),
    {
      name: "sajawat_admin_auth",
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setStatus("ready");
        }
      },
    },
  ),
);

if (authChannel) {
  authChannel.onmessage = (event) => {
    const data = event.data;
    if (!data) return;

    if (data.type === "SESSION_UPDATE") {
      useAuthStore.setState({
        user: data.user,
        accessToken: data.accessToken,
        refreshToken:
          data.refreshToken ?? useAuthStore.getState().refreshToken,
        status: "ready",
      });
    } else if (data.type === "LOGOUT") {
      useAuthStore.setState({
        user: null,
        accessToken: null,
        refreshToken: null,
        status: "ready",
      });
      if (typeof window !== "undefined" && window.location.pathname !== "/login") {
        window.location.assign("/login");
      }
    }
  };
}
