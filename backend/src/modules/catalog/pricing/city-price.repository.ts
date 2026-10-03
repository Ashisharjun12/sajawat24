import { and, eq } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import {
    addonCityPrices,
    cityPrices,
    type AddonCityPrice,
    type CityPrice,
} from "@/modules/catalog/pricing/city-price.schema.js";

export interface ICityPriceRepository {
    getProductPrice(productId: string, cityId: string): Promise<CityPrice | undefined>;
    listProductPrices(productId: string): Promise<CityPrice[]>;
    upsertProductPrice(data: {
        productId: string;
        cityId: string;
        pricePaise: number;
        compareAtPaise?: number | null;
    }): Promise<CityPrice>;
    deleteProductPrice(productId: string, cityId: string): Promise<boolean>;
    getAddonPrice(addonId: string, cityId: string): Promise<AddonCityPrice | undefined>;
    listAddonPrices(addonId: string): Promise<AddonCityPrice[]>;
    upsertAddonPrice(data: {
        addonId: string;
        cityId: string;
        pricePaise: number;
        compareAtPaise?: number | null;
    }): Promise<AddonCityPrice>;
    deleteAddonPrice(addonId: string, cityId: string): Promise<boolean>;
}

export class CityPriceRepository implements ICityPriceRepository {
    async getProductPrice(productId: string, cityId: string): Promise<CityPrice | undefined> {
        const [row] = await db
            .select()
            .from(cityPrices)
            .where(and(eq(cityPrices.productId, productId), eq(cityPrices.cityId, cityId)))
            .limit(1);
        return row;
    }

    async listProductPrices(productId: string): Promise<CityPrice[]> {
        return db.select().from(cityPrices).where(eq(cityPrices.productId, productId));
    }

    async upsertProductPrice(data: {
        productId: string;
        cityId: string;
        pricePaise: number;
        compareAtPaise?: number | null;
    }): Promise<CityPrice> {
        const compareAtPaise = data.compareAtPaise ?? null;
        const [row] = await db
            .insert(cityPrices)
            .values({ ...data, compareAtPaise })
            .onConflictDoUpdate({
                target: [cityPrices.productId, cityPrices.cityId],
                set: { pricePaise: data.pricePaise, compareAtPaise, updatedAt: new Date() },
            })
            .returning();
        if (!row) {
            throw new Error("failed to upsert product city price");
        }
        return row;
    }

    async deleteProductPrice(productId: string, cityId: string): Promise<boolean> {
        const deleted = await db
            .delete(cityPrices)
            .where(and(eq(cityPrices.productId, productId), eq(cityPrices.cityId, cityId)))
            .returning({ id: cityPrices.id });
        return deleted.length > 0;
    }

    async getAddonPrice(addonId: string, cityId: string): Promise<AddonCityPrice | undefined> {
        const [row] = await db
            .select()
            .from(addonCityPrices)
            .where(and(eq(addonCityPrices.addonId, addonId), eq(addonCityPrices.cityId, cityId)))
            .limit(1);
        return row;
    }

    async listAddonPrices(addonId: string): Promise<AddonCityPrice[]> {
        return db.select().from(addonCityPrices).where(eq(addonCityPrices.addonId, addonId));
    }

    async upsertAddonPrice(data: {
        addonId: string;
        cityId: string;
        pricePaise: number;
        compareAtPaise?: number | null;
    }): Promise<AddonCityPrice> {
        const compareAtPaise = data.compareAtPaise ?? null;
        const [row] = await db
            .insert(addonCityPrices)
            .values({ ...data, compareAtPaise })
            .onConflictDoUpdate({
                target: [addonCityPrices.addonId, addonCityPrices.cityId],
                set: { pricePaise: data.pricePaise, compareAtPaise, updatedAt: new Date() },
            })
            .returning();
        if (!row) {
            throw new Error("failed to upsert addon city price");
        }
        return row;
    }

    async deleteAddonPrice(addonId: string, cityId: string): Promise<boolean> {
        const deleted = await db
            .delete(addonCityPrices)
            .where(and(eq(addonCityPrices.addonId, addonId), eq(addonCityPrices.cityId, cityId)))
            .returning({ id: addonCityPrices.id });
        return deleted.length > 0;
    }
}
