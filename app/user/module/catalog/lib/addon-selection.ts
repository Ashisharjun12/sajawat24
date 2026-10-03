import { addonMaxQuantity, isAddonAvailable } from '@/module/catalog/lib/addon-pricing';
import type { PublicAddonForCity } from '@/module/catalog/lib/product-detail';

export type AddonFilterTab = {
  id: string;
  label: string;
  filter: (addon: PublicAddonForCity) => boolean;
};

export function buildAddonFilterTabs(addons: PublicAddonForCity[]): AddonFilterTab[] {
  const tabs: AddonFilterTab[] = [{ id: 'all', label: 'All extras', filter: () => true }];

  const hasBestSeller = addons.some(
    (a) =>
      a.compareAtPaise != null &&
      a.pricePaise != null &&
      a.compareAtPaise > a.pricePaise,
  );
  if (hasBestSeller) {
    tabs.push({
      id: 'best-seller',
      label: 'Best Seller',
      filter: (a) =>
        a.compareAtPaise != null &&
        a.pricePaise != null &&
        a.compareAtPaise > a.pricePaise,
    });
  }

  if (addons.some((a) => /\bcake\b/i.test(a.name))) {
    tabs.push({
      id: 'cake',
      label: 'Cake',
      filter: (a) => /\bcake\b/i.test(a.name),
    });
  }

  const specializedIds = new Set<string>();
  for (const tab of tabs.slice(1)) {
    for (const addon of addons) {
      if (tab.filter(addon)) specializedIds.add(addon.id);
    }
  }
  const moreCount = addons.filter((a) => !specializedIds.has(a.id)).length;
  if (moreCount > 0 && tabs.length > 1) {
    tabs.push({
      id: 'more',
      label: 'More',
      filter: (a) => !specializedIds.has(a.id),
    });
  }

  return tabs;
}

export function buildAddonSelections(
  addons: PublicAddonForCity[],
  qtyById: Record<string, number>,
) {
  return Object.entries(qtyById)
    .filter(([, quantity]) => quantity > 0)
    .map(([addonId, quantity]) => {
      const addon = addons.find((row) => row.id === addonId);
      if (!addon || !isAddonAvailable(addon.pricePaise)) return null;
      const max = addonMaxQuantity(addon);
      return { addonId, quantity: Math.min(max, quantity) };
    })
    .filter(Boolean);
}
