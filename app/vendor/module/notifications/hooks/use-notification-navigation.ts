import { triggerHaptic } from '@/components/motion/haptics';
import { resolveNotificationTarget } from '@/module/notifications/lib/resolve-notification-target';
import type { VendorInboxNotification } from '@/module/notifications/lib/notification-types';
import { Href, router } from 'expo-router';
import { useCallback } from 'react';

type UseNotificationNavigationOptions = {
  markRead: (id: string) => Promise<unknown>;
};

export function useNotificationNavigation({ markRead }: UseNotificationNavigationOptions) {
  return useCallback(
    async (item: VendorInboxNotification) => {
      triggerHaptic();

      if (!item.readAt) {
        try {
          await markRead(item.id);
        } catch {
          // still navigate if mark-read fails
        }
      }

      router.push(resolveNotificationTarget(item.data) as Href);
    },
    [markRead],
  );
}
