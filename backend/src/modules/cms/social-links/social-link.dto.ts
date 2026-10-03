import { z } from "zod";
import { cmsPlatformsSchema } from "@/modules/cms/cms-platforms.js";

const cmsStatusSchema = z.enum(["draft", "published", "hidden"]);
export const socialIconPresetSchema = z.enum([
    "instagram",
    "facebook",
    "youtube",
    "whatsapp",
    "x",
    "linkedin",
    "custom",
]);

const hrefSchema = z
    .string()
    .trim()
    .min(1)
    .max(500)
    .refine(
        (value) =>
            /^https?:\/\//i.test(value) ||
            value.startsWith("mailto:") ||
            value.startsWith("tel:"),
        "href must be http(s), mailto, or tel",
    );

const socialBaseSchema = z.object({
    label: z.string().trim().min(1).max(120),
    href: hrefSchema,
    iconPreset: socialIconPresetSchema.nullable().optional(),
    iconUploadId: z.string().uuid().nullable().optional(),
    platforms: cmsPlatformsSchema,
    status: cmsStatusSchema.default("draft"),
    sortIndex: z.number().int().nonnegative().optional(),
});

export const createCmsSocialLinkDto = socialBaseSchema;
export const patchCmsSocialLinkDto = socialBaseSchema.partial();

export const listCmsSocialLinksQueryDto = z.object({
    page: z.coerce.number().int().positive().optional(),
    limit: z.coerce.number().int().positive().max(200).optional(),
    status: cmsStatusSchema.optional(),
});

export const reorderCmsSocialLinksDto = z.object({
    ids: z.array(z.string().uuid()).min(1),
});

export const cmsSocialLinkIdParamsDto = z.object({
    id: z.string().uuid(),
});
