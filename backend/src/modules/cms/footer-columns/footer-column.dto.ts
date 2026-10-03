import { z } from "zod";
import { cmsPlatformsSchema } from "@/modules/cms/cms-platforms.js";

const cmsStatusSchema = z.enum(["draft", "published", "hidden"]);

const footerHrefSchema = z
    .string()
    .trim()
    .min(1)
    .max(500)
    .refine(
        (value) => value.startsWith("/") || /^https?:\/\//i.test(value) || value.startsWith("mailto:"),
        "href must be a path or http(s) URL",
    );

const footerCustomLinkSchema = z.object({
    label: z.string().trim().min(1).max(120),
    linkType: z.literal("custom").default("custom"),
    href: footerHrefSchema,
    pageId: z.null().optional(),
});

const footerPageLinkSchema = z.object({
    label: z.string().trim().min(1).max(120),
    linkType: z.literal("page"),
    pageId: z.string().uuid(),
    href: z.string().optional(),
});

const footerLinkSchema = z.discriminatedUnion("linkType", [
    footerCustomLinkSchema,
    footerPageLinkSchema,
]);

const columnBaseSchema = z.object({
    title: z.string().trim().min(1).max(120),
    platforms: cmsPlatformsSchema,
    status: cmsStatusSchema.default("draft"),
    sortIndex: z.number().int().nonnegative().optional(),
});

export const createCmsFooterColumnDto = columnBaseSchema;
export const patchCmsFooterColumnDto = columnBaseSchema.partial();

export const reorderCmsFooterColumnsDto = z.object({
    ids: z.array(z.string().uuid()).min(1),
});

export const cmsFooterColumnIdParamsDto = z.object({
    id: z.string().uuid(),
});

export const putCmsFooterColumnLinksDto = z.object({
    links: z.array(footerLinkSchema).max(30),
});
