import { ApiError } from "@/shared/errors/apiError.js";
import { getCompletedUpload, toPublicMedia } from "@/modules/upload/index.js";
import type { ISettingRepository } from "@/modules/ops/settings/setting.repository.js";
import {
    DEFAULT_SITE_BRAND,
    mergeSiteBrand,
    SITE_BRAND_KEY,
    type SiteBrand,
} from "@/modules/brand/site-brand.js";
import type { z } from "zod";
import type { patchSiteBrandDto } from "@/modules/brand/brand.dto.js";
import { invalidateSiteShell } from "@/modules/cms/cache/cms-cache.invalidation.js";
import { sanitizeFaqs, sanitizePoints } from "@/modules/catalog/products/product-copy.js";

type PatchInput = z.infer<typeof patchSiteBrandDto>;

export class SiteBrandService {
    constructor(private readonly settings: ISettingRepository) {}

    async getAdmin() {
        const brand = await this.load();
        const [logoLightUrl, logoDarkUrl, productTrustGalleryUrl] = await Promise.all([
            brand.logoLightUploadId ? this.mediaUrl(brand.logoLightUploadId) : null,
            brand.logoDarkUploadId ? this.mediaUrl(brand.logoDarkUploadId) : null,
            brand.productTrustGalleryUploadId
                ? this.mediaUrl(brand.productTrustGalleryUploadId)
                : null,
        ]);
        return {
            ...brand,
            logoLightUrl,
            logoDarkUrl,
            productTrustGalleryUrl,
        };
    }

    async patch(input: PatchInput) {
        const current = await this.load();
        const next: SiteBrand = {
            companyName: input.companyName?.trim() ?? current.companyName,
            footerDescription: input.footerDescription?.trim() ?? current.footerDescription,
            logoLightUploadId:
                input.logoLightUploadId !== undefined
                    ? input.logoLightUploadId
                    : current.logoLightUploadId,
            logoDarkUploadId:
                input.logoDarkUploadId !== undefined
                    ? input.logoDarkUploadId
                    : current.logoDarkUploadId,
            contactPhone:
                input.contactPhone !== undefined ? input.contactPhone : current.contactPhone,
            contactEmail:
                input.contactEmail !== undefined
                    ? input.contactEmail === "" ? null : input.contactEmail
                    : current.contactEmail,
            whatsappUrl: input.whatsappUrl !== undefined ? input.whatsappUrl : current.whatsappUrl,
            productTrustGalleryEnabled:
                input.productTrustGalleryEnabled !== undefined
                    ? input.productTrustGalleryEnabled
                    : current.productTrustGalleryEnabled,
            productTrustGalleryUploadId:
                input.productTrustGalleryUploadId !== undefined
                    ? input.productTrustGalleryUploadId
                    : current.productTrustGalleryUploadId,
            defaultIncludes:
                input.defaultIncludes !== undefined
                    ? sanitizePoints(input.defaultIncludes)
                    : current.defaultIncludes,
            defaultDeliverySetup:
                input.defaultDeliverySetup !== undefined
                    ? sanitizePoints(input.defaultDeliverySetup)
                    : current.defaultDeliverySetup,
            defaultCareInstructions:
                input.defaultCareInstructions !== undefined
                    ? sanitizePoints(input.defaultCareInstructions)
                    : current.defaultCareInstructions,
            defaultFaqs:
                input.defaultFaqs !== undefined
                    ? sanitizeFaqs(input.defaultFaqs)
                    : current.defaultFaqs,
        };

        if (next.logoLightUploadId) await this.validateLogo(next.logoLightUploadId);
        if (next.logoDarkUploadId) await this.validateLogo(next.logoDarkUploadId);
        if (next.productTrustGalleryUploadId) {
            await this.validateTrustGalleryImage(next.productTrustGalleryUploadId);
        }
        if (next.productTrustGalleryEnabled && !next.productTrustGalleryUploadId) {
            throw ApiError.badRequest("choose a trust gallery image before enabling");
        }

        await this.settings.upsert(SITE_BRAND_KEY, next);
        const admin = await this.getAdmin();
        await invalidateSiteShell();
        return admin;
    }

    async getPublicBrand() {
        const brand = await this.load();
        const [logoLightUrl, logoDarkUrl] = await Promise.all([
            brand.logoLightUploadId ? this.mediaUrl(brand.logoLightUploadId) : null,
            brand.logoDarkUploadId ? this.mediaUrl(brand.logoDarkUploadId) : null,
        ]);
        return {
            companyName: brand.companyName,
            footerDescription: brand.footerDescription,
            logoLightUrl,
            logoDarkUrl,
            contactPhone: brand.contactPhone,
            contactEmail: brand.contactEmail,
            whatsappUrl: brand.whatsappUrl,
        };
    }

    private async load(): Promise<SiteBrand> {
        const row = await this.settings.findByKey(SITE_BRAND_KEY);
        const brand = mergeSiteBrand(row?.value);
        if (!row) {
            await this.settings.upsert(SITE_BRAND_KEY, brand);
        }
        return brand;
    }

    async getProductTrustGallerySlide() {
        const brand = await this.load();
        if (!brand.productTrustGalleryEnabled || !brand.productTrustGalleryUploadId) {
            return null;
        }
        const upload = await getCompletedUpload(brand.productTrustGalleryUploadId);
        if (upload.kind !== "image") {
            return null;
        }
        const media = toPublicMedia(upload);
        const url = media.optimizedUrl ?? media.publicUrl;
        return {
            uploadId: brand.productTrustGalleryUploadId,
            url,
        };
    }

    private async validateLogo(uploadId: string) {
        const upload = await getCompletedUpload(uploadId);
        if (upload.kind !== "image") {
            throw ApiError.badRequest("logo must be an image");
        }
    }

    private async validateTrustGalleryImage(uploadId: string) {
        const upload = await getCompletedUpload(uploadId);
        if (upload.kind !== "image") {
            throw ApiError.badRequest("trust gallery slide must be an image");
        }
    }

    private async mediaUrl(uploadId: string) {
        const upload = await getCompletedUpload(uploadId);
        const media = toPublicMedia(upload);
        return media.optimizedUrl ?? media.publicUrl;
    }
}
