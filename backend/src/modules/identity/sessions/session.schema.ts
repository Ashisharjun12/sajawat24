import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "../users/user.schema.js";

export const sessions = pgTable("sessions", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    familyId: uuid("family_id").notNull().defaultRandom(),
    tokenHash: text("token_hash").notNull().unique(),
    device: text("device").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Session = typeof sessions.$inferSelect;
export type NewSession = typeof sessions.$inferInsert;
