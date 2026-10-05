import { index, pgTable, timestamp, unique, uuid } from "drizzle-orm/pg-core";
import { products } from "@/modules/catalog/products/product.schema.js";
import { users } from "@/modules/identity/users/user.schema.js";

export const wishlistItems = pgTable(
    "wishlist_items",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        productId: uuid("product_id")
            .notNull()
            .references(() => products.id, { onDelete: "cascade" }),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        unique("wishlist_items_user_product").on(table.userId, table.productId),
        index("wishlist_items_user_created_idx").on(table.userId, table.createdAt),
    ],
);

export type WishlistItem = typeof wishlistItems.$inferSelect;
export type NewWishlistItem = typeof wishlistItems.$inferInsert;
