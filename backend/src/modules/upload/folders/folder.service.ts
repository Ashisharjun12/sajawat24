import { ApiError } from "@/shared/errors/apiError.js";
import { isUniqueViolation } from "@/modules/geo/pg-error.js";
import { slugify } from "@/shared/slug.js";
import type { IFolderRepository } from "@/modules/upload/folders/folder.repository.js";
import type { IMediaRepository } from "@/modules/upload/media/media.repository.js";
import type { MediaFolder } from "@/modules/upload/media/media.schema.js";

export type FolderTree = MediaFolder & { children: FolderTree[] };

export type CreateFolderInput = {
    name: string;
    slug?: string;
    parentId?: string | null;
};

export type PatchFolderInput = {
    name?: string;
    slug?: string;
    parentId?: string | null;
};

export class FolderService {
    constructor(
        private readonly folders: IFolderRepository,
        private readonly media: IMediaRepository,
    ) {}

    async list(
        parentId?: string | null | undefined,
        q?: string,
    ): Promise<FolderTree[] | MediaFolder[]> {
        if (parentId === undefined) {
            return this.tree(q);
        }
        return this.folders.listByParent(parentId);
    }

    async tree(q?: string): Promise<FolderTree[]> {
        const rows = await this.folders.listAll();
        const byParent = new Map<string | null, MediaFolder[]>();
        for (const row of rows) {
            const key = row.parentId;
            const list = byParent.get(key) ?? [];
            list.push(row);
            byParent.set(key, list);
        }
        const toTree = (row: MediaFolder): FolderTree => ({
            ...row,
            children: (byParent.get(row.id) ?? []).map(toTree),
        });
        let roots = (byParent.get(null) ?? []).map(toTree);
        const term = q?.trim().toLowerCase();
        if (term) {
            roots = roots.filter((folder) => folder.name.toLowerCase().includes(term));
        }
        return roots;
    }

    async create(input: CreateFolderInput): Promise<MediaFolder> {
        const name = input.name.trim();
        const slug = slugify(input.slug?.trim() || name);
        if (!slug) throw ApiError.badRequest("invalid folder slug");
        const parentId = input.parentId ?? null;
        if (parentId) {
            const parent = await this.folders.findById(parentId);
            if (!parent) throw ApiError.notFound("parent folder not found");
            if (parent.parentId) throw ApiError.badRequest("subfolder cannot have children");
        }
        try {
            return await this.folders.insert({ name, slug, parentId });
        } catch (err) {
            if (isUniqueViolation(err)) throw ApiError.conflict("folder slug already exists");
            throw err;
        }
    }

    async patch(id: string, input: PatchFolderInput): Promise<MediaFolder> {
        const existing = await this.folders.findById(id);
        if (!existing) throw ApiError.notFound("folder not found");
        const data: Parameters<IFolderRepository["update"]>[1] = {};
        if (input.name !== undefined) data.name = input.name.trim();
        if (input.slug !== undefined) {
            const slug = slugify(input.slug);
            if (!slug) throw ApiError.badRequest("invalid folder slug");
            data.slug = slug;
        } else if (input.name !== undefined) {
            data.slug = slugify(input.name);
        }
        if (input.parentId !== undefined) {
            if (input.parentId === id) throw ApiError.badRequest("folder cannot parent itself");
            if (input.parentId) {
                const parent = await this.folders.findById(input.parentId);
                if (!parent) throw ApiError.notFound("parent folder not found");
                if (parent.parentId) throw ApiError.badRequest("subfolder cannot have children");
                const childCount = await this.folders.countChildren(id);
                if (childCount > 0) throw ApiError.badRequest("folder has children");
            }
            data.parentId = input.parentId;
        }
        try {
            const row = await this.folders.update(id, data);
            if (!row) throw ApiError.notFound("folder not found");
            return row;
        } catch (err) {
            if (isUniqueViolation(err)) throw ApiError.conflict("folder slug already exists");
            throw err;
        }
    }

    async remove(id: string): Promise<void> {
        const existing = await this.folders.findById(id);
        if (!existing) throw ApiError.notFound("folder not found");
        const childCount = await this.folders.countChildren(id);
        if (childCount > 0) throw ApiError.conflict("folder has child folders");
        const fileCount = await this.media.countByFolder(id);
        if (fileCount > 0) throw ApiError.conflict("folder has files");
        await this.folders.remove(id);
    }
}
