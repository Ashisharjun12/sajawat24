import { ApiError } from "@/shared/errors/apiError.js";
import { parsePagination } from "@/shared/http/pagination.js";
import { getCompletedUpload, toPublicMedia } from "@/modules/upload/index.js";
import type { CmsTestimonialRepository } from "@/modules/cms/testimonials/testimonial.repository.js";
import type { z } from "zod";
import type { createCmsTestimonialDto, patchCmsTestimonialDto } from "@/modules/cms/cms.dto.js";
import { invalidateHome } from "@/modules/cms/cache/cms-cache.invalidation.js";

type CreateInput = z.infer<typeof createCmsTestimonialDto>;
type PatchInput = z.infer<typeof patchCmsTestimonialDto>;

export class CmsTestimonialService {
    constructor(private readonly testimonials: CmsTestimonialRepository) {}

    async listAdmin(query: Record<string, unknown>) {
        const pagination = parsePagination(query);
        const { items, total } = await this.testimonials.list(pagination, {
            status: query.status as CreateInput["status"] | undefined,
        });
        return {
            items: await Promise.all(items.map((row) => this.toAdmin(row))),
            page: pagination.page,
            limit: pagination.limit,
            total,
        };
    }

    async getAdmin(id: string) {
        const row = await this.testimonials.findByIdWithCity(id);
        if (!row) throw ApiError.notFound("Testimonial not found");
        return this.toAdmin(row);
    }

    async create(input: CreateInput) {
        if (input.avatarUploadId) await this.validateAvatar(input.avatarUploadId);
        const row = await this.testimonials.insert({
            quote: input.quote,
            reviewerName: input.reviewerName,
            reviewerCity: input.reviewerCity ?? null,
            rating: input.rating,
            accentColor: input.accentColor ?? null,
            avatarUploadId: input.avatarUploadId ?? null,
            cityId: input.cityId ?? null,
            platforms: input.platforms,
            status: input.status,
            sortIndex: input.sortIndex ?? 0,
        });
        const created = await this.getAdmin(row.id);
        await invalidateHome();
        return created;
    }

    async patch(id: string, input: PatchInput) {
        const existing = await this.testimonials.findById(id);
        if (!existing) throw ApiError.notFound("Testimonial not found");
        if (input.avatarUploadId) await this.validateAvatar(input.avatarUploadId);
        const row = await this.testimonials.update(id, {
            quote: input.quote,
            reviewerName: input.reviewerName,
            reviewerCity: input.reviewerCity,
            rating: input.rating,
            accentColor: input.accentColor,
            avatarUploadId: input.avatarUploadId,
            cityId: input.cityId,
            platforms: input.platforms,
            status: input.status,
            sortIndex: input.sortIndex,
        });
        if (!row) throw ApiError.notFound("Testimonial not found");
        const updated = await this.getAdmin(row.id);
        await invalidateHome();
        return updated;
    }

    async delete(id: string) {
        const ok = await this.testimonials.delete(id);
        if (!ok) throw ApiError.notFound("Testimonial not found");
        await invalidateHome();
        return { id };
    }

    async listPublishedForHome() {
        return this.testimonials.listPublished();
    }

    private async validateAvatar(uploadId: string) {
        const upload = await getCompletedUpload(uploadId);
        if (upload.kind !== "image") {
            throw ApiError.badRequest("avatar must be an image");
        }
    }

    private async toAdmin(row: { avatarUploadId: string | null; cityName?: string | null } & Record<string, unknown>) {
        const avatar = row.avatarUploadId ? await this.mediaUrl(row.avatarUploadId) : null;
        return {
            ...row,
            cityName: row.cityName ?? null,
            avatarUrl: avatar?.url ?? null,
            avatar,
        };
    }

    private async mediaUrl(uploadId: string) {
        const upload = await getCompletedUpload(uploadId);
        const media = toPublicMedia(upload);
        return { ...media, url: media.optimizedUrl ?? media.publicUrl };
    }
}
