import { z } from "zod";
import {
    productCopyFaqsDto,
    productCopyPointsDto,
} from "@/modules/catalog/products/product.dto.js";

export const patchSiteBrandDto = z.object({
    companyName: z.string().trim().min(1).max(120).optional(),
    footerDescription: z.string().trim().max(2000).optional(),
    logoLightUploadId: z.string().uuid().nullable().optional(),
    logoDarkUploadId: z.string().uuid().nullable().optional(),
    contactPhone: z.string().trim().max(40).nullable().optional(),
    contactEmail: z.union([z.string().trim().email().max(200), z.literal("")]).nullable().optional(),
    whatsappUrl: z.string().trim().max(500).nullable().optional(),
    productTrustGalleryEnabled: z.boolean().optional(),
    productTrustGalleryUploadId: z.string().uuid().nullable().optional(),
    defaultIncludes: productCopyPointsDto,
    defaultDeliverySetup: productCopyPointsDto,
    defaultCareInstructions: productCopyPointsDto,
    defaultFaqs: productCopyFaqsDto,
});

export {
    createCmsSocialLinkDto,
    patchCmsSocialLinkDto,
    listCmsSocialLinksQueryDto,
    reorderCmsSocialLinksDto,
    cmsSocialLinkIdParamsDto,
} from "@/modules/cms/social-links/social-link.dto.js";

export {
    createCmsFooterColumnDto,
    patchCmsFooterColumnDto,
    reorderCmsFooterColumnsDto,
    cmsFooterColumnIdParamsDto,
    putCmsFooterColumnLinksDto,
} from "@/modules/cms/footer-columns/footer-column.dto.js";

export {
    createCmsPageDto,
    patchCmsPageDto,
    listCmsPagesQueryDto,
    cmsPageIdParamsDto,
    cmsPageSlugParamsDto,
    cmsPagePublicQueryDto,
} from "@/modules/cms/pages/page.dto.js";

export const siteShellQueryDto = z.object({
    platform: z.enum(["web", "mobile"]).default("web"),
});
