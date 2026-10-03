import { sql } from "drizzle-orm";
import { integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { cmsStatusEnum } from "@/modules/cms/banners/banner.schema.js";
import { cities } from "@/modules/geo/cities/city.schema.js";
import { uploads } from "@/modules/upload/media/media.schema.js";

export const cmsTestimonials = pgTable("cms_testimonials", {
    id: uuid("id").primaryKey().defaultRandom(),
    quote: text("quote").notNull(),
    reviewerName: text("reviewer_name").notNull(),
    reviewerCity: text("reviewer_city"),
    rating: integer("rating").notNull().default(5),
    accentColor: text("accent_color"),
    avatarUploadId: uuid("avatar_upload_id").references(() => uploads.id, { onDelete: "set null" }),
    cityId: uuid("city_id").references(() => cities.id, { onDelete: "set null" }),
    platforms: text("platforms")
        .array()
        .notNull()
        .default(sql`ARRAY['web','mobile']::text[]`),
    status: cmsStatusEnum("status").notNull().default("draft"),
    sortIndex: integer("sort_index").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type CmsTestimonial = typeof cmsTestimonials.$inferSelect;
export type NewCmsTestimonial = typeof cmsTestimonials.$inferInsert;
