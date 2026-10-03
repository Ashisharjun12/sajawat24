import { addonMaxQuantity, isAddonAvailable } from '@/module/catalog/lib/addon-pricing';
import type { PublicAddonForCity } from '@/module/catalog/lib/product-detail';
import { useCallback, useState } from 'react';

export type AddonSelection = { addonId: string; quantity: number };

export function useProductAddonSelection(addons: PublicAddonForCity[]) {
  const [qtyById, setQtyById] = useState<Record<string, number>>({});

  const setQty = useCallback((addonId: string, next: number) => {
    setQtyById((prev) => {
      if (next <= 0) {
        const { [addonId]: _removed, ...rest } = prev;
        return rest;
      }
      return { ...prev, [addonId]: next };
    });
  }, []);

  const toggleSingle = useCallback(
    (addon: PublicAddonForCity) => {
      if (!isAddonAvailable(addon.pricePaise)) return;
      const on = (qtyById[addon.id] ?? 0) > 0;
      setQty(addon.id, on ? 0 : 1);
    },
    [qtyById, setQty],
  );

  const increment = useCallback(
    (addon: PublicAddonForCity) => {
      if (!isAddonAvailable(addon.pricePaise)) return;
      const max = addonMaxQuantity(addon);
      const current = qtyById[addon.id] ?? 0;
      if (current === 0) setQty(addon.id, 1);
      else setQty(addon.id, Math.min(max, current + 1));
    },
    [qtyById, setQty],
  );

  const decrement = useCallback(
    (addon: PublicAddonForCity) => {
      const current = qtyById[addon.id] ?? 0;
      setQty(addon.id, Math.max(0, current - 1));
    },
    [qtyById, setQty],
  );

  const reset = useCallback(() => setQtyById({}), []);

  const buildSelections = useCallback((): AddonSelection[] => {
    return Object.entries(qtyById)
      .filter(([, quantity]) => quantity > 0)
      .map(([addonId, quantity]) => {
        const addon = addons.find((row) => row.id === addonId);
        if (!addon || !isAddonAvailable(addon.pricePaise)) return null;
        const max = addonMaxQuantity(addon);
        return { addonId, quantity: Math.min(max, quantity) };
      })
      .filter(Boolean) as AddonSelection[];
  }, [addons, qtyById]);

  return {
    qtyById,
    setQty,
    toggleSingle,
    increment,
    decrement,
    reset,
    buildSelections,
    selectedCount: Object.values(qtyById).reduce((sum, n) => sum + n, 0),
  };
}
