import { ApiError } from "@/shared/errors/apiError.js";
import { parsePagination } from "@/shared/http/pagination.js";
import { getCompletedUpload, toPublicMedia, type PublicMedia } from "@/modules/upload/index.js";
import type { IProductRepository } from "@/modules/catalog/products/product.repository.js";
import type {
    CustomerReviewRepository,
    CustomerReviewWithProduct,
} from "@/modules/reviews/customer-reviews/customer-review.repository.js";
import type { CustomerReview } from "@/modules/reviews/customer-reviews/customer-review.schema.js";
import type { ReviewStatsService } from "@/modules/reviews/review-stats.service.js";

export type CustomerReviewPublic = {
    id: string;
    rating: number;
    body: string;
    reviewerName: string;
    reviewerCity: string | null;
    isVerified: boolean;
    reviewedAt: Date;
    avatar: (PublicMedia & { url: string }) | null;
    photos: (PublicMedia & { url: string })[];
};

export type CustomerReviewAdmin = CustomerReviewWithProduct & {
    avatar: (PublicMedia & { url: string }) | null;
    photos: (PublicMedia & { url: string })[];
};

export type CreateCustomerReviewInput = {
    productId: string;
    rating: number;
    body: string;
    reviewerName: string;
    reviewerCity?: string | null;
    reviewerAvatarUploadId?: string | null;
    photoUploadIds?: string[];
    isVerified?: boolean;
    status?: CustomerReview["status"];
    reviewedAt?: Date;
    sortIndex?: number;
};

export type PatchCustomerReviewInput = Partial<CreateCustomerReviewInput>;

export type SubmitOrderReviewInput = {
    rating: number;
    body: string;
    productId?: string;
};

export type CustomerReviewSummary = {
    id: string;
    rating: number;
    body: string;
    reviewedAt: Date;
};

export class CustomerReviewService {
    constructor(
        private readonly reviews: CustomerReviewRepository,
        private readonly products: IProductRepository,
        private readonly stats: ReviewStatsService,
    ) {}

    async listAdmin(query: Record<string, unknown>) {
        const pagination = parsePagination(query);
        const { items, total } = await this.reviews.list(pagination, {
            q: typeof query.q === "string" ? query.q : undefined,
            productId: typeof query.productId === "string" ? query.productId : undefined,
            status: query.status as CustomerReview["status"] | undefined,
            rating: query.rating != null ? Number(query.rating) : undefined,
        });
        return {
            items: await Promise.all(items.map((row) => this.toAdmin(row))),
            page: pagination.page,
            limit: pagination.limit,
            total,
        };
    }

    async listByProductAdmin(productId: string, query: Record<string, unknown>) {
        const pagination = parsePagination(query);
        const { items, total } = await this.reviews.list(pagination, { productId });
        return {
            items: await Promise.all(items.map((row) => this.toAdmin(row))),
            page: pagination.page,
            limit: pagination.limit,
            total,
        };
    }

    async listPublic(productId: string, query: Record<string, unknown>) {
        const product = await this.products.findById(productId);
        if (!product || !product.isActive) {
            throw new ApiError(404, "Product not found");
        }
        await this.publishCustomerDraftsIfAny(productId);

        const pagination = parsePagination(query);
        let reviewCount = await this.reviews.countPublishedByProduct(productId);
        if ((product.reviewCount ?? 0) !== reviewCount) {
            await this.stats.recalcProduct(productId);
        }

        const { items, total } = await this.reviews.listPublishedByProduct(productId, pagination);
        reviewCount = await this.reviews.countPublishedByProduct(productId);

        const distribution = await this.reviews.ratingDistribution(productId);
        const ratingAvg =
            reviewCount > 0 ? await this.reviews.avgRatingPublished(productId) : null;

        return {
            summary: {
                ratingAvg,
                reviewCount,
                distribution,
            },
            items: await Promise.all(items.map((row) => this.toPublic(row))),
            page: pagination.page,
            limit: pagination.limit,
            total,
        };
    }

    private async publishCustomerDraftsIfAny(productId: string): Promise<void> {
        const drafts = await this.reviews.listCustomerDraftsForProduct(productId);
        if (!drafts.length) return;
        for (const row of drafts) {
            await this.reviews.update(row.id, { status: "published" });
        }
        await this.stats.recalcProduct(productId);
    }

    async getAdmin(id: string) {
        const row = await this.reviews.findById(id);
        if (!row) throw new ApiError(404, "Review not found");
        const [product] = await Promise.all([this.products.findById(row.productId)]);
        return this.toAdmin({
            ...row,
            productName: product?.name ?? "",
            productSlug: product?.slug ?? "",
        });
    }

    async create(input: CreateCustomerReviewInput, adminId?: string) {
        const product = await this.products.findById(input.productId);
        if (!product) throw new ApiError(404, "Product not found");
        await this.validateMedia(input.reviewerAvatarUploadId, input.photoUploadIds ?? []);
        const row = await this.reviews.insert({
            productId: input.productId,
            rating: input.rating,
            body: input.body.trim(),
            reviewerName: input.reviewerName.trim(),
            reviewerCity: input.reviewerCity?.trim() || null,
            reviewerAvatarUploadId: input.reviewerAvatarUploadId ?? null,
            photoUploadIds: input.photoUploadIds ?? [],
            isVerified: input.isVerified ?? false,
            status: input.status ?? "draft",
            reviewedAt: input.reviewedAt ?? new Date(),
            sortIndex: input.sortIndex ?? 0,
            source: "admin",
            createdByAdminId: adminId ?? null,
        });
        await this.stats.recalcProduct(input.productId);
        return this.getAdmin(row.id);
    }

    async patch(id: string, input: PatchCustomerReviewInput) {
        const existing = await this.reviews.findById(id);
        if (!existing) throw new ApiError(404, "Review not found");
        if (input.productId) {
            const product = await this.products.findById(input.productId);
            if (!product) throw new ApiError(404, "Product not found");
        }
        const avatarId =
            input.reviewerAvatarUploadId !== undefined
                ? input.reviewerAvatarUploadId
                : existing.reviewerAvatarUploadId;
        const photoIds =
            input.photoUploadIds !== undefined ? input.photoUploadIds : existing.photoUploadIds ?? [];
        await this.validateMedia(avatarId, photoIds);
        const row = await this.reviews.update(id, {
            productId: input.productId,
            rating: input.rating,
            body: input.body?.trim(),
            reviewerName: input.reviewerName?.trim(),
            reviewerCity: input.reviewerCity === undefined ? undefined : input.reviewerCity?.trim() || null,
            reviewerAvatarUploadId: input.reviewerAvatarUploadId,
            photoUploadIds: input.photoUploadIds,
            isVerified: input.isVerified,
            status: input.status,
            reviewedAt: input.reviewedAt,
            sortIndex: input.sortIndex,
        });
        if (!row) throw new ApiError(404, "Review not found");
        const productIds = new Set([existing.productId, row.productId]);
        for (const productId of productIds) {
            await this.stats.recalcProduct(productId);
        }
        return this.getAdmin(row.id);
    }

    async delete(id: string) {
        const existing = await this.reviews.findById(id);
        if (!existing) throw new ApiError(404, "Review not found");
        await this.reviews.delete(id);
        await this.stats.recalcProduct(existing.productId);
        return { id };
    }

    async findByOrderId(orderId: string): Promise<CustomerReviewSummary | null> {
        const row = await this.reviews.findByOrderId(orderId);
        if (!row) return null;
        return {
            id: row.id,
            rating: row.rating,
            body: row.body,
            reviewedAt: row.reviewedAt,
        };
    }

    async findByOrderIds(orderIds: string[]): Promise<Map<string, CustomerReviewSummary>> {
        const rows = await this.reviews.findByOrderIds(orderIds);
        const map = new Map<string, CustomerReviewSummary>();
        for (const row of rows) {
            if (!row.orderId) continue;
            map.set(row.orderId, {
                id: row.id,
                rating: row.rating,
                body: row.body,
                reviewedAt: row.reviewedAt,
            });
        }
        return map;
    }

    async createFromCustomerOrder(
        userId: string,
        orderId: string,
        input: SubmitOrderReviewInput & {
            productId: string;
            reviewerName: string;
            reviewerCity: string | null;
        },
    ): Promise<CustomerReviewSummary> {
        const existing = await this.reviews.findByOrderId(orderId);
        if (existing) {
            throw new ApiError(409, "You have already reviewed this booking");
        }

        const product = await this.products.findById(input.productId);
        if (!product) throw new ApiError(404, "Product not found");

        const row = await this.reviews.insert({
            productId: input.productId,
            rating: input.rating,
            body: input.body.trim(),
            reviewerName: input.reviewerName.trim(),
            reviewerCity: input.reviewerCity?.trim() || null,
            reviewerAvatarUploadId: null,
            photoUploadIds: [],
            isVerified: true,
            status: "published",
            reviewedAt: new Date(),
            sortIndex: 0,
            source: "customer",
            orderId,
            userId,
            createdByAdminId: null,
        });
        await this.stats.recalcProduct(input.productId);
        return {
            id: row.id,
            rating: row.rating,
            body: row.body,
            reviewedAt: row.reviewedAt,
        };
    }

    private async validateMedia(avatarId: string | null | undefined, photoIds: string[]) {
        if (avatarId) {
            const upload = await getCompletedUpload(avatarId);
            if (upload.kind !== "image") {
                throw new ApiError(400, "Avatar must be an image");
            }
        }
        for (const id of photoIds) {
            const upload = await getCompletedUpload(id);
            if (upload.kind !== "image") {
                throw new ApiError(400, "Review photos must be images");
            }
        }
    }

    private async toPublic(row: CustomerReview): Promise<CustomerReviewPublic> {
        const avatar = row.reviewerAvatarUploadId
            ? await this.mediaFor(row.reviewerAvatarUploadId)
            : null;
        const photos = await Promise.all((row.photoUploadIds ?? []).map((id) => this.mediaFor(id)));
        return {
            id: row.id,
            rating: row.rating,
            body: row.body,
            reviewerName: row.reviewerName,
            reviewerCity: row.reviewerCity,
            isVerified: row.isVerified,
            reviewedAt: row.reviewedAt,
            avatar,
            photos: photos.filter(Boolean) as (PublicMedia & { url: string })[],
        };
    }

    private async toAdmin(row: CustomerReviewWithProduct): Promise<CustomerReviewAdmin> {
        const avatar = row.reviewerAvatarUploadId
            ? await this.mediaFor(row.reviewerAvatarUploadId)
            : null;
        const photos = await Promise.all((row.photoUploadIds ?? []).map((id) => this.mediaFor(id)));
        return {
            ...row,
            avatar,
            photos: photos.filter(Boolean) as (PublicMedia & { url: string })[],
        };
    }

    private async mediaFor(uploadId: string) {
        try {
            const upload = await getCompletedUpload(uploadId);
            const media = toPublicMedia(upload);
            return { ...media, url: media.optimizedUrl ?? media.publicUrl };
        } catch {
            return null;
        }
    }
}
