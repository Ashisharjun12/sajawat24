import {
  dismissLaunchAnnouncement,
  loadDismissedLaunchAnnouncementIds,
} from '@/lib/launch-announcement-storage';
import { pickLaunchAnnouncement, type HomeAnnouncement } from '@/module/home/lib/announcement';
import { useHomeCms } from '@/module/home/hooks/use-home-cms';
import { useLocationStore } from '@/store/location.store';
import { useCallback, useEffect, useRef, useState } from 'react';

export function useLaunchAnnouncementSheet(options: { enabled: boolean }) {
  const { enabled } = options;
  const locationStatus = useLocationStore((s) => s.status);
  const locationChosen = useLocationStore((s) => s.isLocationChosen());
  const { announcements, isPending: cmsPending } = useHomeCms();

  const [dismissedIds, setDismissedIds] = useState<string[] | null>(null);
  const [visible, setVisible] = useState(false);
  const [active, setActive] = useState<HomeAnnouncement | null>(null);
  const shownThisSessionRef = useRef<string | null>(null);

  useEffect(() => {
    void loadDismissedLaunchAnnouncementIds().then(setDismissedIds);
  }, []);

  const launchCandidate =
    dismissedIds && announcements.length
      ? pickLaunchAnnouncement(announcements, new Set(dismissedIds))
      : null;

  const eligible =
    enabled &&
    locationStatus === 'ready' &&
    locationChosen &&
    !cmsPending &&
    launchCandidate &&
    dismissedIds !== null;

  useEffect(() => {
    if (!eligible || !launchCandidate) {
      setVisible(false);
      return;
    }
    if (shownThisSessionRef.current === launchCandidate.id) {
      return;
    }
    shownThisSessionRef.current = launchCandidate.id;
    setActive(launchCandidate);
    setVisible(true);
  }, [eligible, launchCandidate]);

  const dismiss = useCallback(async () => {
    if (!active) {
      setVisible(false);
      return;
    }
    setVisible(false);
    await dismissLaunchAnnouncement(active.id);
    setDismissedIds((prev) => [...(prev ?? []), active.id]);
  }, [active]);

  const onPrimary = useCallback(() => {
    setVisible(false);
  }, []);

  return {
    visible,
    announcement: active,
    dismiss,
    onPrimaryClose: onPrimary,
  };
}
