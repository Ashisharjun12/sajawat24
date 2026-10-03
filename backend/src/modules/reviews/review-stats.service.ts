import { eq } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import { products } from "@/modules/catalog/products/product.schema.js";
import type { CustomerReviewRepository } from "@/modules/reviews/customer-reviews/customer-review.repository.js";

export class ReviewStatsService {
    constructor(private readonly customerReviews: CustomerReviewRepository) {}

    async recalcProduct(productId: string): Promise<void> {
        const reviewCount = await this.customerReviews.countPublishedByProduct(productId);
        const ratingAvg = await this.customerReviews.avgRatingPublished(productId);
        await db
            .update(products)
            .set({
                reviewCount,
                ratingAvg: ratingAvg == null ? null : String(ratingAvg),
                updatedAt: new Date(),
            })
            .where(eq(products.id, productId));
    }
}
