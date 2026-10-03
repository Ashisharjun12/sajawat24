import { and, count, desc, eq, gte, lte } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import { users } from "@/modules/identity/users/user.schema.js";
import {
    auditLogs,
    type AuditLog,
    type NewAuditLog,
} from "@/modules/ops/audit/audit-log.schema.js";
import { paginationOffset, type PaginationQuery } from "@/shared/http/pagination.js";

export type AuditLogListQuery = {
    action?: string;
    entityType?: string;
    entityId?: string;
    from?: string;
    to?: string;
};

export type AuditLogListRow = AuditLog & {
    actorName: string | null;
};

export interface IAuditLogRepository {
    insert(input: NewAuditLog): Promise<AuditLog>;
    list(
        pagination: PaginationQuery,
        query: AuditLogListQuery,
    ): Promise<{ items: AuditLogListRow[]; total: number }>;
}

export class AuditLogRepository implements IAuditLogRepository {
    async insert(input: NewAuditLog): Promise<AuditLog> {
        const [row] = await db.insert(auditLogs).values(input).returning();
        if (!row) {
            throw new Error("failed to insert audit log");
        }
        return row;
    }

    async list(
        pagination: PaginationQuery,
        query: AuditLogListQuery,
    ): Promise<{ items: AuditLogListRow[]; total: number }> {
        const filters = [];

        if (query.action?.trim()) {
            filters.push(eq(auditLogs.action, query.action.trim()));
        }
        if (query.entityType?.trim()) {
            filters.push(eq(auditLogs.entityType, query.entityType.trim()));
        }
        if (query.entityId?.trim()) {
            filters.push(eq(auditLogs.entityId, query.entityId.trim()));
        }
        if (query.from) {
            const from = new Date(query.from);
            if (!Number.isNaN(from.getTime())) {
                filters.push(gte(auditLogs.createdAt, from));
            }
        }
        if (query.to) {
            const to = new Date(query.to);
            if (!Number.isNaN(to.getTime())) {
                filters.push(lte(auditLogs.createdAt, to));
            }
        }

        const where = filters.length ? and(...filters) : undefined;
        const offset = paginationOffset(pagination);

        const [totalRow] = await db
            .select({ total: count() })
            .from(auditLogs)
            .where(where);

        const items = await db
            .select({
                id: auditLogs.id,
                actorId: auditLogs.actorId,
                action: auditLogs.action,
                entityType: auditLogs.entityType,
                entityId: auditLogs.entityId,
                summary: auditLogs.summary,
                before: auditLogs.before,
                after: auditLogs.after,
                createdAt: auditLogs.createdAt,
                actorName: users.name,
            })
            .from(auditLogs)
            .leftJoin(users, eq(auditLogs.actorId, users.id))
            .where(where)
            .orderBy(desc(auditLogs.createdAt))
            .limit(pagination.limit)
            .offset(offset);

        return {
            items: items.map((row) => ({
                id: row.id,
                actorId: row.actorId,
                action: row.action,
                entityType: row.entityType,
                entityId: row.entityId,
                summary: row.summary,
                before: row.before,
                after: row.after,
                createdAt: row.createdAt,
                actorName: row.actorName,
            })),
            total: Number(totalRow?.total ?? 0),
        };
    }
}
