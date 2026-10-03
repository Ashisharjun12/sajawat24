import { sql } from "drizzle-orm";
import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { cmsStatusEnum } from "@/modules/cms/banners/banner.schema.js";
import { uploads } from "@/modules/upload/media/media.schema.js";

export const cmsSocialLinks = pgTable(
    "cms_social_links",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        label: text("label").notNull(),
        href: text("href").notNull(),
        iconPreset: text("icon_preset"),
        iconUploadId: uuid("icon_upload_id").references(() => uploads.id, { onDelete: "set null" }),
        status: cmsStatusEnum("status").notNull().default("draft"),
        sortIndex: integer("sort_index").notNull().default(0),
        platforms: text("platforms")
            .array()
            .notNull()
            .default(sql`ARRAY['web','mobile']::text[]`),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [index("cms_social_links_status_sort_idx").on(table.status, table.sortIndex)],
);

export type CmsSocialLink = typeof cmsSocialLinks.$inferSelect;
export type NewCmsSocialLink = typeof cmsSocialLinks.$inferInsert;
