import {
    boolean,
    integer,
    jsonb,
    pgEnum,
    pgTable,
    text,
    timestamp,
    uniqueIndex,
    uuid,
} from "drizzle-orm/pg-core";
import { users } from "@/modules/identity/users/user.schema.js";

export const notificationTemplateTypeEnum = pgEnum("notification_template_type", [
    "transactional",
    "promotional",
]);

export const notificationChannelEnum = pgEnum("notification_channel", [
    "sms",
    "email",
    "push",
    "in_app",
    "whatsapp",
]);

export const notificationPriorityEnum = pgEnum("notification_priority", [
    "critical",
    "standard",
    "promotional",
]);

export const notificationStatusEnum = pgEnum("notification_status", [
    "PENDING",
    "SCHEDULED",
    "SENT",
    "FAILED",
    "SKIPPED",
]);

export const notificationTemplates = pgTable(
    "notification_templates",
    {
        id: uuid("id").primaryKey().defaultRandom(),
        key: text("key").notNull(),
        name: text("name").notNull(),
        type: notificationTemplateTypeEnum("type").notNull(),
        channel: notificationChannelEnum("channel").notNull(),
        locale: text("locale").notNull().default("en"),
        editable: boolean("editable").notNull().default(true),
        isActive: boolean("is_active").notNull().default(true),
        createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
    },
    (table) => [
        uniqueIndex("notification_templates_key_channel_locale").on(
            table.key,
            table.channel,
            table.locale,
        ),
    ],
);

export const notificationTemplateVersions = pgTable("notification_template_versions", {
    id: uuid("id").primaryKey().defaultRandom(),
    templateId: uuid("template_id")
        .notNull()
        .references(() => notificationTemplates.id, { onDelete: "cascade" }),
    version: integer("version").notNull(),
    subject: text("subject"),
    content: text("content").notNull(),
    variables: jsonb("variables").$type<string[]>().notNull().default([]),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userNotificationPreferences = pgTable("user_notification_preferences", {
    userId: uuid("user_id")
        .primaryKey()
        .references(() => users.id, { onDelete: "cascade" }),
    sms: boolean("sms").notNull().default(true),
    email: boolean("email").notNull().default(true),
    push: boolean("push").notNull().default(true),
    inApp: boolean("in_app").notNull().default(true),
    whatsapp: boolean("whatsapp").notNull().default(false),
    promotionalEmail: boolean("promotional_email").notNull().default(false),
    promotionalSms: boolean("promotional_sms").notNull().default(false),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const notifications = pgTable("notifications", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id").references(() => users.id, { onDelete: "set null" }),
    event: text("event").notNull(),
    templateId: uuid("template_id").references(() => notificationTemplates.id, {
        onDelete: "set null",
    }),
    channel: notificationChannelEnum("channel").notNull(),
    priority: notificationPriorityEnum("priority").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull().default({}),
    status: notificationStatusEnum("status").notNull().default("PENDING"),
    idempotencyKey: text("idempotency_key").notNull().unique(),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    error: text("error"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const notificationDeliveries = pgTable("notification_deliveries", {
    id: uuid("id").primaryKey().defaultRandom(),
    notificationId: uuid("notification_id")
        .notNull()
        .references(() => notifications.id, { onDelete: "cascade" }),
    provider: text("provider").notNull(),
    providerRef: text("provider_ref"),
    attempt: integer("attempt").notNull().default(1),
    error: text("error"),
    status: notificationStatusEnum("status").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const notificationsOutbox = pgTable("notifications_outbox", {
    id: uuid("id").primaryKey().defaultRandom(),
    notificationId: uuid("notification_id")
        .notNull()
        .references(() => notifications.id, { onDelete: "cascade" }),
    queue: text("queue").notNull(),
    payload: jsonb("payload").$type<Record<string, unknown>>().notNull(),
    publishedAt: timestamp("published_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const notificationInbox = pgTable("notification_inbox", {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    body: text("body").notNull(),
    data: jsonb("data").$type<Record<string, unknown>>().notNull().default({}),
    readAt: timestamp("read_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type NotificationTemplate = typeof notificationTemplates.$inferSelect;
export type NotificationTemplateVersion = typeof notificationTemplateVersions.$inferSelect;
export type UserNotificationPreference = typeof userNotificationPreferences.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type NotificationDelivery = typeof notificationDeliveries.$inferSelect;
export type NotificationOutbox = typeof notificationsOutbox.$inferSelect;
export type NotificationInbox = typeof notificationInbox.$inferSelect;
export type NotificationChannel = (typeof notificationChannelEnum.enumValues)[number];
export type NotificationTemplateType = (typeof notificationTemplateTypeEnum.enumValues)[number];
export type NotificationPriority = (typeof notificationPriorityEnum.enumValues)[number];
export type NotificationStatus = (typeof notificationStatusEnum.enumValues)[number];
