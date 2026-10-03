import { Router } from "express";
import { MediaController } from "@/modules/upload/media/media.controller.js";
import { MediaRepository } from "@/modules/upload/media/media.repository.js";
import { createMediaAdminRouter } from "@/modules/upload/media/media.route.js";
import { MediaService } from "@/modules/upload/media/media.service.js";
import { uploads, mediaFolders } from "@/modules/upload/media/media.schema.js";
import type { Upload } from "@/modules/upload/media/media.schema.js";
import { toPublicMedia, displayUrl, type PublicMedia } from "@/modules/upload/media/media.public.js";
import { buildDisplayUrlMap, urlFromMap } from "@/modules/upload/media/resolve-completed-urls.js";
import { FolderRepository } from "@/modules/upload/folders/folder.repository.js";
import { FolderService } from "@/modules/upload/folders/folder.service.js";
import { FolderController } from "@/modules/upload/folders/folder.controller.js";
import { createFolderAdminRouter } from "@/modules/upload/folders/folder.route.js";

const mediaRepository = new MediaRepository();
const folderRepository = new FolderRepository();
const mediaService = new MediaService(mediaRepository, folderRepository);
const folderService = new FolderService(folderRepository, mediaRepository);
const mediaController = new MediaController(mediaService);
const folderController = new FolderController(folderService);

export const mediaAdminRouter = createMediaAdminRouter(mediaController);
export const mediaFolderAdminRouter = createFolderAdminRouter(folderController);

export async function getCompletedUpload(id: string): Promise<Upload> {
    return mediaService.getCompleted(id);
}

export async function resolveCompletedDisplayUrls(uploadIds: string[]): Promise<Map<string, string>> {
    const unique = [...new Set(uploadIds.filter(Boolean))];
    if (unique.length === 0) return new Map();
    const rows = await mediaRepository.findByIds(unique);
    return buildDisplayUrlMap(rows);
}

export async function resolveCompletedUploads(uploadIds: string[]): Promise<Map<string, Upload>> {
    const unique = [...new Set(uploadIds.filter(Boolean))];
    if (unique.length === 0) return new Map();
    const rows = await mediaRepository.findByIds(unique);
    return new Map(rows.map((row) => [row.id, row]));
}

export { uploads, mediaFolders, toPublicMedia, displayUrl, mediaService, urlFromMap };
export type { PublicMedia };
