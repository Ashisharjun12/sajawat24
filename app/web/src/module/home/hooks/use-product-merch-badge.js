import { useMerchSectionsStore } from "@/store/merch-sections.store";

export function useProductMerchBadge(productId) {
  const badgeByProductId = useMerchSectionsStore((s) => s.badgeByProductId);
  if (!productId) return { badgeLabel: undefined, badgeColor: undefined };
  const entry = badgeByProductId.get(productId);
  if (!entry) return { badgeLabel: undefined, badgeColor: undefined };
  return {
    badgeLabel: entry.badgeLabel,
    badgeColor: entry.badgeColor,
  };
}

export function resolveCardBadges({ badgeLabel, badgeColor, fromStore }) {
  const store = fromStore ?? { badgeLabel: undefined, badgeColor: undefined };
  const explicitLabel = badgeLabel?.trim();
  return {
    badgeLabel: explicitLabel || store.badgeLabel,
    badgeColor: badgeColor ?? store.badgeColor,
  };
}
