import { me, refresh } from '@/api/auth.api';
import {
  isAccessTokenExpired,
  refreshAccessTokenOnce,
  SessionRefreshError,
} from '@/lib/auth-session-refresh';
import { isPlatformAccessPausedError } from '@/module/auth/lib/account-blocked';
import type { PartnerLoginIntent } from '@/lib/login-intent';
import { usePartnerModeStore } from '@/store/partner-mode.store';
import { clearPushRegistration } from '@/lib/push-registration';
import type { AuthSessionPayload, AuthUser, VendorProfile } from '@/lib/auth.types';
import {
  clearHasSeenWelcome,
  clearTokens,
  loadAccessToken,
  loadHasSeenWelcome,
  loadRefreshToken,
  saveHasSeenWelcome,
  saveTokens,
} from '@/lib/secure-storage';
import { toLocalPhone } from '@/lib/phone';

import { create } from 'zustand';

export { getAuthRedirectPath, getPostOtpRedirectPath } from '@/module/auth/lib/auth-routing';

export type { AuthUser, VendorProfile, VendorOnboardingStatus } from '@/lib/auth.types';

export type RegisterBasicPayload = {
  name: string;
  email: string;
  phone: string;
  altPhone?: string;
};

export type RegisterLocationPayload = {
  state: string;
  cityId: string;
  cityName: string;
  shopAddress: string;
  pincode: string;
  shopImageUri?: string;
  shopImageUploadId?: string;
  baseLatitude?: number;
  baseLongitude?: number;
};

export type RegisterPayload = RegisterBasicPayload & RegisterLocationPayload;

type AuthState = {
  hydrated: boolean;
  hasSeenWelcome: boolean;
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  registerDraft: RegisterBasicPayload | null;
  pendingRegistration: RegisterPayload | null;
  pendingOtpPhone: string | null;
  pendingOtpMode: 'register' | 'sign-in' | null;
  pendingLoginIntent: PartnerLoginIntent | null;
  registerOtpRequested: boolean;
  lastDevOtp: string | null;
  isReapplyMode: boolean;
  platformAccessPaused: boolean;
  hydrate: () => Promise<void>;
  completeWelcome: () => Promise<void>;
  setRegisterDraft: (data: RegisterBasicPayload) => void;
  setPendingRegistration: (data: RegisterPayload) => void;
  setPendingOtp: (input: {
    phone: string;
    mode: 'register' | 'sign-in';
    devOtp?: string;
    loginIntent?: PartnerLoginIntent | null;
    registerOtpRequested?: boolean;
  }) => void;
  setPendingLoginIntent: (intent: PartnerLoginIntent | null) => void;
  setSession: (payload: AuthSessionPayload) => Promise<void>;
  refreshSession: () => Promise<AuthUser | null>;
  clearPendingOtp: () => void;
  restoreRegisterDraftFromPending: () => void;
  getPendingPhone: () => string | null;
  signOut: () => Promise<void>;
  resetOnboarding: () => Promise<void>;
  startReapplyFromSession: () => void;
  completeReapply: (user: AuthUser) => void;
  clearReapplyMode: () => void;
  updateUser: (user: AuthUser) => void;
  markPlatformAccessPaused: () => void;
};

export const useAuthStore = create<AuthState>((set, get) => ({
  hydrated: false,
  hasSeenWelcome: false,
  accessToken: null,
  refreshToken: null,
  user: null,
  registerDraft: null,
  pendingRegistration: null,
  pendingOtpPhone: null,
  pendingOtpMode: null,
  pendingLoginIntent: null,
  registerOtpRequested: false,
  lastDevOtp: null,
  isReapplyMode: false,
  platformAccessPaused: false,

  hydrate: async () => {
    const [hasSeenWelcome, accessToken, refreshToken] = await Promise.all([
      loadHasSeenWelcome(),
      loadAccessToken(),
      loadRefreshToken(),
    ]);

    if (!refreshToken) {
      set({ hydrated: true, hasSeenWelcome, accessToken: null, refreshToken: null, user: null });
      return;
    }

    if (accessToken && !isAccessTokenExpired(accessToken)) {
      set({ accessToken, refreshToken });
      try {
        const user = await me();
        await usePartnerModeStore.getState().resetForUser(user);
        set({
          hydrated: true,
          hasSeenWelcome,
          accessToken,
          refreshToken,
          user,
          platformAccessPaused: user.vendor?.onboardingStatus === 'BLOCKED',
        });
        return;
      } catch (err) {
        if (isPlatformAccessPausedError(err)) {
          set({
            hydrated: true,
            hasSeenWelcome,
            accessToken,
            refreshToken,
            user: null,
            platformAccessPaused: true,
          });
          return;
        }
      }
    }

    try {
      await refreshAccessTokenOnce();
      const { accessToken: nextAccess, refreshToken: nextRefresh, user } = get();
      set({
        hydrated: true,
        hasSeenWelcome,
        accessToken: nextAccess,
        refreshToken: nextRefresh ?? refreshToken,
        user,
        platformAccessPaused: user?.vendor?.onboardingStatus === 'BLOCKED',
      });
    } catch (err) {
      if (err instanceof SessionRefreshError && !err.hardLogout) {
        set({
          hydrated: true,
          hasSeenWelcome,
          accessToken,
          refreshToken,
          user: get().user,
          platformAccessPaused: true,
        });
        return;
      }
      await clearTokens();
      set({
        hydrated: true,
        hasSeenWelcome,
        accessToken: null,
        refreshToken: null,
        user: null,
        platformAccessPaused: isPlatformAccessPausedError(err),
      });
    }
  },

  completeWelcome: async () => {
    await saveHasSeenWelcome();
    set({ hasSeenWelcome: true });
  },

  setRegisterDraft: (data) => set({ registerDraft: data }),

  setPendingRegistration: (data) =>
    set({
      pendingRegistration: data,
      registerDraft: get().isReapplyMode
        ? {
            name: data.name,
            email: data.email,
            phone: data.phone,
            altPhone: data.altPhone,
          }
        : null,
      pendingOtpPhone: null,
      pendingOtpMode: null,
    }),

  setPendingOtp: ({ phone, mode, devOtp, loginIntent, registerOtpRequested }) =>
    set({
      pendingOtpPhone: phone,
      pendingOtpMode: mode,
      pendingLoginIntent:
        loginIntent !== undefined ? loginIntent : mode === 'sign-in' ? get().pendingLoginIntent : null,
      registerOtpRequested: mode === 'register' ? (registerOtpRequested ?? false) : false,
      lastDevOtp: devOtp ?? null,
      pendingRegistration: mode === 'register' ? get().pendingRegistration : null,
    }),

  setPendingLoginIntent: (intent) => set({ pendingLoginIntent: intent }),

  setSession: async (payload) => {
    await saveTokens(payload.accessToken, payload.refreshToken);
    await usePartnerModeStore.getState().resetForUser(payload.user);
    set({
      accessToken: payload.accessToken,
      refreshToken: payload.refreshToken ?? get().refreshToken,
      user: payload.user,
      pendingRegistration: null,
      pendingOtpPhone: null,
      pendingOtpMode: null,
      pendingLoginIntent: null,
      registerOtpRequested: false,
      lastDevOtp: null,
      registerDraft: null,
      isReapplyMode: false,
      platformAccessPaused: payload.user.vendor?.onboardingStatus === 'BLOCKED',
    });
  },

  markPlatformAccessPaused: () => {
    const user = get().user;
    if (user?.vendor) {
      set({
        platformAccessPaused: true,
        user: {
          ...user,
          vendor: {
            ...user.vendor,
            onboardingStatus: 'BLOCKED',
            isOnDuty: false,
          },
        },
      });
      return;
    }
    set({ platformAccessPaused: true });
  },

  refreshSession: async () => {
    const token = get().accessToken;
    if (!token) return null;
    try {
      const user = await me();
      set({ user });
      return user;
    } catch (err) {
      if (isPlatformAccessPausedError(err)) {
        get().markPlatformAccessPaused();
        return get().user;
      }
      const refreshToken = get().refreshToken ?? (await loadRefreshToken());
      if (!refreshToken) {
        await get().signOut();
        return null;
      }
      try {
        const payload = await refresh(refreshToken);
        await get().setSession(payload);
        return payload.user;
      } catch (refreshErr) {
        if (isPlatformAccessPausedError(refreshErr)) {
          get().markPlatformAccessPaused();
          return get().user;
        }
        await get().signOut();
        return null;
      }
    }
  },

  clearPendingOtp: () =>
    set({
      pendingOtpPhone: null,
      pendingOtpMode: null,
      pendingLoginIntent: null,
      registerOtpRequested: false,
      lastDevOtp: null,
      pendingRegistration: null,
    }),

  restoreRegisterDraftFromPending: () => {
    const pending = get().pendingRegistration;
    if (!pending) return;
    set({
      registerDraft: {
        name: pending.name,
        email: pending.email,
        phone: pending.phone,
        altPhone: pending.altPhone,
      },
    });
  },

  getPendingPhone: () => get().pendingOtpPhone,

  signOut: async () => {
    const { useEnRouteTripStore } = await import('@/store/en-route-trip.store');
    await useEnRouteTripStore.getState().endTrip();

    const accessToken = get().accessToken;
    const vendor = get().user?.vendor;
    if (vendor?.onboardingStatus === 'ACTIVE' && vendor.isOnDuty) {
      try {
        const { patchDuty } = await import('@/api/vendor.api');
        await patchDuty(false);
      } catch {
        // best-effort offline before logout
      }
    }
    await clearPushRegistration(accessToken);

    const refreshToken = get().refreshToken ?? (await loadRefreshToken());
    if (refreshToken) {
      try {
        const { logout } = await import('@/api/auth.api');
        await logout(refreshToken);
      } catch {
        // ignore network errors on logout
      }
    }
    await clearTokens();
    await usePartnerModeStore.getState().clear();
    set({
      accessToken: null,
      refreshToken: null,
      user: null,
      pendingRegistration: null,
      pendingOtpPhone: null,
      pendingOtpMode: null,
      pendingLoginIntent: null,
      registerOtpRequested: false,
      lastDevOtp: null,
      isReapplyMode: false,
      platformAccessPaused: false,
    });
  },

  startReapplyFromSession: () => {
    const user = get().user;
    const vendor = user?.vendor;
    if (!user?.phone || !vendor || vendor.onboardingStatus !== 'REJECTED') return;

    const draft: RegisterBasicPayload = {
      name: user.name,
      email: user.email ?? '',
      phone: toLocalPhone(user.phone),
      altPhone: vendor.altPhone ? toLocalPhone(vendor.altPhone) : undefined,
    };

    const registration: RegisterPayload = {
      ...draft,
      state: vendor.state,
      cityId: vendor.cityId,
      cityName: vendor.cityName,
      shopAddress: vendor.shopAddress,
      pincode: vendor.pincode,
      shopImageUri: vendor.shopImageUrl ?? undefined,
    };

    set({
      isReapplyMode: true,
      registerDraft: draft,
      pendingRegistration: registration,
      pendingOtpPhone: null,
      pendingOtpMode: null,
    });
  },

  completeReapply: (user) =>
    set({
      user,
      isReapplyMode: false,
      registerDraft: null,
      pendingRegistration: null,
    }),

  clearReapplyMode: () =>
    set({
      isReapplyMode: false,
      registerDraft: null,
      pendingRegistration: null,
    }),

  updateUser: (user) => set({ user }),

  resetOnboarding: async () => {
    await get().signOut();
    await clearHasSeenWelcome();
    set({
      hasSeenWelcome: false,
      registerDraft: null,
    });
  },
}));
