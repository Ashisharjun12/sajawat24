import { sql } from "drizzle-orm";
import {
    boolean,
    check,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uuid,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", ["user", "vendor", "vendor_staff", "admin"]);
export const userStatusEnum = pgEnum("user_status", ["active", "blocked"]);

export const users = pgTable(
    "users",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        phone: text("phone").unique(),
        email: text("email").unique(),
        passwordHash: text("password_hash"),
        googleId: text("google_id").unique(),
        name: text("name").notNull(),
        avatar: text("avatar"),
        role: userRoleEnum("role").notNull().default("user"),
        status: userStatusEnum("status").notNull().default("active"),
        phoneVerifiedAt: timestamp("phone_verified_at", { withTimezone: true }),
        mustChangePassword: boolean("must_change_password").notNull().default(false),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        check(
            "users_has_identity",
            sql`${table.phone} is not null or ${table.email} is not null or ${table.googleId} is not null`,
        ),
    ],
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type UserRole = (typeof userRoleEnum.enumValues)[number];
export type UserStatus = (typeof userStatusEnum.enumValues)[number];
