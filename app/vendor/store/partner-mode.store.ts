import {
  clearPartnerMode,
  loadPartnerMode,
  savePartnerMode,
  type PartnerMode,
} from '@/lib/partner-mode';
import type { AuthUser } from '@/lib/auth.types';
import { create } from 'zustand';

function defaultModeForUser(user: AuthUser | null): PartnerMode {
  if (!user) return 'owner';
  if (user.role === 'vendor_staff') return 'field';
  if (user.capabilities?.canSwitchToFieldMode) return 'owner';
  if (user.capabilities?.isFieldWorker && !user.capabilities?.isShopOwner) return 'field';
  return 'owner';
}

type PartnerModeState = {
  hydrated: boolean;
  mode: PartnerMode;
  hydrate: () => Promise<void>;
  setMode: (mode: PartnerMode) => Promise<void>;
  resetForUser: (user: AuthUser | null) => Promise<void>;
  clear: () => Promise<void>;
};

export const usePartnerModeStore = create<PartnerModeState>((set, get) => ({
  hydrated: false,
  mode: 'owner',
  hydrate: async () => {
    const stored = await loadPartnerMode();
    set({ mode: stored ?? 'owner', hydrated: true });
  },
  setMode: async (mode) => {
    await savePartnerMode(mode);
    set({ mode });
  },
  resetForUser: async (user) => {
    const stored = await loadPartnerMode();
    const mode = stored ?? defaultModeForUser(user);
    await savePartnerMode(mode);
    set({ mode, hydrated: true });
  },
  clear: async () => {
    await clearPartnerMode();
    set({ mode: 'owner', hydrated: false });
  },
}));

export function selectIsFieldShell(
  mode: PartnerMode,
  user: AuthUser | null,
): boolean {
  if (user?.role === 'vendor_staff') return true;
  return mode === 'field';
}
