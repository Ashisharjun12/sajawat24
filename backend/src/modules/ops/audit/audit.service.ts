import {
    AuditLogRepository,
    type AuditLogListQuery,
    type IAuditLogRepository,
} from "@/modules/ops/audit/audit-log.repository.js";
import type { AuditLog } from "@/modules/ops/audit/audit-log.schema.js";
import { parsePagination, type Paginated } from "@/shared/http/pagination.js";
import { logger } from "@/utils/logger.js";

export type AuditLogInput = {
    actorId: string;
    action: string;
    entityType: string;
    entityId: string;
    summary: string;
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
};

export type PublicAuditLog = {
    id: string;
    actorId: string;
    actorName: string | null;
    action: string;
    entityType: string;
    entityId: string;
    summary: string;
    before: Record<string, unknown> | null;
    after: Record<string, unknown> | null;
    createdAt: string;
};

export interface IAuditService {
    log(input: AuditLogInput): Promise<void>;
    listAdmin(query: Record<string, unknown>): Promise<Paginated<PublicAuditLog>>;
}

export class AuditService implements IAuditService {
    constructor(private readonly repo: IAuditLogRepository) {}

    async log(input: AuditLogInput): Promise<void> {
        try {
            await this.repo.insert({
                actorId: input.actorId,
                action: input.action,
                entityType: input.entityType,
                entityId: input.entityId,
                summary: input.summary,
                before: input.before ?? null,
                after: input.after ?? null,
            });
        } catch (err) {
            logger.error({ err, action: input.action, entityId: input.entityId }, "audit log failed");
        }
    }

    async listAdmin(query: Record<string, unknown>): Promise<Paginated<PublicAuditLog>> {
        const pagination = parsePagination(query);
        const listQuery: AuditLogListQuery = {
            action: typeof query.action === "string" ? query.action : undefined,
            entityType: typeof query.entityType === "string" ? query.entityType : undefined,
            entityId: typeof query.entityId === "string" ? query.entityId : undefined,
            from: typeof query.from === "string" ? query.from : undefined,
            to: typeof query.to === "string" ? query.to : undefined,
        };

        const { items, total } = await this.repo.list(pagination, listQuery);
        return {
            items: items.map(toPublicAuditLog),
            page: pagination.page,
            limit: pagination.limit,
            total,
        };
    }
}

function toPublicAuditLog(row: AuditLog & { actorName?: string | null }): PublicAuditLog {
    return {
        id: row.id,
        actorId: row.actorId,
        actorName: row.actorName ?? null,
        action: row.action,
        entityType: row.entityType,
        entityId: row.entityId,
        summary: row.summary,
        before: (row.before as Record<string, unknown> | null) ?? null,
        after: (row.after as Record<string, unknown> | null) ?? null,
        createdAt: row.createdAt.toISOString(),
    };
}

const auditRepository = new AuditLogRepository();
export const auditService = new AuditService(auditRepository);
