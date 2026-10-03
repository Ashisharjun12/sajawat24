import { sql } from "drizzle-orm";
import { type AnyPgColumn, integer, pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { users } from "@/modules/identity/users/user.schema.js";

export const mediaKindEnum = pgEnum("media_kind", ["image", "video", "file"]);
export const uploadStatusEnum = pgEnum("upload_status", ["pending", "completed", "failed"]);
export const optimizeStatusEnum = pgEnum("optimize_status", ["none", "queued", "completed", "failed"]);

export const mediaFolders = pgTable(
    "media_folders",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        name: text("name").notNull(),
        slug: text("slug").notNull(),
        parentId: uuid("parent_id").references((): AnyPgColumn => mediaFolders.id, { onDelete: "restrict" }),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        uniqueIndex("media_folders_root_slug").on(table.slug).where(sql`${table.parentId} is null`),
        uniqueIndex("media_folders_parent_slug")
            .on(table.parentId, table.slug)
            .where(sql`${table.parentId} is not null`),
    ],
);

export const uploads = pgTable("uploads", {
    id: uuid("id").primaryKey().defaultRandom(),
    uploadedBy: uuid("uploaded_by").references(() => users.id, { onDelete: "set null" }),
    folderId: uuid("folder_id").references(() => mediaFolders.id, { onDelete: "set null" }),
    kind: mediaKindEnum("kind").notNull(),
    key: text("key").notNull().unique(),
    filename: text("filename").notNull(),
    mimeType: text("mime_type").notNull(),
    size: integer("size"),
    status: uploadStatusEnum("status").notNull().default("pending"),
    width: integer("width"),
    height: integer("height"),
    durationMs: integer("duration_ms"),
    thumbnailKey: text("thumbnail_key"),
    optimizedKey: text("optimized_key"),
    optimizedAt: timestamp("optimized_at", { withTimezone: true }),
    optimizeStatus: optimizeStatusEnum("optimize_status").notNull().default("none"),
    providerUploadId: text("provider_upload_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export type MediaFolder = typeof mediaFolders.$inferSelect;
export type NewMediaFolder = typeof mediaFolders.$inferInsert;
export type Upload = typeof uploads.$inferSelect;
export type NewUpload = typeof uploads.$inferInsert;
export type MediaKind = (typeof mediaKindEnum.enumValues)[number];
export type UploadStatus = (typeof uploadStatusEnum.enumValues)[number];
export type OptimizeStatus = (typeof optimizeStatusEnum.enumValues)[number];
