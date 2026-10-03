import { storageProvider } from "@/infrastructure/storage/storage.factory.js";
import type { Upload } from "@/modules/upload/media/media.schema.js";

export type PublicMedia = {
    id: string;
    folderId: string | null;
    kind: Upload["kind"];
    filename: string;
    mimeType: string;
    size: number | null;
    status: Upload["status"];
    width: number | null;
    height: number | null;
    key: string;
    publicUrl: string;
    optimizedKey: string | null;
    optimizedUrl: string | null;
    optimizeStatus: Upload["optimizeStatus"];
    thumbnailKey: string | null;
    thumbnailUrl: string | null;
    createdAt: Date;
};

export function toPublicMedia(row: Upload): PublicMedia {
    return {
        id: row.id,
        folderId: row.folderId,
        kind: row.kind,
        filename: row.filename,
        mimeType: row.mimeType,
        size: row.size,
        status: row.status,
        width: row.width,
        height: row.height,
        key: row.key,
        publicUrl: storageProvider.getPublicUrl(row.key),
        optimizedKey: row.optimizedKey,
        optimizedUrl: row.optimizedKey ? storageProvider.getPublicUrl(row.optimizedKey) : null,
        optimizeStatus: row.optimizeStatus,
        thumbnailKey: row.thumbnailKey,
        thumbnailUrl: row.thumbnailKey ? storageProvider.getPublicUrl(row.thumbnailKey) : null,
        createdAt: row.createdAt,
    };
}

export function displayUrl(row: Upload): string {
    if (row.optimizedKey) {
        return storageProvider.getPublicUrl(row.optimizedKey);
    }
    return storageProvider.getPublicUrl(row.key);
}

export function safeFilename(name: string): string {
    const trimmed = name.trim().replace(/\\/g, "/").split("/").pop() || "file";
    const cleaned = trimmed.replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-");
    return cleaned.slice(0, 80) || "file";
}
