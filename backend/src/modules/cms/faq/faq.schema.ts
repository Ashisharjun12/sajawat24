import { sql } from "drizzle-orm";
import { index, integer, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { cmsStatusEnum } from "@/modules/cms/banners/banner.schema.js";

export const cmsHomeFaqItems = pgTable(
    "cms_home_faq_items",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        question: text("question").notNull(),
        answer: text("answer").notNull(),
        status: cmsStatusEnum("status").notNull().default("draft"),
        sortIndex: integer("sort_index").notNull().default(0),
        platforms: text("platforms")
            .array()
            .notNull()
            .default(sql`ARRAY['web','mobile']::text[]`),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [index("cms_home_faq_items_status_sort_idx").on(table.status, table.sortIndex)],
);

export type CmsHomeFaqItem = typeof cmsHomeFaqItems.$inferSelect;
export type NewCmsHomeFaqItem = typeof cmsHomeFaqItems.$inferInsert;
