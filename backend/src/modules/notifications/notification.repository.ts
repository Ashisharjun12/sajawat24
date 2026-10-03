import { and, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { paginationOffset, type PaginationQuery } from "@/shared/http/pagination.js";
import { db } from "@/db/postgres-client.js";
import {
    notificationDeliveries,
    notificationInbox,
    notificationTemplateVersions,
    notificationTemplates,
    notifications,
    notificationsOutbox,
    userNotificationPreferences,
    type Notification,
    type NotificationChannel,
    type NotificationInbox,
    type NotificationOutbox,
    type NotificationStatus,
    type NotificationTemplate,
    type NotificationTemplateVersion,
    type UserNotificationPreference,
} from "@/modules/notifications/schema.js";

export type TemplateWithVersion = {
    template: NotificationTemplate;
    version: NotificationTemplateVersion;
};

export type AdminTemplateRow = NotificationTemplate & {
    activeVersion: NotificationTemplateVersion | null;
};

export class NotificationRepository {
    async findTemplateByKey(
        key: string,
        channel: NotificationChannel,
        locale = "en",
    ): Promise<TemplateWithVersion | null> {
        const [template] = await db
            .select()
            .from(notificationTemplates)
            .where(
                and(
                    eq(notificationTemplates.key, key),
                    eq(notificationTemplates.channel, channel),
                    eq(notificationTemplates.locale, locale),
                    eq(notificationTemplates.isActive, true),
                ),
            )
            .limit(1);
        if (!template) return null;
        const [version] = await db
            .select()
            .from(notificationTemplateVersions)
            .where(
                and(
                    eq(notificationTemplateVersions.templateId, template.id),
                    eq(notificationTemplateVersions.isActive, true),
                ),
            )
            .limit(1);
        if (!version) return null;
        return { template, version };
    }

    async listTemplates(): Promise<AdminTemplateRow[]> {
        const templates = await db
            .select()
            .from(notificationTemplates)
            .orderBy(notificationTemplates.key, notificationTemplates.channel);
        const rows: AdminTemplateRow[] = [];
        for (const template of templates) {
            const [activeVersion] = await db
                .select()
                .from(notificationTemplateVersions)
                .where(
                    and(
                        eq(notificationTemplateVersions.templateId, template.id),
                        eq(notificationTemplateVersions.isActive, true),
                    ),
                )
                .limit(1);
            rows.push({ ...template, activeVersion: activeVersion ?? null });
        }
        return rows;
    }

    async findTemplateById(id: string): Promise<NotificationTemplate | undefined> {
        const [row] = await db
            .select()
            .from(notificationTemplates)
            .where(eq(notificationTemplates.id, id))
            .limit(1);
        return row;
    }

    async updateTemplate(
        id: string,
        data: Partial<Pick<NotificationTemplate, "name" | "isActive">>,
    ): Promise<NotificationTemplate | undefined> {
        const [row] = await db
            .update(notificationTemplates)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(notificationTemplates.id, id))
            .returning();
        return row;
    }

    async maxVersion(templateId: string): Promise<number> {
        const [row] = await db
            .select({
                value: sql<number>`coalesce(max(${notificationTemplateVersions.version}), 0)`,
            })
            .from(notificationTemplateVersions)
            .where(eq(notificationTemplateVersions.templateId, templateId));
        return Number(row?.value ?? 0);
    }

    async createVersion(input: {
        templateId: string;
        version: number;
        subject: string | null;
        content: string;
        variables: string[];
    }): Promise<NotificationTemplateVersion> {
        return db.transaction(async (tx) => {
            await tx
                .update(notificationTemplateVersions)
                .set({ isActive: false })
                .where(eq(notificationTemplateVersions.templateId, input.templateId));
            const [row] = await tx
                .insert(notificationTemplateVersions)
                .values({
                    templateId: input.templateId,
                    version: input.version,
                    subject: input.subject,
                    content: input.content,
                    variables: input.variables,
                    isActive: true,
                })
                .returning();
            if (!row) throw new Error("failed to create template version");
            await tx
                .update(notificationTemplates)
                .set({ updatedAt: new Date() })
                .where(eq(notificationTemplates.id, input.templateId));
            return row;
        });
    }

    async findPreference(userId: string): Promise<UserNotificationPreference | undefined> {
        const [row] = await db
            .select()
            .from(userNotificationPreferences)
            .where(eq(userNotificationPreferences.userId, userId))
            .limit(1);
        return row;
    }

    async upsertPreference(
        userId: string,
        data: Partial<
            Pick<
                UserNotificationPreference,
                "sms" | "email" | "push" | "inApp" | "whatsapp" | "promotionalEmail" | "promotionalSms"
            >
        >,
    ): Promise<UserNotificationPreference> {
        const [row] = await db
            .insert(userNotificationPreferences)
            .values({
                userId,
                ...data,
                updatedAt: new Date(),
            })
            .onConflictDoUpdate({
                target: userNotificationPreferences.userId,
                set: { ...data, updatedAt: new Date() },
            })
            .returning();
        if (!row) throw new Error("failed to upsert notification preferences");
        return row;
    }

    async findByIdempotencyKey(key: string): Promise<Notification | undefined> {
        const [row] = await db
            .select()
            .from(notifications)
            .where(eq(notifications.idempotencyKey, key))
            .limit(1);
        return row;
    }

    async insertIntent(input: {
        userId: string | null;
        event: string;
        templateId: string | null;
        channel: NotificationChannel;
        priority: Notification["priority"];
        payload: Record<string, unknown>;
        status: NotificationStatus;
        idempotencyKey: string;
        scheduledAt: Date | null;
        error: string | null;
        outbox: { queue: string; payload: Record<string, unknown> } | null;
    }): Promise<{ notification: Notification; outboxId: string | null }> {
        return db.transaction(async (tx) => {
            const [row] = await tx
                .insert(notifications)
                .values({
                    userId: input.userId,
                    event: input.event,
                    templateId: input.templateId,
                    channel: input.channel,
                    priority: input.priority,
                    payload: input.payload,
                    status: input.status,
                    idempotencyKey: input.idempotencyKey,
                    scheduledAt: input.scheduledAt,
                    error: input.error,
                })
                .returning();
            if (!row) throw new Error("failed to insert notification");
            if (input.outbox && input.status === "PENDING") {
                const [outbox] = await tx
                    .insert(notificationsOutbox)
                    .values({
                        notificationId: row.id,
                        queue: input.outbox.queue,
                        payload: input.outbox.payload,
                    })
                    .returning();
                return { notification: row, outboxId: outbox?.id ?? null };
            }
            return { notification: row, outboxId: null };
        });
    }

    async claimOutboxById(id: string): Promise<NotificationOutbox | undefined> {
        return db.transaction(async (tx) => {
            const rows = await tx
                .select()
                .from(notificationsOutbox)
                .where(and(eq(notificationsOutbox.id, id), isNull(notificationsOutbox.publishedAt)))
                .limit(1)
                .for("update", { skipLocked: true });
            const row = rows[0];
            if (!row) return undefined;
            await tx
                .update(notificationsOutbox)
                .set({ publishedAt: new Date() })
                .where(eq(notificationsOutbox.id, id));
            return row;
        });
    }

    async claimOutbox(limit: number): Promise<NotificationOutbox[]> {
        return db.transaction(async (tx) => {
            const rows = await tx
                .select()
                .from(notificationsOutbox)
                .where(isNull(notificationsOutbox.publishedAt))
                .orderBy(notificationsOutbox.createdAt)
                .limit(limit)
                .for("update", { skipLocked: true });
            if (rows.length === 0) return [];
            await tx
                .update(notificationsOutbox)
                .set({ publishedAt: new Date() })
                .where(
                    inArray(
                        notificationsOutbox.id,
                        rows.map((row) => row.id),
                    ),
                );
            return rows;
        });
    }

    async resetOutboxClaim(id: string): Promise<void> {
        await db
            .update(notificationsOutbox)
            .set({ publishedAt: null })
            .where(eq(notificationsOutbox.id, id));
    }

    async markNotification(
        id: string,
        status: NotificationStatus,
        error: string | null = null,
    ): Promise<void> {
        await db
            .update(notifications)
            .set({ status, error, updatedAt: new Date() })
            .where(eq(notifications.id, id));
    }

    async insertDelivery(input: {
        notificationId: string;
        provider: string;
        providerRef?: string | null;
        attempt: number;
        error?: string | null;
        status: NotificationStatus;
    }): Promise<void> {
        await db.insert(notificationDeliveries).values({
            notificationId: input.notificationId,
            provider: input.provider,
            providerRef: input.providerRef ?? null,
            attempt: input.attempt,
            error: input.error ?? null,
            status: input.status,
        });
    }

    async insertInbox(input: {
        userId: string;
        title: string;
        body: string;
        data: Record<string, unknown>;
    }): Promise<NotificationInbox> {
        const [row] = await db.insert(notificationInbox).values(input).returning();
        if (!row) throw new Error("failed to insert inbox notification");
        return row;
    }

    async listInboxForUser(
        userId: string,
        pagination: PaginationQuery,
    ): Promise<{ items: NotificationInbox[]; total: number }> {
        const offset = paginationOffset(pagination);
        const where = eq(notificationInbox.userId, userId);
        const [countRow] = await db
            .select({ total: sql<number>`count(*)::int` })
            .from(notificationInbox)
            .where(where);
        const items = await db
            .select()
            .from(notificationInbox)
            .where(where)
            .orderBy(desc(notificationInbox.createdAt))
            .limit(pagination.limit)
            .offset(offset);
        return { items, total: countRow?.total ?? 0 };
    }

    async markInboxRead(userId: string, id: string): Promise<NotificationInbox | undefined> {
        const [row] = await db
            .update(notificationInbox)
            .set({ readAt: new Date() })
            .where(and(eq(notificationInbox.id, id), eq(notificationInbox.userId, userId)))
            .returning();
        return row;
    }

    async markAllInboxRead(userId: string): Promise<number> {
        const rows = await db
            .update(notificationInbox)
            .set({ readAt: new Date() })
            .where(and(eq(notificationInbox.userId, userId), isNull(notificationInbox.readAt)))
            .returning({ id: notificationInbox.id });
        return rows.length;
    }
}
