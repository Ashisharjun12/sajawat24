import { useMerchSectionsStore } from '@/store/merch-sections.store';

export const MERCH_BADGE_NONE = Object.freeze({
  badgeLabel: undefined as string | undefined,
  badgeColor: undefined as string | undefined,
});

export function useProductMerchBadge(productId: string | undefined | null) {
  const badgeByProductId = useMerchSectionsStore((s) => s.badgeByProductId);
  if (!productId) {
    return MERCH_BADGE_NONE;
  }
  const entry = badgeByProductId.get(productId);
  if (!entry) {
    return MERCH_BADGE_NONE;
  }
  return entry;
}

export function resolveCardBadges({
  badgeLabel,
  badgeColor,
  fromStore,
}: {
  badgeLabel?: string | null;
  badgeColor?: string | null;
  fromStore?: { badgeLabel?: string; badgeColor?: string };
}) {
  const store = fromStore ?? MERCH_BADGE_NONE;
  const explicitLabel = badgeLabel?.trim();
  const explicitColor =
    badgeColor != null && String(badgeColor).trim() !== '' ? String(badgeColor).trim() : undefined;

  return {
    badgeLabel: explicitLabel || store.badgeLabel,
    badgeColor: explicitColor ?? store.badgeColor,
  };
}
