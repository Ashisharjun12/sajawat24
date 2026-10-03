import { isAddonAvailable } from "@/module/catalog/lib/addon-pricing";

export function addonImageSrc(item) {
  return item?.url || item?.publicUrl || item?.optimizedUrl || item?.thumbnailUrl || "";
}

export function addonImageSrcFromAddon(addon) {
  return addonImageSrc(addon?.image);
}

export function addonMaxQuantity(addon) {
  const raw = addon?.maxQuantity ?? 1;
  return Math.min(20, Math.max(1, Number(raw) || 1));
}

export function addonDiscountPercent(pricePaise, compareAtPaise) {
  if (compareAtPaise == null || pricePaise == null || compareAtPaise <= pricePaise) {
    return 0;
  }
  return Math.round((1 - pricePaise / compareAtPaise) * 100);
}

export function buildAddonSelections(addons, qtyById) {
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

export function buildAddonFilterTabs(addons) {
  const tabs = [{ id: "all", label: "All extras", filter: () => true }];

  const hasBestSeller = addons.some(
    (a) =>
      a.compareAtPaise != null &&
      a.pricePaise != null &&
      a.compareAtPaise > a.pricePaise,
  );
  if (hasBestSeller) {
    tabs.push({
      id: "best-seller",
      label: "Best Seller",
      filter: (a) =>
        a.compareAtPaise != null &&
        a.pricePaise != null &&
        a.compareAtPaise > a.pricePaise,
    });
  }

  if (addons.some((a) => /\bcake\b/i.test(a.name))) {
    tabs.push({
      id: "cake",
      label: "Cake",
      filter: (a) => /\bcake\b/i.test(a.name),
    });
  }

  const specializedIds = new Set();
  for (const tab of tabs.slice(1)) {
    for (const addon of addons) {
      if (tab.filter(addon)) specializedIds.add(addon.id);
    }
  }
  const moreCount = addons.filter((a) => !specializedIds.has(a.id)).length;
  if (moreCount > 0 && tabs.length > 1) {
    tabs.push({
      id: "more",
      label: "More",
      filter: (a) => !specializedIds.has(a.id),
    });
  }

  return tabs;
}
