import { eq, sql } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import { addons } from "@/modules/catalog/addons/addon.schema.js";
import { categories } from "@/modules/catalog/categories/category.schema.js";
import { productImages, products } from "@/modules/catalog/products/product.schema.js";
import { cmsBanners } from "@/modules/cms/banners/banner.schema.js";
import { cmsSocialLinks } from "@/modules/cms/social-links/social-link.schema.js";
import { cmsTestimonials } from "@/modules/cms/testimonials/testimonial.schema.js";
import { SITE_BRAND_KEY } from "@/modules/brand/site-brand.js";
import { cities } from "@/modules/geo/cities/city.schema.js";
import { vendors } from "@/modules/identity/vendors/vendor.schema.js";
import { platformSettings } from "@/modules/ops/settings/setting.schema.js";
import { customerReviews } from "@/modules/reviews/customer-reviews/customer-review.schema.js";
import { videoReviews } from "@/modules/reviews/video-reviews/video-review.schema.js";

export type UploadReference = {
    type: string;
    id: string;
    label: string;
    field: string;
    blocksDelete: boolean;
    adminPath: string | null;
};

function ref(
    type: string,
    id: string,
    label: string,
    field: string,
    blocksDelete: boolean,
    adminPath: string | null,
): UploadReference {
    return { type, id, label, field, blocksDelete, adminPath };
}

export async function findUploadReferences(uploadId: string): Promise<UploadReference[]> {
    const references: UploadReference[] = [];

    const productRows = await db
        .select({
            productId: productImages.productId,
            name: products.name,
            slug: products.slug,
        })
        .from(productImages)
        .innerJoin(products, eq(productImages.productId, products.id))
        .where(eq(productImages.uploadId, uploadId));

    for (const row of productRows) {
        references.push(
            ref(
                "product",
                row.productId,
                row.name || row.slug,
                "gallery",
                true,
                `/catalog/products/${row.productId}`,
            ),
        );
    }

    const videoRows = await db
        .select({
            id: videoReviews.id,
            caption: videoReviews.caption,
            productId: videoReviews.productId,
        })
        .from(videoReviews)
        .where(eq(videoReviews.uploadId, uploadId));

    for (const row of videoRows) {
        const label = row.caption?.trim() || "Video review";
        const adminPath = row.productId
            ? `/catalog/products/${row.productId}/reviews`
            : "/content";
        references.push(ref("video_review", row.id, label, "upload", true, adminPath));
    }

    const categoryRows = await db
        .select({ id: categories.id, name: categories.name })
        .from(categories)
        .where(eq(categories.imageUploadId, uploadId));
    for (const row of categoryRows) {
        references.push(
            ref("category", row.id, row.name, "image", false, "/catalog?tab=categories"),
        );
    }

    const cityRows = await db
        .select({ id: cities.id, name: cities.name })
        .from(cities)
        .where(eq(cities.imageUploadId, uploadId));
    for (const row of cityRows) {
        references.push(ref("city", row.id, row.name, "image", false, "/geo"));
    }

    const addonRows = await db
        .select({ id: addons.id, name: addons.name })
        .from(addons)
        .where(eq(addons.imageUploadId, uploadId));
    for (const row of addonRows) {
        references.push(
            ref("addon", row.id, row.name, "image", false, `/catalog/addons/${row.id}`),
        );
    }

    const bannerImageRows = await db
        .select({ id: cmsBanners.id, title: cmsBanners.title, placement: cmsBanners.placement })
        .from(cmsBanners)
        .where(eq(cmsBanners.imageUploadId, uploadId));
    for (const row of bannerImageRows) {
        const label = row.title?.trim() || row.placement;
        references.push(ref("cms_banner", row.id, label, "image", false, "/content"));
    }

    const bannerMobileRows = await db
        .select({ id: cmsBanners.id, title: cmsBanners.title, placement: cmsBanners.placement })
        .from(cmsBanners)
        .where(eq(cmsBanners.mobileImageUploadId, uploadId));
    for (const row of bannerMobileRows) {
        const label = row.title?.trim() || row.placement;
        references.push(ref("cms_banner", row.id, label, "mobileImage", false, "/content"));
    }

    const testimonialRows = await db
        .select({ id: cmsTestimonials.id, reviewerName: cmsTestimonials.reviewerName })
        .from(cmsTestimonials)
        .where(eq(cmsTestimonials.avatarUploadId, uploadId));
    for (const row of testimonialRows) {
        references.push(ref("cms_testimonial", row.id, row.reviewerName, "avatar", false, "/content"));
    }

    const socialRows = await db
        .select({ id: cmsSocialLinks.id, label: cmsSocialLinks.label })
        .from(cmsSocialLinks)
        .where(eq(cmsSocialLinks.iconUploadId, uploadId));
    for (const row of socialRows) {
        references.push(ref("cms_social_link", row.id, row.label, "icon", false, "/brand"));
    }

    const vendorRows = await db
        .select({ id: vendors.id, shopAddress: vendors.shopAddress })
        .from(vendors)
        .where(eq(vendors.shopImageUploadId, uploadId));
    for (const row of vendorRows) {
        const label = row.shopAddress?.slice(0, 48) || "Vendor shop image";
        references.push(ref("vendor", row.id, label, "shopImage", false, null));
    }

    const avatarReviewRows = await db
        .select({
            id: customerReviews.id,
            reviewerName: customerReviews.reviewerName,
            productId: customerReviews.productId,
        })
        .from(customerReviews)
        .where(eq(customerReviews.reviewerAvatarUploadId, uploadId));
    for (const row of avatarReviewRows) {
        references.push(
            ref(
                "customer_review",
                row.id,
                row.reviewerName,
                "reviewerAvatar",
                false,
                row.productId ? `/catalog/products/${row.productId}/reviews` : null,
            ),
        );
    }

    const photoReviewRows = await db
        .select({
            id: customerReviews.id,
            reviewerName: customerReviews.reviewerName,
            productId: customerReviews.productId,
        })
        .from(customerReviews)
        .where(sql`${customerReviews.photoUploadIds} @> ${JSON.stringify([uploadId])}::jsonb`);
    for (const row of photoReviewRows) {
        references.push(
            ref(
                "customer_review",
                row.id,
                row.reviewerName,
                "photo",
                false,
                row.productId ? `/catalog/products/${row.productId}/reviews` : null,
            ),
        );
    }

    const [brandSetting] = await db
        .select()
        .from(platformSettings)
        .where(eq(platformSettings.key, SITE_BRAND_KEY))
        .limit(1);
    if (brandSetting?.value && typeof brandSetting.value === "object") {
        const brand = brandSetting.value as Record<string, unknown>;
        const brandFields: { key: string; label: string }[] = [
            { key: "logoLightUploadId", label: "Logo (light)" },
            { key: "logoDarkUploadId", label: "Logo (dark)" },
            { key: "productTrustGalleryUploadId", label: "Trust gallery slide" },
        ];
        for (const { key, label } of brandFields) {
            if (brand[key] === uploadId) {
                references.push(ref("site_brand", SITE_BRAND_KEY, label, key, false, "/brand"));
            }
        }
    }

    return references;
}

export function referencesBlockDelete(references: UploadReference[]): boolean {
    return references.some((row) => row.blocksDelete);
}
