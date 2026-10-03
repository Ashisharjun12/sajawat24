export type AddonSelection = { addonId: string; quantity: number };

export const MAX_ADDON_LINE_QTY = 20;

export function normalizeAddonSelections(
    addonIds?: string[],
    addons?: AddonSelection[],
): AddonSelection[] {
    if (addons?.length) {
        const map = new Map<string, number>();
        for (const row of addons) {
            const quantity = Math.floor(row.quantity);
            if (quantity <= 0) continue;
            map.set(row.addonId, (map.get(row.addonId) ?? 0) + quantity);
        }
        return [...map.entries()].map(([addonId, quantity]) => ({ addonId, quantity }));
    }
    if (addonIds?.length) {
        return addonIds.map((addonId) => ({ addonId, quantity: 1 }));
    }
    return [];
}

export function selectionsFromCartAddonRows(
    rows: { addonId: string; quantity: number }[],
): AddonSelection[] {
    return rows.map((row) => ({ addonId: row.addonId, quantity: row.quantity }));
}

export function mergeAddonSelections(
    a: { addonId: string; quantity: number }[],
    b: { addonId: string; quantity: number }[],
): AddonSelection[] {
    const map = new Map<string, number>();
    for (const row of [...a, ...b]) {
        map.set(row.addonId, Math.max(map.get(row.addonId) ?? 0, row.quantity));
    }
    return [...map.entries()].map(([addonId, quantity]) => ({ addonId, quantity }));
}
