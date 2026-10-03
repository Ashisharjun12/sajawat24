import { and, count, desc, eq, ilike, inArray, isNull, type SQL } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import { paginationOffset, type PaginationQuery } from "@/shared/http/pagination.js";
import {
    uploads,
    type MediaKind,
    type NewUpload,
    type OptimizeStatus,
    type Upload,
    type UploadStatus,
} from "@/modules/upload/media/media.schema.js";

export type UploadPatch = Partial<
    Pick<
        Upload,
        | "status"
        | "size"
        | "width"
        | "height"
        | "key"
        | "filename"
        | "mimeType"
        | "optimizedKey"
        | "optimizedAt"
        | "optimizeStatus"
        | "providerUploadId"
        | "folderId"
    >
>;

export type UploadListFilter = {
    q?: string;
    kind?: MediaKind;
    folderId?: string | null;
    status?: UploadStatus;
    optimizeStatus?: OptimizeStatus;
};

export interface IMediaRepository {
    findById(id: string): Promise<Upload | undefined>;
    findByIds(ids: string[]): Promise<Upload[]>;
    findByKey(key: string): Promise<Upload | undefined>;
    list(
        pagination: PaginationQuery,
        filter?: UploadListFilter,
    ): Promise<{ items: Upload[]; total: number }>;
    countByFolder(folderId: string): Promise<number>;
    insert(data: NewUpload): Promise<Upload>;
    update(id: string, data: UploadPatch): Promise<Upload | undefined>;
    remove(id: string): Promise<void>;
}

function listWhere(filter: UploadListFilter = {}): SQL | undefined {
    const conditions: SQL[] = [];
    const q = filter.q?.trim().replace(/[%_\\]/g, "");
    if (q) {
        conditions.push(ilike(uploads.filename, `%${q}%`));
    }
    if (filter.kind) {
        conditions.push(eq(uploads.kind, filter.kind));
    }
    if (filter.status) {
        conditions.push(eq(uploads.status, filter.status));
    }
    if (filter.optimizeStatus) {
        conditions.push(eq(uploads.optimizeStatus, filter.optimizeStatus));
    }
    if (filter.folderId === null) {
        conditions.push(isNull(uploads.folderId));
    } else if (filter.folderId) {
        conditions.push(eq(uploads.folderId, filter.folderId));
    }
    return conditions.length ? and(...conditions) : undefined;
}

export class MediaRepository implements IMediaRepository {
    async findById(id: string): Promise<Upload | undefined> {
        const [row] = await db.select().from(uploads).where(eq(uploads.id, id)).limit(1);
        return row;
    }

    async findByIds(ids: string[]): Promise<Upload[]> {
        const unique = [...new Set(ids.filter(Boolean))];
        if (unique.length === 0) return [];
        return db
            .select()
            .from(uploads)
            .where(and(inArray(uploads.id, unique), eq(uploads.status, "completed")));
    }

    async findByKey(key: string): Promise<Upload | undefined> {
        const [row] = await db.select().from(uploads).where(eq(uploads.key, key)).limit(1);
        return row;
    }

    async list(pagination: PaginationQuery, filter: UploadListFilter = {}) {
        const where = listWhere(filter);
        const [totalRow] = await db.select({ value: count() }).from(uploads).where(where);
        const items = await db
            .select()
            .from(uploads)
            .where(where)
            .orderBy(desc(uploads.createdAt))
            .limit(pagination.limit)
            .offset(paginationOffset(pagination));
        return { items, total: Number(totalRow?.value ?? 0) };
    }

    async countByFolder(folderId: string): Promise<number> {
        const [row] = await db.select({ value: count() }).from(uploads).where(eq(uploads.folderId, folderId));
        return Number(row?.value ?? 0);
    }

    async insert(data: NewUpload): Promise<Upload> {
        const [row] = await db.insert(uploads).values(data).returning();
        if (!row) {
            throw new Error("failed to create upload");
        }
        return row;
    }

    async update(id: string, data: UploadPatch): Promise<Upload | undefined> {
        const [row] = await db
            .update(uploads)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(uploads.id, id))
            .returning();
        return row;
    }

    async remove(id: string): Promise<void> {
        await db.delete(uploads).where(eq(uploads.id, id));
    }
}

export type { UploadStatus, OptimizeStatus };
