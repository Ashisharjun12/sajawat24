import { and, asc, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import { paginationOffset, type PaginationQuery } from "@/shared/http/pagination.js";
import {
    addonColors,
    addons,
    productAddons,
    type Addon,
    type AddonColor,
    type NewAddon,
    type NewAddonColor,
} from "@/modules/catalog/addons/addon.schema.js";

export type AddonPatch = Partial<
    Pick<
        Addon,
        | "name"
        | "slug"
        | "description"
        | "imageUploadId"
        | "colorId"
        | "isActive"
        | "pricePaise"
        | "compareAtPaise"
        | "maxQuantity"
    >
>;

export type AddonColorPatch = Partial<Pick<AddonColor, "name" | "slug" | "hex">>;

export type AddonListFilter = {
    q?: string;
    isActive?: boolean;
};

export interface IAddonRepository {
    findById(id: string): Promise<Addon | undefined>;
    list(
        pagination: PaginationQuery,
        filter?: AddonListFilter,
    ): Promise<{ items: Addon[]; total: number }>;
    insert(data: NewAddon): Promise<Addon>;
    update(id: string, data: AddonPatch): Promise<Addon | undefined>;
    listMappedIds(productId: string): Promise<string[]>;
    isMapped(productId: string, addonId: string): Promise<boolean>;
    map(productId: string, addonId: string): Promise<void>;
    unmap(productId: string, addonId: string): Promise<void>;
    findColorById(id: string): Promise<AddonColor | undefined>;
    listColors(): Promise<AddonColor[]>;
    insertColor(data: NewAddonColor): Promise<AddonColor>;
    updateColor(id: string, data: AddonColorPatch): Promise<AddonColor | undefined>;
}

function addonListWhere(filter: AddonListFilter = {}): SQL | undefined {
    const conditions: SQL[] = [];
    const q = filter.q?.trim().replace(/[%_\\]/g, "");
    if (q) {
        const pattern = `%${q}%`;
        const match = or(ilike(addons.name, pattern), ilike(addons.slug, pattern));
        if (match) conditions.push(match);
    }
    if (filter.isActive !== undefined) {
        conditions.push(eq(addons.isActive, filter.isActive));
    }
    return conditions.length ? and(...conditions) : undefined;
}

export class AddonRepository implements IAddonRepository {
    async findById(id: string): Promise<Addon | undefined> {
        const [row] = await db.select().from(addons).where(eq(addons.id, id)).limit(1);
        return row;
    }

    async list(
        pagination: PaginationQuery,
        filter: AddonListFilter = {},
    ): Promise<{ items: Addon[]; total: number }> {
        const where = addonListWhere(filter);
        const [totalRow] = await db.select({ value: count() }).from(addons).where(where);
        const items = await db
            .select()
            .from(addons)
            .where(where)
            .orderBy(desc(addons.createdAt))
            .limit(pagination.limit)
            .offset(paginationOffset(pagination));
        return { items, total: Number(totalRow?.value ?? 0) };
    }

    async insert(data: NewAddon): Promise<Addon> {
        const [row] = await db.insert(addons).values(data).returning();
        if (!row) {
            throw new Error("failed to create addon");
        }
        return row;
    }

    async update(id: string, data: AddonPatch): Promise<Addon | undefined> {
        const [row] = await db
            .update(addons)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(addons.id, id))
            .returning();
        return row;
    }

    async listMappedIds(productId: string): Promise<string[]> {
        const rows = await db
            .select({ addonId: productAddons.addonId })
            .from(productAddons)
            .where(eq(productAddons.productId, productId));
        return rows.map((row) => row.addonId);
    }

    async isMapped(productId: string, addonId: string): Promise<boolean> {
        const [row] = await db
            .select({ addonId: productAddons.addonId })
            .from(productAddons)
            .where(and(eq(productAddons.productId, productId), eq(productAddons.addonId, addonId)))
            .limit(1);
        return Boolean(row);
    }

    async map(productId: string, addonId: string): Promise<void> {
        await db.insert(productAddons).values({ productId, addonId }).onConflictDoNothing();
    }

    async unmap(productId: string, addonId: string): Promise<void> {
        await db
            .delete(productAddons)
            .where(and(eq(productAddons.productId, productId), eq(productAddons.addonId, addonId)));
    }

    async findColorById(id: string): Promise<AddonColor | undefined> {
        const [row] = await db.select().from(addonColors).where(eq(addonColors.id, id)).limit(1);
        return row;
    }

    async listColors(): Promise<AddonColor[]> {
        return db.select().from(addonColors).orderBy(asc(addonColors.name));
    }

    async insertColor(data: NewAddonColor): Promise<AddonColor> {
        const [row] = await db.insert(addonColors).values(data).returning();
        if (!row) {
            throw new Error("failed to create color");
        }
        return row;
    }

    async updateColor(id: string, data: AddonColorPatch): Promise<AddonColor | undefined> {
        const [row] = await db
            .update(addonColors)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(addonColors.id, id))
            .returning();
        return row;
    }
}
