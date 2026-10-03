import { and, count, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import { products } from "@/modules/catalog/products/product.schema.js";
import {
    customerReviews,
    type CustomerReview,
    type NewCustomerReview,
} from "@/modules/reviews/customer-reviews/customer-review.schema.js";
import { paginationOffset, type PaginationQuery } from "@/shared/http/pagination.js";

export type CustomerReviewPatch = Partial<
    Pick<
        CustomerReview,
        | "productId"
        | "rating"
        | "body"
        | "reviewerName"
        | "reviewerCity"
        | "reviewerAvatarUploadId"
        | "photoUploadIds"
        | "isVerified"
        | "status"
        | "reviewedAt"
        | "sortIndex"
    >
>;

export type CustomerReviewWithProduct = CustomerReview & {
    productName: string;
    productSlug: string;
};

export type CustomerReviewListFilter = {
    q?: string;
    productId?: string;
    status?: CustomerReview["status"];
    rating?: number;
};

export interface ICustomerReviewRepository {
    findById(id: string): Promise<CustomerReview | undefined>;
    findByOrderId(orderId: string): Promise<CustomerReview | undefined>;
    findByOrderIds(orderIds: string[]): Promise<CustomerReview[]>;
    list(
        pagination: PaginationQuery,
        filter?: CustomerReviewListFilter,
    ): Promise<{ items: CustomerReviewWithProduct[]; total: number }>;
    listPublishedByProduct(
        productId: string,
        pagination: PaginationQuery,
    ): Promise<{ items: CustomerReview[]; total: number }>;
    countPublishedByProduct(productId: string): Promise<number>;
    listCustomerDraftsForProduct(productId: string): Promise<CustomerReview[]>;
    ratingDistribution(productId: string): Promise<Record<number, number>>;
    insert(data: NewCustomerReview): Promise<CustomerReview>;
    update(id: string, data: CustomerReviewPatch): Promise<CustomerReview | undefined>;
    delete(id: string): Promise<boolean>;
}

function listWhere(filter: CustomerReviewListFilter = {}): SQL | undefined {
    const parts: SQL[] = [];
    if (filter.productId) parts.push(eq(customerReviews.productId, filter.productId));
    if (filter.status) parts.push(eq(customerReviews.status, filter.status));
    if (filter.rating) parts.push(eq(customerReviews.rating, filter.rating));
    const q = filter.q?.trim().replace(/[%_\\]/g, "");
    if (q) {
        const pattern = `%${q}%`;
        parts.push(
            or(
                ilike(customerReviews.reviewerName, pattern),
                ilike(customerReviews.body, pattern),
                ilike(customerReviews.reviewerCity, pattern),
                ilike(products.name, pattern),
            )!,
        );
    }
    if (!parts.length) return undefined;
    return and(...parts);
}

export class CustomerReviewRepository implements ICustomerReviewRepository {
    async findById(id: string): Promise<CustomerReview | undefined> {
        const [row] = await db.select().from(customerReviews).where(eq(customerReviews.id, id)).limit(1);
        return row;
    }

    async findByOrderId(orderId: string): Promise<CustomerReview | undefined> {
        const [row] = await db
            .select()
            .from(customerReviews)
            .where(eq(customerReviews.orderId, orderId))
            .limit(1);
        return row;
    }

    async findByOrderIds(orderIds: string[]): Promise<CustomerReview[]> {
        if (orderIds.length === 0) return [];
        return db
            .select()
            .from(customerReviews)
            .where(inArray(customerReviews.orderId, orderIds));
    }

    async list(pagination: PaginationQuery, filter: CustomerReviewListFilter = {}) {
        const where = listWhere(filter);
        const base = db
            .select({
                review: customerReviews,
                productName: products.name,
                productSlug: products.slug,
            })
            .from(customerReviews)
            .innerJoin(products, eq(customerReviews.productId, products.id));

        const rows = await (where ? base.where(where) : base)
            .orderBy(desc(customerReviews.reviewedAt), desc(customerReviews.createdAt))
            .limit(pagination.limit)
            .offset(paginationOffset(pagination));

        const countQuery = db
            .select({ total: count() })
            .from(customerReviews)
            .innerJoin(products, eq(customerReviews.productId, products.id));
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

    async listPublishedByProduct(productId: string, pagination: PaginationQuery) {
        const where = and(
            eq(customerReviews.productId, productId),
            eq(customerReviews.status, "published"),
        );
        const items = await db
            .select()
            .from(customerReviews)
            .where(where)
            .orderBy(desc(customerReviews.sortIndex), desc(customerReviews.reviewedAt))
            .limit(pagination.limit)
            .offset(paginationOffset(pagination));
        const [{ total }] = await db.select({ total: count() }).from(customerReviews).where(where);
        return { items, total: Number(total ?? 0) };
    }

    async countPublishedByProduct(productId: string): Promise<number> {
        const [{ total }] = await db
            .select({ total: count() })
            .from(customerReviews)
            .where(
                and(eq(customerReviews.productId, productId), eq(customerReviews.status, "published")),
            );
        return Number(total ?? 0);
    }

    async listCustomerDraftsForProduct(productId: string): Promise<CustomerReview[]> {
        return db
            .select()
            .from(customerReviews)
            .where(
                and(
                    eq(customerReviews.productId, productId),
                    eq(customerReviews.source, "customer"),
                    eq(customerReviews.status, "draft"),
                ),
            );
    }

    async ratingDistribution(productId: string): Promise<Record<number, number>> {
        const rows = await db
            .select({
                rating: customerReviews.rating,
                count: count(),
            })
            .from(customerReviews)
            .where(
                and(eq(customerReviews.productId, productId), eq(customerReviews.status, "published")),
            )
            .groupBy(customerReviews.rating);
        const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
        for (const row of rows) {
            dist[row.rating] = Number(row.count ?? 0);
        }
        return dist;
    }

    async insert(data: NewCustomerReview): Promise<CustomerReview> {
        const [row] = await db.insert(customerReviews).values(data).returning();
        return row;
    }

    async update(id: string, data: CustomerReviewPatch): Promise<CustomerReview | undefined> {
        const [row] = await db
            .update(customerReviews)
            .set({ ...data, updatedAt: new Date() })
            .where(eq(customerReviews.id, id))
            .returning();
        return row;
    }

    async delete(id: string): Promise<boolean> {
        const rows = await db.delete(customerReviews).where(eq(customerReviews.id, id)).returning();
        return rows.length > 0;
    }

    async avgRatingPublished(productId: string): Promise<number | null> {
        const [row] = await db
            .select({ avg: sql<number>`round(avg(${customerReviews.rating})::numeric, 2)` })
            .from(customerReviews)
            .where(
                and(eq(customerReviews.productId, productId), eq(customerReviews.status, "published")),
            );
        const avg = row?.avg;
        return avg == null ? null : Number(avg);
    }
}
