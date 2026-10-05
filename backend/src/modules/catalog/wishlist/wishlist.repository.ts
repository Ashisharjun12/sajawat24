import { and, asc, desc, eq, inArray } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import {
    wishlistItems,
    type NewWishlistItem,
    type WishlistItem,
} from "@/modules/catalog/wishlist/wishlist.schema.js";

export interface IWishlistRepository {
    listByUserId(userId: string): Promise<WishlistItem[]>;
    listOldestByUserId(userId: string): Promise<WishlistItem[]>;
    countByUserId(userId: string): Promise<number>;
    findByUserAndProduct(userId: string, productId: string): Promise<WishlistItem | undefined>;
    insert(data: NewWishlistItem): Promise<WishlistItem>;
    insertIgnore(userId: string, productId: string): Promise<WishlistItem | undefined>;
    deleteByUserAndProduct(userId: string, productId: string): Promise<boolean>;
    deleteByIds(ids: string[]): Promise<void>;
}

export class WishlistRepository implements IWishlistRepository {
    async listByUserId(userId: string): Promise<WishlistItem[]> {
        return db
            .select()
            .from(wishlistItems)
            .where(eq(wishlistItems.userId, userId))
            .orderBy(desc(wishlistItems.createdAt));
    }

    async countByUserId(userId: string): Promise<number> {
        const rows = await db
            .select({ id: wishlistItems.id })
            .from(wishlistItems)
            .where(eq(wishlistItems.userId, userId));
        return rows.length;
    }

    async findByUserAndProduct(userId: string, productId: string): Promise<WishlistItem | undefined> {
        const [row] = await db
            .select()
            .from(wishlistItems)
            .where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.productId, productId)))
            .limit(1);
        return row;
    }

    async insert(data: NewWishlistItem): Promise<WishlistItem> {
        const [row] = await db.insert(wishlistItems).values(data).returning();
        if (!row) throw new Error("failed to insert wishlist item");
        return row;
    }

    async insertIgnore(userId: string, productId: string): Promise<WishlistItem | undefined> {
        const existing = await this.findByUserAndProduct(userId, productId);
        if (existing) return existing;
        return this.insert({ userId, productId });
    }

    async deleteByUserAndProduct(userId: string, productId: string): Promise<boolean> {
        const rows = await db
            .delete(wishlistItems)
            .where(and(eq(wishlistItems.userId, userId), eq(wishlistItems.productId, productId)))
            .returning({ id: wishlistItems.id });
        return rows.length > 0;
    }

    async deleteByIds(ids: string[]): Promise<void> {
        if (ids.length === 0) return;
        await db.delete(wishlistItems).where(inArray(wishlistItems.id, ids));
    }

    /** Oldest first — for cap trimming. */
    async listOldestByUserId(userId: string): Promise<WishlistItem[]> {
        return db
            .select()
            .from(wishlistItems)
            .where(eq(wishlistItems.userId, userId))
            .orderBy(asc(wishlistItems.createdAt));
    }
}
