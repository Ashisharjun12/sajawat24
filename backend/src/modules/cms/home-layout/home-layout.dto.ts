import { z } from "zod";
import { cmsPlatformsSchema } from "@/modules/cms/cms-platforms.js";

const cmsStatusSchema = z.enum(["draft", "published", "hidden"]);
const blockTypeSchema = z.enum(["category_row", "product_rail"]);

const categoryRowConfigSchema = z.object({
    maxVisible: z.number().int().min(1).max(10).optional(),
    showViewAll: z.boolean().optional(),
    viewAllHref: z.string().trim().max(500).nullable().optional(),
    enableDrillDown: z.boolean().optional(),
});

const blockBaseSchema = z.object({
    cityId: z.string().uuid().nullable().optional(),
    status: cmsStatusSchema.default("draft"),
    sortIndex: z.number().int().nonnegative().optional(),
    platforms: cmsPlatformsSchema,
    startsAt: z.coerce.date().nullable().optional(),
    endsAt: z.coerce.date().nullable().optional(),
    title: z.string().trim().max(200).nullable().optional(),
    subtitle: z.string().trim().max(500).nullable().optional(),
    showTitle: z.boolean().optional(),
    showSubtitle: z.boolean().optional(),
});

export const createHomeLayoutBlockDto = z.discriminatedUnion("type", [
    blockBaseSchema.extend({
        type: z.literal("category_row"),
        sectionId: z.null().optional(),
        config: categoryRowConfigSchema.optional(),
        categoryIds: z.array(z.string().uuid()).optional(),
    }),
    blockBaseSchema.extend({
        type: z.literal("product_rail"),
        sectionId: z.string().uuid(),
    }),
]);

export const patchHomeLayoutBlockDto = z.object({
    cityId: z.string().uuid().nullable().optional(),
    status: cmsStatusSchema.optional(),
    sortIndex: z.number().int().nonnegative().optional(),
    platforms: cmsPlatformsSchema.optional(),
    startsAt: z.coerce.date().nullable().optional(),
    endsAt: z.coerce.date().nullable().optional(),
    title: z.string().trim().max(200).nullable().optional(),
    subtitle: z.string().trim().max(500).nullable().optional(),
    showTitle: z.boolean().optional(),
    showSubtitle: z.boolean().optional(),
    sectionId: z.string().uuid().nullable().optional(),
    config: categoryRowConfigSchema.optional(),
    categoryIds: z.array(z.string().uuid()).optional(),
});

export const listHomeLayoutBlocksQueryDto = z.object({
    cityId: z
        .union([z.literal("global"), z.string().uuid()])
        .optional()
        .transform((value) => {
            if (value === undefined) return undefined;
            if (value === "global") return null;
            return value;
        }),
    status: cmsStatusSchema.optional(),
});

export const reorderHomeLayoutBlocksDto = z.object({
    cityId: z.string().uuid().nullable(),
    ids: z.array(z.string().uuid()).min(1),
});

export const putHomeLayoutBlockCategoriesDto = z.object({
    categoryIds: z.array(z.string().uuid()),
});

export const homeLayoutBlockIdParamsDto = z.object({
    id: z.string().uuid(),
});
