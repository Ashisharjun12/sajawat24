import { bigint, integer, pgEnum, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { users } from "@/modules/identity/users/user.schema.js";

export const conversationTypeEnum = pgEnum("conversation_type", [
    "booking",
    "vendor_support",
    "customer_support",
    "complaint",
]);

export const conversationStatusEnum = pgEnum("conversation_status", [
    "open",
    "pending",
    "closed",
]);

export const conversationContextTypeEnum = pgEnum("conversation_context_type", [
    "order",
    "vendor",
    "product",
    "none",
]);

export const participantRoleEnum = pgEnum("participant_role", [
    "customer",
    "vendor",
    "admin",
]);

export const messageSenderRoleEnum = pgEnum("message_sender_role", [
    "customer",
    "vendor",
    "admin",
    "system",
]);

export const messageTypeEnum = pgEnum("message_type", ["text", "image", "file", "system"]);

export const conversations = pgTable("conversations", {
    id: uuid("id").primaryKey().defaultRandom(),
    type: conversationTypeEnum("type").notNull(),
    status: conversationStatusEnum("status").notNull().default("open"),
    subject: text("subject"),
    topicKey: text("topic_key"),
    contextType: conversationContextTypeEnum("context_type"),
    contextId: uuid("context_id"),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    lastMessagePreview: text("last_message_preview"),
    messageCount: integer("message_count").notNull().default(0),
    closedAt: timestamp("closed_at", { withTimezone: true }),
    closedBy: uuid("closed_by").references(() => users.id, { onDelete: "set null" }),
    assignedAdminId: uuid("assigned_admin_id").references(() => users.id, { onDelete: "set null" }),
    resolutionNote: text("resolution_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const conversationParticipants = pgTable("conversation_participants", {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
        .notNull()
        .references(() => conversations.id, { onDelete: "cascade" }),
    userId: uuid("user_id")
        .notNull()
        .references(() => users.id, { onDelete: "cascade" }),
    role: participantRoleEnum("role").notNull(),
    lastReadAt: timestamp("last_read_at", { withTimezone: true }),
    lastReadMessageId: uuid("last_read_message_id"),
    unreadCount: integer("unread_count").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const messages = pgTable("messages", {
    id: uuid("id").primaryKey().defaultRandom(),
    conversationId: uuid("conversation_id")
        .notNull()
        .references(() => conversations.id, { onDelete: "cascade" }),
    sequence: bigint("sequence", { mode: "number" }).notNull(),
    senderUserId: uuid("sender_user_id").references(() => users.id, { onDelete: "set null" }),
    senderRole: messageSenderRoleEnum("sender_role").notNull(),
    body: text("body"),
    messageType: messageTypeEnum("message_type").notNull().default("text"),
    attachmentUrl: text("attachment_url"),
    clientMessageId: uuid("client_message_id"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
export type ConversationParticipant = typeof conversationParticipants.$inferSelect;
export type Message = typeof messages.$inferSelect;
export type ConversationType = Conversation["type"];
export type ConversationStatus = Conversation["status"];
export type ParticipantRole = ConversationParticipant["role"];
export type MessageSenderRole = Message["senderRole"];
