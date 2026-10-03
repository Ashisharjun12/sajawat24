import { ApiError } from "@/shared/errors/apiError.js";
import { parsePagination } from "@/shared/http/pagination.js";
import { getCompletedUpload, toPublicMedia, type PublicMedia } from "@/modules/upload/index.js";
import type {
    VideoReviewRepository,
    VideoReviewRow,
} from "@/modules/reviews/video-reviews/video-review.repository.js";
import type { VideoReview } from "@/modules/reviews/video-reviews/video-review.schema.js";

export type VideoReviewAdmin = VideoReviewRow & {
    video: (PublicMedia & { url: string }) | null;
};

export type CreateVideoReviewInput = {
    uploadId: string;
    caption: string;
    status?: VideoReview["status"];
    sortIndex?: number;
};

export type PatchVideoReviewInput = Partial<CreateVideoReviewInput>;

export class VideoReviewService {
    constructor(private readonly reviews: VideoReviewRepository) {}

    async listAdmin(query: Record<string, unknown>) {
        const pagination = parsePagination(query);
        const { items, total } = await this.reviews.list(pagination, {
            q: typeof query.q === "string" ? query.q : undefined,
            status: query.status as VideoReview["status"] | undefined,
        });
        return {
            items: await Promise.all(items.map((row) => this.toAdmin(row))),
            page: pagination.page,
            limit: pagination.limit,
            total,
        };
    }

    async getAdmin(id: string) {
        const row = await this.reviews.findById(id);
        if (!row) throw new ApiError(404, "Video review not found");
        return this.toAdmin({
            ...row,
            productName: null,
            productSlug: null,
        });
    }

    async create(input: CreateVideoReviewInput, adminId?: string) {
        await this.validateVideo(input.uploadId);
        const row = await this.reviews.insert({
            productId: null,
            uploadId: input.uploadId,
            caption: input.caption.trim(),
            status: input.status ?? "draft",
            sortIndex: input.sortIndex ?? 0,
            createdByAdminId: adminId ?? null,
        });
        return this.getAdmin(row.id);
    }

    async patch(id: string, input: PatchVideoReviewInput) {
        const existing = await this.reviews.findById(id);
        if (!existing) throw new ApiError(404, "Video review not found");
        if (input.uploadId) await this.validateVideo(input.uploadId);
        const row = await this.reviews.update(id, {
            uploadId: input.uploadId,
            caption: input.caption?.trim(),
            status: input.status,
            sortIndex: input.sortIndex,
        });
        if (!row) throw new ApiError(404, "Video review not found");
        return this.getAdmin(row.id);
    }

    async delete(id: string) {
        const existing = await this.reviews.findById(id);
        if (!existing) throw new ApiError(404, "Video review not found");
        await this.reviews.delete(id);
        return { id };
    }

    private async validateVideo(uploadId: string) {
        const upload = await getCompletedUpload(uploadId);
        if (upload.kind !== "video") {
            throw new ApiError(400, "Video review must use a video upload");
        }
    }

    private async toAdmin(row: VideoReviewRow): Promise<VideoReviewAdmin> {
        const upload = await getCompletedUpload(row.uploadId);
        const media = toPublicMedia(upload);
        return {
            ...row,
            video: { ...media, url: media.publicUrl },
        };
    }
}
