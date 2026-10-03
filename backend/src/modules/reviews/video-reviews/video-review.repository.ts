import { and, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import { products } from "@/modules/catalog/products/product.schema.js";
import { videoReviews, type NewVideoReview, type VideoReview } from "@/modules/reviews/video-reviews/video-review.schema.js";
import { paginationOffset, type PaginationQuery } from "@/shared/http/pagination.js";

export type VideoReviewPatch = Partial<
    Pick<VideoReview, "uploadId" | "caption" | "status" | "sortIndex">
>;

export type VideoReviewRow = VideoReview & {
    productName: string | null;
    productSlug: string | null;
};

export type VideoReviewListFilter = {
    q?: string;
    status?: VideoReview["status"];
};

export interface IVideoReviewRepository {
    findById(id: string): Promise<VideoReview | undefined>;
    list(
        pagination: PaginationQuery,
        filter?: VideoReviewListFilter,
    ): Promise<{ items: VideoReviewRow[]; total: number }>;
    insert(data: NewVideoReview): Promise<VideoReview>;
    update(id: string, data: VideoReviewPatch): Promise<VideoReview | undefined>;
    delete(id: string): Promise<boolean>;
}

function listWhere(filter: VideoReviewListFilter = {}): SQL | undefined {
    const parts: SQL[] = [];
    if (filter.status) parts.push(eq(videoReviews.status, filter.status));
    const q = filter.q?.trim().replace(/[%_\\]/g, "");
    if (q) {
        const pattern = `%${q}%`;
        parts.push(or(ilike(videoReviews.caption, pattern), ilike(products.name, pattern))!);
    }
    if (!parts.length) return undefined;
    return and(...parts);
}

export class VideoReviewRepository implements IVideoReviewRepository {
    async findById(id: string): Promise<VideoReview | undefined> {
        const [row] = await db.select().from(videoReviews).where(eq(videoReviews.id, id)).limit(1);
        return row;
    }

    async list(pagination: PaginationQuery, filter: VideoReviewListFilter = {}) {
        const where = listWhere(filter);
        const base = db
            .select({
                review: videoReviews,
                productName: products.name,
                productSlug: products.slug,
            })
            .from(videoReviews)
            .leftJoin(products, eq(videoReviews.productId, products.id));

        const rows = await (where ? base.where(where) : base)
            .orderBy(desc(videoReviews.sortIndex), desc(videoReviews.createdAt))
            .limit(pagination.limit)
            .offset(paginationOffset(pagination));

        const countQuery = db
            .select({ total: count() })
            .from(videoReviews)
            .leftJoin(products, eq(videoReviews.productId, products.id));
        const [{ total }] = await (where ? countQuery.where(where) : countQuery);

        return {
            items: rows.map((row) => ({
                ...row.review,
                productName: row.productName,
                productSlug: row.productSlug,
            })),
            total: Number(total ?? 0),
        };
    }

    async insert(data: NewVideoReview): Promise<VideoReview> {
        const [row] = await db.insert(videoReviews).values(data).returning();
        return row;
    }

    async update(id: string, data: VideoReviewPatch): Promise<VideoReview | undefined> {
        const [row] = await db
            .update(videoReviews)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(videoReviews.id, id))
            .returning();
        return row;
    }

    async delete(id: string): Promise<boolean> {
        const rows = await db.delete(videoReviews).where(eq(videoReviews.id, id)).returning();
        return rows.length > 0;
    }
}
