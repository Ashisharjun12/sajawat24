import { z } from "zod";
import { cmsHomePlatformSchema, cmsPlatformsSchema } from "@/modules/cms/cms-platforms.js";

const cmsStatusSchema = z.enum(["draft", "published", "hidden"]);
const cmsPlacementSchema = z.enum(["announcement_bar", "home_hero", "home_mid", "home_end"]);
const cmsToneSchema = z.enum(["info", "promo", "warning"]);

export const cmsIdParamsDto = z.object({
    id: z.string().uuid(),
});

export const listCmsBannersQueryDto = z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(200).optional(),
    placement: cmsPlacementSchema.optional(),
    excludePlacement: cmsPlacementSchema.optional(),
    status: cmsStatusSchema.optional(),
    platform: cmsHomePlatformSchema.optional(),
});

export const listCmsTestimonialsQueryDto = z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(200).optional(),
    status: cmsStatusSchema.optional(),
});

export const homeCmsQueryDto = z.object({
    cityId: z.string().uuid().optional(),
    pincode: z.string().trim().min(1).max(12).optional(),
    platform: cmsHomePlatformSchema,
});

const bannerBaseSchema = z.object({
    placement: cmsPlacementSchema,
    cityId: z.string().uuid().nullable().optional(),
    platforms: cmsPlatformsSchema,
    status: cmsStatusSchema.default("draft"),
    sortIndex: z.number().int().nonnegative().optional(),
    priority: z.number().int().nonnegative().optional(),
    startsAt: z.coerce.date().nullable().optional(),
    endsAt: z.coerce.date().nullable().optional(),
    title: z.string().trim().max(200).nullable().optional(),
    subtitle: z.string().trim().max(500).nullable().optional(),
    tag: z.string().trim().max(80).nullable().optional(),
    imageUploadId: z.string().uuid().nullable().optional(),
    mobileImageUploadId: z.string().uuid().nullable().optional(),
    alt: z.string().trim().max(200).nullable().optional(),
    ctaLabel: z.string().trim().max(80).nullable().optional(),
    href: z.string().trim().max(500).nullable().optional(),
    secondaryLabel: z.string().trim().max(80).nullable().optional(),
    secondaryHref: z.string().trim().max(500).nullable().optional(),
    message: z.string().trim().max(500).nullable().optional(),
    tone: cmsToneSchema.nullable().optional(),
    accentColor: z.string().trim().max(32).nullable().optional(),
    dismissible: z.boolean().optional(),
});

export const createCmsBannerDto = bannerBaseSchema;
export const patchCmsBannerDto = bannerBaseSchema.partial();

export const reorderCmsBannersDto = z.object({
    placement: cmsPlacementSchema,
    ids: z.array(z.string().uuid()).min(1),
});

const testimonialBaseSchema = z.object({
    quote: z.string().trim().min(10).max(2000),
    reviewerName: z.string().trim().min(1).max(120),
    reviewerCity: z.string().trim().max(120).nullable().optional(),
    rating: z.number().int().min(1).max(5).default(5),
    accentColor: z.string().trim().max(32).nullable().optional(),
    avatarUploadId: z.string().uuid().nullable().optional(),
    cityId: z.string().uuid().nullable().optional(),
    platforms: cmsPlatformsSchema,
    status: cmsStatusSchema.default("draft"),
    sortIndex: z.number().int().nonnegative().optional(),
});

export const createCmsTestimonialDto = testimonialBaseSchema;
export const patchCmsTestimonialDto = testimonialBaseSchema.partial();

export {
    createHomeLayoutBlockDto,
    patchHomeLayoutBlockDto,
    listHomeLayoutBlocksQueryDto,
    reorderHomeLayoutBlocksDto,
    putHomeLayoutBlockCategoriesDto,
    homeLayoutBlockIdParamsDto,
} from "@/modules/cms/home-layout/home-layout.dto.js";

export {
    createCmsFaqDto,
    patchCmsFaqDto,
    listCmsFaqsQueryDto,
    reorderCmsFaqsDto,
} from "@/modules/cms/faq/faq.dto.js";
