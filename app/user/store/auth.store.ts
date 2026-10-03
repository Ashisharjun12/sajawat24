import type { AuthSessionPayload, CustomerUser } from '@/lib/auth.types';
import { logoutSession } from '@/api/auth-refresh.api';
import { useChatStore } from '@/store/chat.store';
import { clearPushRegistration } from '@/lib/push-registration';
import {
  isAccessTokenExpired,
  refreshAccessTokenOnce,
  SessionRefreshError,
} from '@/lib/auth-session-refresh';
import {
  clearAccessToken,
  clearHasSeenWelcome,
  loadAccessToken,
  loadHasSeenWelcome,
  loadRefreshToken,
  loadUserProfile,
  saveAccessToken,
  saveHasSeenWelcome,
  saveRefreshToken,
  saveUserPhone,
  saveUserProfile,
} from '@/lib/secure-storage';
import { create } from 'zustand';

export { getAuthRedirectPath } from '@/module/auth/lib/auth-routing';

type AuthState = {
  hydrated: boolean;
  hasSeenWelcome: boolean;
  accessToken: string | null;
  user: CustomerUser | null;
  pendingOtpPhone: string | null;
  lastDevOtp: string | null;
  hydrate: () => Promise<void>;
  completeWelcome: () => Promise<void>;
  setPendingOtp: (phone: string) => void;
  clearPendingOtp: () => void;
  setSession: (payload: AuthSessionPayload) => Promise<void>;
  updateUser: (user: CustomerUser) => Promise<void>;
  signOut: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  hydrated: false,
  hasSeenWelcome: false,
  accessToken: null,
  user: null,
  pendingOtpPhone: null,
  lastDevOtp: null,

  hydrate: async () => {
    const [hasSeenWelcome, accessToken, profile, refreshToken] = await Promise.all([
      loadHasSeenWelcome(),
      loadAccessToken(),
      loadUserProfile(),
      loadRefreshToken(),
    ]);

    if (!accessToken) {
      set({ hydrated: true, hasSeenWelcome, accessToken: null, user: null });
      return;
    }

    if (refreshToken && isAccessTokenExpired(accessToken)) {
      try {
        await refreshAccessTokenOnce();
        const { accessToken: nextToken, user } = get();
        set({
          hydrated: true,
          hasSeenWelcome,
          accessToken: nextToken,
          user,
        });
        return;
      } catch (err) {
        if (err instanceof SessionRefreshError && err.hardLogout) {
          await clearAccessToken();
        }
        set({ hydrated: true, hasSeenWelcome, accessToken: null, user: null });
        return;
      }
    }

    set({
      hydrated: true,
      hasSeenWelcome,
      accessToken,
      user: profile,
    });
  },

  completeWelcome: async () => {
    await saveHasSeenWelcome();
    set({ hasSeenWelcome: true });
  },

  setPendingOtp: (phone) => set({ pendingOtpPhone: phone }),

  clearPendingOtp: () => set({ pendingOtpPhone: null }),

  setSession: async (payload) => {
    const saves: Promise<void>[] = [
      saveAccessToken(payload.accessToken),
      saveUserProfile(payload.user),
      saveUserPhone(payload.user.phone),
    ];
    if (payload.refreshToken) {
      saves.push(saveRefreshToken(payload.refreshToken));
    }
    await Promise.all(saves);
    set({
      accessToken: payload.accessToken,
      user: payload.user,
      pendingOtpPhone: null,
    });
  },

  updateUser: async (user) => {
    await Promise.all([saveUserProfile(user), saveUserPhone(user.phone)]);
    set({ user });
  },

  signOut: async () => {
    const refreshToken = await loadRefreshToken();
    const accessToken = get().accessToken;
    await clearPushRegistration(accessToken);
    if (refreshToken) {
      try {
        await logoutSession(refreshToken);
      } catch {
        // Best-effort server revoke; always clear locally.
      }
    }
    await clearAccessToken();
    useChatStore.getState().reset();
    set({ accessToken: null, user: null, pendingOtpPhone: null });
  },

  resetOnboarding: async () => {
    await Promise.all([clearAccessToken(), clearHasSeenWelcome()]);
    set({
      hasSeenWelcome: false,
      accessToken: null,
      user: null,
      pendingOtpPhone: null,
      lastDevOtp: null,
    });
  },
}));
