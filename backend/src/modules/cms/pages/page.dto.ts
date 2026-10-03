import { z } from "zod";
import { normalizeCmsPageSlug } from "@/modules/cms/pages/page-slugs.js";
import { cmsHomePlatformSchema, cmsPlatformsSchema } from "@/modules/cms/cms-platforms.js";

const cmsStatusSchema = z.enum(["draft", "published", "hidden"]);

const slugSchema = z
    .string()
    .trim()
    .min(2)
    .max(80)
    .transform((value) => normalizeCmsPageSlug(value))
    .refine((value) => value.length >= 2, "slug is required");

const pageBaseSchema = z.object({
    slug: slugSchema,
    title: z.string().trim().min(1).max(200),
    body: z.string().max(500_000).default(""),
    platforms: cmsPlatformsSchema,
    status: cmsStatusSchema.default("draft"),
    sortIndex: z.number().int().nonnegative().optional(),
});

export const createCmsPageDto = pageBaseSchema;
export const patchCmsPageDto = pageBaseSchema.partial();

export const listCmsPagesQueryDto = z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(200).optional(),
    status: cmsStatusSchema.optional(),
});

export const cmsPageIdParamsDto = z.object({
    id: z.string().uuid(),
});

export const cmsPageSlugParamsDto = z.object({
    slug: z.string().trim().min(1).max(80),
});

export const cmsPagePublicQueryDto = z.object({
    platform: cmsHomePlatformSchema,
});
