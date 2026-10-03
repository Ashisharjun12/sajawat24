import { ApiError } from "@/shared/errors/apiError.js";
import { parsePagination } from "@/shared/http/pagination.js";
import { getCompletedUpload, toPublicMedia } from "@/modules/upload/index.js";
import type { CmsBannerRepository } from "@/modules/cms/banners/banner.repository.js";
import type { CmsBanner } from "@/modules/cms/banners/banner.schema.js";
import type { z } from "zod";
import type { createCmsBannerDto, patchCmsBannerDto } from "@/modules/cms/cms.dto.js";
import { invalidateHome } from "@/modules/cms/cache/cms-cache.invalidation.js";

type CreateInput = z.infer<typeof createCmsBannerDto>;
type PatchInput = z.infer<typeof patchCmsBannerDto>;

export class CmsBannerService {
    constructor(private readonly banners: CmsBannerRepository) {}

    async listAdmin(query: Record<string, unknown>) {
        const pagination = parsePagination(query);
        const { items, total } = await this.banners.list(pagination, {
            placement: query.placement as CmsBanner["placement"] | undefined,
            excludePlacement: query.excludePlacement as CmsBanner["placement"] | undefined,
            status: query.status as CmsBanner["status"] | undefined,
            platform: typeof query.platform === "string" ? query.platform : undefined,
        });
        return {
            items: await Promise.all(items.map((row) => this.toAdmin(row))),
            page: pagination.page,
            limit: pagination.limit,
            total,
        };
    }

    async getAdmin(id: string) {
        const row = await this.banners.findByIdWithCity(id);
        if (!row) throw ApiError.notFound("Banner not found");
        return this.toAdmin(row);
    }

    async create(input: CreateInput) {
        await this.validateImage(input.placement, input.imageUploadId ?? null);
        await this.validateMobileImage(input.mobileImageUploadId ?? null);
        const row = await this.banners.insert({
            placement: input.placement,
            cityId: input.cityId ?? null,
            platforms: input.platforms,
            status: input.status,
            sortIndex: input.sortIndex ?? 0,
            priority: input.priority ?? 0,
            startsAt: input.startsAt ?? null,
            endsAt: input.endsAt ?? null,
            title: input.title ?? null,
            subtitle: input.subtitle ?? null,
            tag: input.tag ?? null,
            imageUploadId: input.imageUploadId ?? null,
            mobileImageUploadId: input.mobileImageUploadId ?? null,
            alt: input.alt ?? null,
            ctaLabel: input.ctaLabel ?? null,
            href: input.href ?? null,
            secondaryLabel: input.secondaryLabel ?? null,
            secondaryHref: input.secondaryHref ?? null,
            message: input.message ?? null,
            tone: input.tone ?? null,
            accentColor: input.accentColor ?? null,
            dismissible: input.dismissible ?? true,
        });
        const created = await this.getAdmin(row.id);
        await invalidateHome();
        return created;
    }

    async patch(id: string, input: PatchInput) {
        const existing = await this.banners.findById(id);
        if (!existing) throw ApiError.notFound("Banner not found");
        const placement = input.placement ?? existing.placement;
        const imageId =
            input.imageUploadId !== undefined ? input.imageUploadId : existing.imageUploadId;
        await this.validateImage(placement, imageId);
        const mobileImageId =
            input.mobileImageUploadId !== undefined
                ? input.mobileImageUploadId
                : existing.mobileImageUploadId;
        await this.validateMobileImage(mobileImageId);
        const row = await this.banners.update(id, {
            placement: input.placement,
            cityId: input.cityId,
            platforms: input.platforms,
            status: input.status,
            sortIndex: input.sortIndex,
            priority: input.priority,
            startsAt: input.startsAt,
            endsAt: input.endsAt,
            title: input.title,
            subtitle: input.subtitle,
            tag: input.tag,
            imageUploadId: input.imageUploadId,
            mobileImageUploadId: input.mobileImageUploadId,
            alt: input.alt,
            ctaLabel: input.ctaLabel,
            href: input.href,
            secondaryLabel: input.secondaryLabel,
            secondaryHref: input.secondaryHref,
            message: input.message,
            tone: input.tone,
            accentColor: input.accentColor,
            dismissible: input.dismissible,
        });
        if (!row) throw ApiError.notFound("Banner not found");
        const updated = await this.getAdmin(row.id);
        await invalidateHome();
        return updated;
    }

    async delete(id: string) {
        const ok = await this.banners.delete(id);
        if (!ok) throw ApiError.notFound("Banner not found");
        await invalidateHome();
        return { id };
    }

    async reorder(placement: CmsBanner["placement"], ids: string[]) {
        try {
            await this.banners.reorder(placement, ids);
        } catch {
            throw ApiError.badRequest("Invalid banner reorder payload");
        }
        await invalidateHome();
        return { placement, ids };
    }

    async listPublishedForHome() {
        return this.banners.listPublished();
    }

    private async validateImage(placement: CmsBanner["placement"], imageUploadId: string | null) {
        if (placement === "announcement_bar") return;
        if (!imageUploadId) {
            throw ApiError.badRequest("image is required for visual banners");
        }
        const upload = await getCompletedUpload(imageUploadId);
        if (upload.kind !== "image") {
            throw ApiError.badRequest("banner image must be an image");
        }
    }

    private async validateMobileImage(mobileImageUploadId: string | null) {
        if (!mobileImageUploadId) return;
        const upload = await getCompletedUpload(mobileImageUploadId);
        if (upload.kind !== "image") {
            throw ApiError.badRequest("mobile banner image must be an image");
        }
    }

    private async toAdmin(row: CmsBanner & { cityName?: string | null }) {
        const image = row.imageUploadId ? await this.mediaUrl(row.imageUploadId) : null;
        const mobileImage = row.mobileImageUploadId
            ? await this.mediaUrl(row.mobileImageUploadId)
            : null;
        return {
            ...row,
            cityName: row.cityName ?? null,
            imageUrl: image?.url ?? null,
            image: image,
            mobileImageUrl: mobileImage?.url ?? null,
            mobileImage,
        };
    }

    private async mediaUrl(uploadId: string) {
        const upload = await getCompletedUpload(uploadId);
        const media = toPublicMedia(upload);
        return { ...media, url: media.optimizedUrl ?? media.publicUrl };
    }
}
