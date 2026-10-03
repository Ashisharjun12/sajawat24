import {
  loadLocationPromptCompleted,
  loadNotificationPromptCompleted,
  loadPermissionsSetupCompleted,
  saveLocationPromptCompleted,
  saveNotificationPromptCompleted,
  savePermissionsSetupCompleted,
} from '@/lib/secure-storage';
import { getLocationPermissionStatus } from '@/lib/location';
import { getNotificationPermissionStatus } from '@/lib/notifications';
import { create } from 'zustand';

type PermissionsSetupState = {
  setupCompleted: boolean | null;
  locationStepDone: boolean | null;
  notificationStepDone: boolean | null;
  hydrate: () => Promise<void>;
  completeLocationStep: () => Promise<void>;
  completeNotificationStep: () => Promise<void>;
  reset: () => void;
};

export const usePermissionsSetupStore = create<PermissionsSetupState>((set) => ({
  setupCompleted: null,
  locationStepDone: null,
  notificationStepDone: null,

  reset: () =>
    set({
      setupCompleted: null,
      locationStepDone: null,
      notificationStepDone: null,
    }),

  hydrate: async () => {
    const [completed, locationDone, notificationDone] = await Promise.all([
      loadPermissionsSetupCompleted(),
      loadLocationPromptCompleted(),
      loadNotificationPromptCompleted(),
    ]);

    const [notificationOs, locationOs] = await Promise.all([
      getNotificationPermissionStatus(),
      getLocationPermissionStatus(),
    ]);
    const osPermissionsGranted =
      notificationOs === 'granted' && locationOs === 'granted';

    if (!completed && (osPermissionsGranted || (locationDone && notificationDone))) {
      await savePermissionsSetupCompleted();
      set({
        setupCompleted: true,
        locationStepDone: true,
        notificationStepDone: true,
      });
      return;
    }

    set({
      setupCompleted: completed,
      locationStepDone: locationDone,
      notificationStepDone: notificationDone,
    });
  },

  completeLocationStep: async () => {
    await saveLocationPromptCompleted();
    set({ locationStepDone: true });
  },

  completeNotificationStep: async () => {
    await saveNotificationPromptCompleted();
    await savePermissionsSetupCompleted();
    set({
      setupCompleted: true,
      locationStepDone: true,
      notificationStepDone: true,
    });
  },
}));
