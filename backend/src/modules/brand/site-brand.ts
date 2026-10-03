import {
    mergeStoredFaqs,
    mergeStoredPoints,
} from "@/modules/catalog/products/product-copy.js";
import type { ProductFaq } from "@/modules/catalog/products/product.schema.js";

export const SITE_BRAND_KEY = "site_brand";

export type SiteBrand = {
    companyName: string;
    footerDescription: string;
    logoLightUploadId: string | null;
    logoDarkUploadId: string | null;
    contactPhone: string | null;
    contactEmail: string | null;
    whatsappUrl: string | null;
    productTrustGalleryEnabled: boolean;
    productTrustGalleryUploadId: string | null;
    defaultIncludes: string[];
    defaultDeliverySetup: string[];
    defaultCareInstructions: string[];
    defaultFaqs: ProductFaq[];
};

export const DEFAULT_SITE_BRAND: SiteBrand = {
    companyName: "Decoryy",
    footerDescription:
        "City-priced decoration setups — balloons, backdrops, and lights, dressed for the room you have.",
    logoLightUploadId: null,
    logoDarkUploadId: null,
    contactPhone: null,
    contactEmail: null,
    whatsappUrl: null,
    productTrustGalleryEnabled: false,
    productTrustGalleryUploadId: null,
    defaultIncludes: [],
    defaultDeliverySetup: [],
    defaultCareInstructions: [],
    defaultFaqs: [],
};

export function mergeSiteBrand(value: unknown): SiteBrand {
    const raw =
        value && typeof value === "object" && !Array.isArray(value)
            ? (value as Record<string, unknown>)
            : {};

    const str = (key: keyof SiteBrand, fallback: string) => {
        const v = raw[key];
        return typeof v === "string" ? v.trim() : fallback;
    };

    const nullableStr = (key: keyof SiteBrand): string | null => {
        const v = raw[key];
        if (v === null || v === undefined || v === "") return null;
        return typeof v === "string" ? v.trim() : null;
    };

    const uuidOrNull = (
        key: "logoLightUploadId" | "logoDarkUploadId" | "productTrustGalleryUploadId",
    ): string | null => {
        const v = raw[key];
        if (v === null || v === undefined || v === "") return null;
        return typeof v === "string" ? v : null;
    };

    return {
        companyName: str("companyName", DEFAULT_SITE_BRAND.companyName) || DEFAULT_SITE_BRAND.companyName,
        footerDescription: str("footerDescription", DEFAULT_SITE_BRAND.footerDescription),
        logoLightUploadId: uuidOrNull("logoLightUploadId"),
        logoDarkUploadId: uuidOrNull("logoDarkUploadId"),
        contactPhone: nullableStr("contactPhone"),
        contactEmail: nullableStr("contactEmail"),
        whatsappUrl: nullableStr("whatsappUrl"),
        productTrustGalleryEnabled: raw.productTrustGalleryEnabled === true,
        productTrustGalleryUploadId: uuidOrNull("productTrustGalleryUploadId"),
        defaultIncludes: mergeStoredPoints(raw.defaultIncludes),
        defaultDeliverySetup: mergeStoredPoints(raw.defaultDeliverySetup),
        defaultCareInstructions: mergeStoredPoints(raw.defaultCareInstructions),
        defaultFaqs: mergeStoredFaqs(raw.defaultFaqs),
    };
}
