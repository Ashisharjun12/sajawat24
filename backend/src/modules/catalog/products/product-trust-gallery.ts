import type { SiteBrandService } from "@/modules/brand/site-brand.service.js";
import type { ProductImagePublic } from "@/modules/catalog/products/product.service.js";
import { displayUrl, getCompletedUpload, toPublicMedia } from "@/modules/upload/index.js";

export async function appendTrustGallerySlide(
    images: ProductImagePublic[],
    siteBrand: SiteBrandService,
): Promise<ProductImagePublic[]> {
    const slide = await siteBrand.getProductTrustGallerySlide();
    if (!slide) {
        return images;
    }

    if (images.some((item) => item.uploadId === slide.uploadId)) {
        return images;
    }

    const upload = await getCompletedUpload(slide.uploadId);
    const maxSort = images.reduce((max, item) => Math.max(max, item.sortIndex), -1);

    return [
        ...images,
        {
            ...toPublicMedia(upload),
            uploadId: slide.uploadId,
            sortIndex: maxSort + 1,
            url: displayUrl(upload),
            role: "trust",
        },
    ];
}
