import { and, eq } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import {
    cartItemAddons,
    cartItems,
    carts,
    type Cart,
    type CartItem,
    type CartItemAddon,
    type NewCart,
} from "@/modules/booking/carts/cart.schema.js";

export type CartItemWithAddons = CartItem & { addons: CartItemAddon[] };

export type CartWithItems = Cart & { items: CartItemWithAddons[] };

export type CartPatch = Partial<
    Pick<
        Cart,
        | "userId"
        | "guestKey"
        | "cityId"
        | "pincode"
        | "fulfillmentType"
        | "deliveryLatitude"
        | "deliveryLongitude"
        | "scheduledAt"
        | "expiresAt"
        | "appliedCouponId"
        | "appliedCouponCode"
    >
>;

export interface ICartRepository {
    findById(id: string): Promise<Cart | undefined>;
    findByUserId(userId: string): Promise<Cart | undefined>;
    findByGuestKey(guestKey: string): Promise<Cart | undefined>;
    insert(data: NewCart): Promise<Cart>;
    update(id: string, data: CartPatch): Promise<Cart | undefined>;
    delete(id: string): Promise<boolean>;
    loadWithItems(cartId: string): Promise<CartWithItems | undefined>;
    findItem(cartId: string, productId: string): Promise<CartItem | undefined>;
    findItemById(itemId: string): Promise<CartItem | undefined>;
    upsertItem(cartId: string, productId: string, quantity: number): Promise<CartItem>;
    updateItemQuantity(itemId: string, quantity: number): Promise<CartItem | undefined>;
    deleteItem(itemId: string): Promise<boolean>;
    replaceItemAddons(
        cartItemId: string,
        selections: { addonId: string; quantity: number }[],
    ): Promise<void>;
    listItemAddons(cartItemId: string): Promise<CartItemAddon[]>;
}

export class CartRepository implements ICartRepository {
    async findById(id: string): Promise<Cart | undefined> {
        const [row] = await db.select().from(carts).where(eq(carts.id, id)).limit(1);
        return row;
    }

    async findByUserId(userId: string): Promise<Cart | undefined> {
        const [row] = await db.select().from(carts).where(eq(carts.userId, userId)).limit(1);
        return row;
    }

    async findByGuestKey(guestKey: string): Promise<Cart | undefined> {
        const [row] = await db.select().from(carts).where(eq(carts.guestKey, guestKey)).limit(1);
        return row;
    }

    async insert(data: NewCart): Promise<Cart> {
        const [row] = await db.insert(carts).values(data).returning();
        if (!row) throw new Error("failed to create cart");
        return row;
    }

    async update(id: string, data: CartPatch): Promise<Cart | undefined> {
        const [row] = await db
            .update(carts)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(carts.id, id))
            .returning();
        return row;
    }

    async delete(id: string): Promise<boolean> {
        const rows = await db.delete(carts).where(eq(carts.id, id)).returning({ id: carts.id });
        return rows.length > 0;
    }

    async loadWithItems(cartId: string): Promise<CartWithItems | undefined> {
        const cart = await this.findById(cartId);
        if (!cart) return undefined;
        const items = await db.select().from(cartItems).where(eq(cartItems.cartId, cartId));
        const withAddons: CartItemWithAddons[] = [];
        for (const item of items) {
            const addons = await this.listItemAddons(item.id);
            withAddons.push({ ...item, addons });
        }
        return { ...cart, items: withAddons };
    }

    async findItem(cartId: string, productId: string): Promise<CartItem | undefined> {
        const [row] = await db
            .select()
            .from(cartItems)
            .where(and(eq(cartItems.cartId, cartId), eq(cartItems.productId, productId)))
            .limit(1);
        return row;
    }

    async findItemById(itemId: string): Promise<CartItem | undefined> {
        const [row] = await db.select().from(cartItems).where(eq(cartItems.id, itemId)).limit(1);
        return row;
    }

    async upsertItem(cartId: string, productId: string, quantity: number): Promise<CartItem> {
        const existing = await this.findItem(cartId, productId);
        if (existing) {
            const [row] = await db
                .update(cartItems)
                .set({ quantity, updatedAt: new Date() })
                .where(eq(cartItems.id, existing.id))
                .returning();
            if (!row) throw new Error("failed to update cart item");
            return row;
        }
        const [row] = await db
            .insert(cartItems)
            .values({ cartId, productId, quantity })
            .returning();
        if (!row) throw new Error("failed to create cart item");
        return row;
    }

    async updateItemQuantity(itemId: string, quantity: number): Promise<CartItem | undefined> {
        const [row] = await db
            .update(cartItems)
            .set({ quantity, updatedAt: new Date() })
            .where(eq(cartItems.id, itemId))
            .returning();
        return row;
    }

    async deleteItem(itemId: string): Promise<boolean> {
        const rows = await db
            .delete(cartItems)
            .where(eq(cartItems.id, itemId))
            .returning({ id: cartItems.id });
        return rows.length > 0;
    }

    async replaceItemAddons(
        cartItemId: string,
        selections: { addonId: string; quantity: number }[],
    ): Promise<void> {
        await db.delete(cartItemAddons).where(eq(cartItemAddons.cartItemId, cartItemId));
        if (!selections.length) return;
        await db.insert(cartItemAddons).values(
            selections.map(({ addonId, quantity }) => ({
                cartItemId,
                addonId,
                quantity,
            })),
        );
    }

    async listItemAddons(cartItemId: string): Promise<CartItemAddon[]> {
        return db.select().from(cartItemAddons).where(eq(cartItemAddons.cartItemId, cartItemId));
    }
}
