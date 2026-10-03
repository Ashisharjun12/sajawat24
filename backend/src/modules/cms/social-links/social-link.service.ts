import { ApiError } from "@/shared/errors/apiError.js";
import { parsePagination } from "@/shared/http/pagination.js";
import { getCompletedUpload, toPublicMedia } from "@/modules/upload/index.js";
import type { CmsSocialLinkRepository } from "@/modules/cms/social-links/social-link.repository.js";
import type { z } from "zod";
import type { createCmsSocialLinkDto, patchCmsSocialLinkDto } from "@/modules/cms/social-links/social-link.dto.js";
import { invalidateSiteShell } from "@/modules/cms/cache/cms-cache.invalidation.js";

type CreateInput = z.infer<typeof createCmsSocialLinkDto>;
type PatchInput = z.infer<typeof patchCmsSocialLinkDto>;

export class CmsSocialLinkService {
    constructor(private readonly links: CmsSocialLinkRepository) {}

    async listAdmin(query: Record<string, unknown>) {
        const pagination = parsePagination(query);
        const { items, total } = await this.links.list(pagination, {
            status: query.status as CreateInput["status"] | undefined,
        });
        return {
            items: await Promise.all(items.map((row) => this.toAdmin(row))),
            page: pagination.page,
            limit: pagination.limit,
            total,
        };
    }

    async listAdminAll() {
        const items = await this.links.listAllForAdmin();
        return { items: await Promise.all(items.map((row) => this.toAdmin(row))) };
    }

    async getAdmin(id: string) {
        const row = await this.links.findById(id);
        if (!row) throw ApiError.notFound("Social link not found");
        return this.toAdmin(row);
    }

    async create(input: CreateInput) {
        this.assertPublishable(input.status, input.label, input.href);
        if (input.iconUploadId) await this.validateIcon(input.iconUploadId);
        const sortIndex = input.sortIndex ?? await this.links.nextSortIndex();
        const row = await this.links.insert({
            label: input.label.trim(),
            href: input.href.trim(),
            iconPreset: input.iconPreset ?? null,
            iconUploadId: input.iconUploadId ?? null,
            platforms: input.platforms,
            status: input.status,
            sortIndex,
        });
        const created = await this.toAdmin(row);
        await invalidateSiteShell();
        return created;
    }

    async patch(id: string, input: PatchInput) {
        const existing = await this.links.findById(id);
        if (!existing) throw ApiError.notFound("Social link not found");
        const status = input.status ?? existing.status;
        const label = (input.label ?? existing.label).trim();
        const href = (input.href ?? existing.href).trim();
        this.assertPublishable(status, label, href);
        if (input.iconUploadId) await this.validateIcon(input.iconUploadId);
        const row = await this.links.update(id, {
            label: input.label !== undefined ? input.label.trim() : undefined,
            href: input.href !== undefined ? input.href.trim() : undefined,
            iconPreset: input.iconPreset,
            iconUploadId: input.iconUploadId,
            platforms: input.platforms,
            status: input.status,
            sortIndex: input.sortIndex,
        });
        if (!row) throw ApiError.notFound("Social link not found");
        const updated = await this.toAdmin(row);
        await invalidateSiteShell();
        return updated;
    }

    async delete(id: string) {
        const ok = await this.links.delete(id);
        if (!ok) throw ApiError.notFound("Social link not found");
        await invalidateSiteShell();
        return { id };
    }

    async reorder(ids: string[]) {
        try {
            await this.links.reorder(ids);
        } catch {
            throw ApiError.badRequest("Invalid social link reorder payload");
        }
        await invalidateSiteShell();
        return { ok: true };
    }

    async listPublished() {
        return this.links.listPublished();
    }

    private async toAdmin(row: { iconUploadId: string | null } & Record<string, unknown>) {
        const iconUrl = row.iconUploadId ? await this.mediaUrl(row.iconUploadId) : null;
        return { ...row, iconUrl };
    }

    async mediaUrl(uploadId: string) {
        const upload = await getCompletedUpload(uploadId);
        const media = toPublicMedia(upload);
        return media.optimizedUrl ?? media.publicUrl;
    }

    private async validateIcon(uploadId: string) {
        const upload = await getCompletedUpload(uploadId);
        if (upload.kind !== "image") {
            throw ApiError.badRequest("social icon must be an image");
        }
    }

    private assertPublishable(status: CreateInput["status"], label: string, href: string) {
        if (status !== "published") return;
        if (!label.trim() || !href.trim()) {
            throw ApiError.badRequest("label and href are required to publish");
        }
    }
}
