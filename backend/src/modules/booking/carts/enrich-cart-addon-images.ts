import { eq, inArray } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import { addons } from "@/modules/catalog/addons/addon.schema.js";
import { displayUrl } from "@/modules/upload/media/media.public.js";
import { uploads } from "@/modules/upload/media/media.schema.js";

type AddonRow = { id: string; imageUrl: string | null };

export async function enrichCartItemsWithAddonImages<
    T extends { addons: AddonRow[] },
>(items: T[]): Promise<T[]> {
    const addonIds = [...new Set(items.flatMap((item) => item.addons.map((addon) => addon.id)))];
    if (addonIds.length === 0) {
        return items;
    }

    const rows = await db
        .select({
            addonId: addons.id,
            upload: uploads,
        })
        .from(addons)
        .leftJoin(uploads, eq(addons.imageUploadId, uploads.id))
        .where(inArray(addons.id, addonIds));

    const imageByAddonId = new Map<string, string | null>();
    for (const row of rows) {
        imageByAddonId.set(row.addonId, row.upload ? displayUrl(row.upload) : null);
    }

    return items.map((item) => ({
        ...item,
        addons: item.addons.map((addon) => ({
            ...addon,
            imageUrl: imageByAddonId.get(addon.id) ?? null,
        })),
    }));
}
