import { sql } from "drizzle-orm";
import { boolean, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { cities } from "@/modules/geo/cities/city.schema.js";
import { uploads } from "@/modules/upload/media/media.schema.js";

export const cmsPlacementEnum = pgEnum("cms_placement", [
    "announcement_bar",
    "home_hero",
    "home_mid",
    "home_end",
]);

export const cmsStatusEnum = pgEnum("cms_status", ["draft", "published", "hidden"]);

export const cmsAnnouncementToneEnum = pgEnum("cms_announcement_tone", ["info", "promo", "warning"]);

export const cmsBanners = pgTable("cms_banners", {
    id: uuid("id").primaryKey().defaultRandom(),
    placement: cmsPlacementEnum("placement").notNull(),
    cityId: uuid("city_id").references(() => cities.id, { onDelete: "set null" }),
    platforms: text("platforms")
        .array()
        .notNull()
        .default(sql`ARRAY['web','mobile']::text[]`),
    status: cmsStatusEnum("status").notNull().default("draft"),
    sortIndex: integer("sort_index").notNull().default(0),
    priority: integer("priority").notNull().default(0),
    startsAt: timestamp("starts_at", { withTimezone: true }),
    endsAt: timestamp("ends_at", { withTimezone: true }),
    title: text("title"),
    subtitle: text("subtitle"),
    tag: text("tag"),
    imageUploadId: uuid("image_upload_id").references(() => uploads.id, { onDelete: "set null" }),
    mobileImageUploadId: uuid("mobile_image_upload_id").references(() => uploads.id, {
        onDelete: "set null",
    }),
    alt: text("alt"),
    ctaLabel: text("cta_label"),
    href: text("href"),
    secondaryLabel: text("secondary_label"),
    secondaryHref: text("secondary_href"),
    message: text("message"),
    tone: cmsAnnouncementToneEnum("tone"),
    accentColor: text("accent_color"),
    dismissible: boolean("dismissible").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type CmsBanner = typeof cmsBanners.$inferSelect;
export type NewCmsBanner = typeof cmsBanners.$inferInsert;
