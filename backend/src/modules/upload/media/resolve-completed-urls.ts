import { displayUrl, toPublicMedia } from "@/modules/upload/media/media.public.js";
import type { Upload } from "@/modules/upload/media/media.schema.js";

export function displayUrlFromUpload(upload: Upload): string {
    const media = toPublicMedia(upload);
    return media.optimizedUrl ?? media.publicUrl ?? displayUrl(upload);
}

export function buildDisplayUrlMap(uploads: Upload[]): Map<string, string> {
    const map = new Map<string, string>();
    for (const upload of uploads) {
        if (upload.status !== "completed") continue;
        map.set(upload.id, displayUrlFromUpload(upload));
    }
    return map;
}

export function urlFromMap(map: Map<string, string>, uploadId: string | null | undefined): string | null {
    if (!uploadId) return null;
    return map.get(uploadId) ?? null;
}
