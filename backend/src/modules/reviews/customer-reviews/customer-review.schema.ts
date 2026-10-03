import { sql } from "drizzle-orm";
import { boolean, integer, jsonb, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { orders } from "@/modules/booking/orders/order.schema.js";
import { products } from "@/modules/catalog/products/product.schema.js";
import { users } from "@/modules/identity/users/user.schema.js";
import { uploads } from "@/modules/upload/media/media.schema.js";

export const reviewStatusEnum = pgEnum("review_status", ["draft", "published", "hidden"]);
export const customerReviewSourceEnum = pgEnum("customer_review_source", ["admin", "customer"]);

export const customerReviews = pgTable("customer_reviews", {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id")
        .notNull()
        .references(() => products.id, { onDelete: "cascade" }),
    rating: integer("rating").notNull(),
    body: text("body").notNull(),
    reviewerName: text("reviewer_name").notNull(),
    reviewerCity: text("reviewer_city"),
    reviewerAvatarUploadId: uuid("reviewer_avatar_upload_id").references(() => uploads.id, {
        onDelete: "set null",
    }),
    photoUploadIds: jsonb("photo_upload_ids")
        .$type<string[]>()
        .notNull()
        .default(sql`'[]'::jsonb`),
    isVerified: boolean("is_verified").notNull().default(false),
    status: reviewStatusEnum("status").notNull().default("draft"),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }).defaultNow().notNull(),
    sortIndex: integer("sort_index").notNull().default(0),
    source: customerReviewSourceEnum("source").notNull().default("admin"),
    orderId: uuid("order_id").references(() => orders.id, { onDelete: "set null" }),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    createdByAdminId: uuid("created_by_admin_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type CustomerReview = typeof customerReviews.$inferSelect;
export type NewCustomerReview = typeof customerReviews.$inferInsert;
