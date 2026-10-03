import { z } from "zod";

const reviewStatusSchema = z.enum(["draft", "published", "hidden"]);

export const reviewIdParamsDto = z.object({
    id: z.string().uuid(),
});

export const productReviewParamsDto = z.object({
    productId: z.string().uuid(),
});

export const listCustomerReviewsQueryDto = z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    q: z.string().trim().optional(),
    productId: z.string().uuid().optional(),
    status: reviewStatusSchema.optional(),
    rating: z.coerce.number().int().min(1).max(5).optional(),
});

export const listPublicProductReviewsQueryDto = z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(50).optional(),
});

const customerReviewBaseSchema = z.object({
    productId: z.string().uuid(),
    rating: z.number().int().min(1).max(5),
    body: z.string().trim().min(10).max(2000),
    reviewerName: z.string().trim().min(1).max(120),
    reviewerCity: z.string().trim().max(120).optional().nullable(),
    reviewerAvatarUploadId: z.string().uuid().optional().nullable(),
    photoUploadIds: z.array(z.string().uuid()).max(6).optional(),
    isVerified: z.boolean().default(false),
    status: reviewStatusSchema.default("draft"),
    reviewedAt: z.coerce.date().optional(),
    sortIndex: z.number().int().nonnegative().optional(),
});

export const createCustomerReviewDto = customerReviewBaseSchema;

export const patchCustomerReviewDto = customerReviewBaseSchema
    .omit({ productId: true })
    .partial()
    .extend({
        productId: z.string().uuid().optional(),
    });

export const listVideoReviewsQueryDto = z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(100).optional(),
    q: z.string().trim().optional(),
    status: reviewStatusSchema.optional(),
});

const videoReviewBaseSchema = z.object({
    uploadId: z.string().uuid(),
    caption: z.string().trim().min(1).max(500),
    status: reviewStatusSchema.default("draft"),
    sortIndex: z.number().int().nonnegative().optional(),
});

export const createVideoReviewDto = videoReviewBaseSchema;

export const patchVideoReviewDto = videoReviewBaseSchema.partial();

export const submitOrderReviewDto = z.object({
    rating: z.number().int().min(1).max(5),
    body: z.string().trim().min(10).max(2000),
    productId: z.string().uuid().optional(),
});
