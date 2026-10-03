import { pgEnum, pgTable, text, timestamp, uniqueIndex, uuid } from "drizzle-orm/pg-core";
import { users } from "@/modules/identity/users/user.schema.js";

export const pushDevicePlatformEnum = pgEnum("push_device_platform", ["android", "ios"]);

export const userPushDevices = pgTable(
    "user_push_devices",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        userId: uuid("user_id")
            .notNull()
            .references(() => users.id, { onDelete: "cascade" }),
        expoPushToken: text("expo_push_token").notNull(),
        platform: pushDevicePlatformEnum("platform").notNull(),
        lastSeenAt: timestamp("last_seen_at", { withTimezone: true }).defaultNow().notNull(),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [uniqueIndex("user_push_devices_expo_push_token_unique").on(table.expoPushToken)],
);

export type UserPushDevice = typeof userPushDevices.$inferSelect;
export type NewUserPushDevice = typeof userPushDevices.$inferInsert;
