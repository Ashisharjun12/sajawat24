import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { products } from "@/modules/catalog/products/product.schema.js";
import { users } from "@/modules/identity/users/user.schema.js";
import { uploads } from "@/modules/upload/media/media.schema.js";
import { reviewStatusEnum } from "@/modules/reviews/customer-reviews/customer-review.schema.js";

export const videoReviews = pgTable("video_reviews", {
    id: uuid("id").primaryKey().defaultRandom(),
    productId: uuid("product_id").references(() => products.id, { onDelete: "set null" }),
    uploadId: uuid("upload_id")
        .notNull()
        .references(() => uploads.id, { onDelete: "restrict" }),
    caption: text("caption"),
    status: reviewStatusEnum("status").notNull().default("draft"),
    sortIndex: integer("sort_index").notNull().default(0),
    createdByAdminId: uuid("created_by_admin_id").references(() => users.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type VideoReview = typeof videoReviews.$inferSelect;
export type NewVideoReview = typeof videoReviews.$inferInsert;
