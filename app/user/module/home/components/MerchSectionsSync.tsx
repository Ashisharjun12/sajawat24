import { useSyncMerchSections } from '@/module/home/hooks/use-sync-merch-sections';

/** Fetches catalog sections for the current city; no UI. */
export function MerchSectionsSync() {
  useSyncMerchSections();
  return null;
}
