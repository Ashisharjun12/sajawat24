import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "@/modules/identity/users/user.schema.js";

export const adminEmailChangeRequests = pgTable(
    "admin_email_change_requests",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        newEmail: text("new_email").notNull(),
        tokenHash: text("token_hash").notNull(),
        expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        usedAt: timestamp("used_at", { withTimezone: true }),
        newPasswordHash: text("new_password_hash"),
    },
    (table) => [
        index("admin_email_change_requests_user_id_idx").on(table.userId),
        index("admin_email_change_requests_token_hash_idx").on(table.tokenHash),
    ],
);

export type AdminEmailChangeRequest = typeof adminEmailChangeRequests.$inferSelect;
export type NewAdminEmailChangeRequest = typeof adminEmailChangeRequests.$inferInsert;
