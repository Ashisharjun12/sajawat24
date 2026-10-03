import { randomUUID } from "node:crypto";
import { ApiError } from "@/shared/errors/apiError.js";
import { parsePagination } from "@/shared/http/pagination.js";
import { isForeignKeyViolation } from "@/modules/geo/pg-error.js";
import { getQueues } from "@/infrastructure/queue/bull.connection.js";
import { storageProvider } from "@/infrastructure/storage/storage.factory.js";
import type { IMediaRepository } from "@/modules/upload/media/media.repository.js";
import type { IFolderRepository } from "@/modules/upload/folders/folder.repository.js";
import { safeFilename, toPublicMedia, type PublicMedia } from "@/modules/upload/media/media.public.js";
import type { ImageCropInput } from "@/modules/upload/media/media.dto.js";
import { runImagePipeline } from "@/modules/upload/media/image.pipeline.js";
import type { MediaKind, OptimizeStatus, Upload, UploadStatus } from "@/modules/upload/media/media.schema.js";

const IMAGE_MIMES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const VIDEO_MIMES = new Set(["video/mp4", "video/webm"]);
const FILE_MIMES = new Set(["application/pdf"]);

export type PresignInput = {
    id?: string;
    filename: string;
    mimeType: string;
    kind: MediaKind;
    uploadedBy?: string | null;
    folderId?: string | null;
    optimize?: boolean;
    storageKey?: string;
};

export type IngestInput = {
    buffer: Buffer;
    filename: string;
    mimeType: string;
    uploadedBy?: string | null;
    folderId?: string | null;
    crop?: ImageCropInput;
};

export type PresignResult =
    | (PublicMedia & { uploadMode: "direct"; uploadUrl: string })
    | { uploadMode: "ingest" };

export interface IMediaService {
    presign(input: PresignInput): Promise<PresignResult>;
    ingest(input: IngestInput): Promise<PublicMedia>;
    complete(id: string): Promise<PublicMedia>;
    list(query: {
        page?: unknown;
        limit?: unknown;
        q?: unknown;
        kind?: unknown;
        folderId?: unknown;
        status?: unknown;
        optimizeStatus?: unknown;
    }): Promise<{ items: PublicMedia[]; page: number; limit: number; total: number }>;
    get(id: string): Promise<PublicMedia>;
    getCompleted(id: string): Promise<Upload>;
    patch(id: string, input: { folderId?: string | null; filename?: string }): Promise<PublicMedia>;
    queueOptimize(
        id: string,
        input?: { crop?: ImageCropInput; output?: { width?: number; height?: number } },
    ): Promise<PublicMedia>;
    remove(id: string): Promise<void>;
}

function keepExtension(next: string, current: string): string {
    if (/\.[a-z0-9]+$/i.test(next)) return next;
    const ext = current.match(/\.[a-z0-9]+$/i)?.[0] ?? "";
    return `${next}${ext}`;
}

function assertMime(kind: MediaKind, mimeType: string) {
    if (kind === "image" && !IMAGE_MIMES.has(mimeType)) {
        throw ApiError.badRequest("unsupported image type");
    }
    if (kind === "video" && !VIDEO_MIMES.has(mimeType)) {
        throw ApiError.badRequest("unsupported video type");
    }
    if (kind === "file" && !FILE_MIMES.has(mimeType)) {
        throw ApiError.badRequest("unsupported file type");
    }
}

function buildObjectKey(kind: MediaKind, id: string, filename: string): string {
    const now = new Date();
    const yyyy = String(now.getUTCFullYear());
    const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
    return `uploads/${kind}/${yyyy}/${mm}/${id}-${filename}`;
}

export class MediaService implements IMediaService {
    constructor(
        private readonly media: IMediaRepository,
        private readonly folders: IFolderRepository,
    ) {}

    private async assertFolder(folderId: string | null | undefined): Promise<string | null> {
        if (!folderId) return null;
        const folder = await this.folders.findById(folderId);
        if (!folder) throw ApiError.notFound("folder not found");
        return folderId;
    }

    async presign(input: PresignInput): Promise<PresignResult> {
        const mimeType = input.mimeType.trim().toLowerCase();
        assertMime(input.kind, mimeType);

        const folderId = await this.assertFolder(input.folderId);
        const id = input.id ?? randomUUID();
        const filename = safeFilename(input.filename);
        const optimize = input.optimize === true && input.kind === "image";

        if (optimize) {
            return { uploadMode: "ingest" };
        }

        if (!storageProvider.getPresignedUploadUrlForKey) {
            throw ApiError.internalServerError("storage presign is not configured");
        }

        const key = input.storageKey ?? buildObjectKey(input.kind, id, filename);
        const signed = await storageProvider.getPresignedUploadUrlForKey(key, mimeType);
        const row = await this.media.insert({
            id,
            uploadedBy: input.uploadedBy ?? null,
            folderId,
            kind: input.kind,
            key,
            filename,
            mimeType,
            status: "pending",
            optimizeStatus: "none",
        });

        return {
            ...toPublicMedia(row),
            uploadMode: "direct",
            uploadUrl: signed.uploadUrl,
        };
    }

    async ingest(input: IngestInput): Promise<PublicMedia> {
        const mimeType = input.mimeType.trim().toLowerCase();
        assertMime("image", mimeType);

        const folderId = await this.assertFolder(input.folderId);
        const id = randomUUID();
        const baseName = safeFilename(input.filename).replace(/\.[^.]+$/, "");
        const filename = `${baseName}.webp`;
        const key = buildObjectKey("image", id, filename);

        const { buffer, width, height } = await runImagePipeline(input.buffer, input.crop);
        await storageProvider.putObject(key, buffer, "image/webp");

        const row = await this.media.insert({
            id,
            uploadedBy: input.uploadedBy ?? null,
            folderId,
            kind: "image",
            key,
            filename,
            mimeType: "image/webp",
            size: buffer.length,
            status: "completed",
            width,
            height,
            optimizeStatus: "completed",
        });

        return toPublicMedia(row);
    }

    async complete(id: string): Promise<PublicMedia> {
        const existing = await this.media.findById(id);
        if (!existing) {
            throw ApiError.notFound("upload not found");
        }
        const head = await storageProvider.headObject(existing.key);
        if (!head) {
            await this.media.update(id, { status: "failed" });
            throw ApiError.badRequest("object not found in storage");
        }
        const row = await this.media.update(id, {
            status: "completed",
            size: head.size,
        });
        if (!row) {
            throw ApiError.notFound("upload not found");
        }
        return toPublicMedia(row);
    }

    async list(query: {
        page?: unknown;
        limit?: unknown;
        q?: unknown;
        kind?: unknown;
        folderId?: unknown;
        status?: unknown;
        optimizeStatus?: unknown;
    }) {
        const pagination = parsePagination(query);
        const q = typeof query.q === "string" ? query.q.trim() : "";
        const kind =
            query.kind === "image" || query.kind === "video" || query.kind === "file"
                ? query.kind
                : undefined;
        const status =
            query.status === "pending" || query.status === "completed" || query.status === "failed"
                ? (query.status as UploadStatus)
                : undefined;
        const optimizeStatus =
            query.optimizeStatus === "none" ||
            query.optimizeStatus === "queued" ||
            query.optimizeStatus === "completed" ||
            query.optimizeStatus === "failed"
                ? (query.optimizeStatus as OptimizeStatus)
                : undefined;
        let folderId: string | null | undefined;
        if (query.folderId === "null" || query.folderId === "") folderId = null;
        else if (typeof query.folderId === "string") folderId = query.folderId;
        const { items, total } = await this.media.list(pagination, {
            q: q || undefined,
            kind,
            folderId,
            status,
            optimizeStatus,
        });
        return {
            items: items.map(toPublicMedia),
            page: pagination.page,
            limit: pagination.limit,
            total,
        };
    }

    async get(id: string): Promise<PublicMedia> {
        const row = await this.media.findById(id);
        if (!row) {
            throw ApiError.notFound("upload not found");
        }
        return toPublicMedia(row);
    }

    async getCompleted(id: string): Promise<Upload> {
        const row = await this.media.findById(id);
        if (!row || row.status !== "completed") {
            throw ApiError.badRequest("upload is not completed");
        }
        return row;
    }

    async patch(id: string, input: { folderId?: string | null; filename?: string }): Promise<PublicMedia> {
        const existing = await this.media.findById(id);
        if (!existing) throw ApiError.notFound("upload not found");
        const data: { folderId?: string | null; filename?: string } = {};
        if (input.folderId !== undefined) {
            data.folderId = await this.assertFolder(input.folderId);
        }
        if (input.filename !== undefined) {
            data.filename = keepExtension(safeFilename(input.filename), existing.filename);
        }
        const row = await this.media.update(id, data);
        if (!row) throw ApiError.notFound("upload not found");
        return toPublicMedia(row);
    }

    async queueOptimize(
        id: string,
        input: { crop?: ImageCropInput; output?: { width?: number; height?: number } } = {},
    ): Promise<PublicMedia> {
        const existing = await this.media.findById(id);
        if (!existing) {
            throw ApiError.notFound("upload not found");
        }
        if (existing.kind !== "image") {
            throw ApiError.badRequest("only images can be optimized");
        }
        if (existing.status !== "completed") {
            throw ApiError.badRequest("upload is not completed");
        }
        if (existing.optimizeStatus === "queued" || existing.optimizeStatus === "completed") {
            return toPublicMedia(existing);
        }

        const row = await this.media.update(id, { optimizeStatus: "queued" });
        if (!row) {
            throw ApiError.notFound("upload not found");
        }
        await getQueues().imageOptimize.add(
            "optimize",
            { uploadId: id, crop: input.crop, output: input.output },
            { jobId: `optimize-${id}`, removeOnComplete: 100, attempts: 3 },
        );
        return toPublicMedia(row);
    }

    async remove(id: string): Promise<void> {
        const existing = await this.media.findById(id);
        if (!existing) {
            throw ApiError.notFound("upload not found");
        }
        try {
            await this.media.remove(id);
        } catch (err) {
            if (isForeignKeyViolation(err)) {
                throw ApiError.conflict("upload is still in use");
            }
            throw err;
        }
        await storageProvider.delete(existing.key);
        if (existing.optimizedKey) {
            await storageProvider.delete(existing.optimizedKey);
        }
    }
}
