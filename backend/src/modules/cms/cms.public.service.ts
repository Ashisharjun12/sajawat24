import { CmsHomeService } from "@/modules/cms/cms-home.service.js";
import type { CmsBannerRepository } from "@/modules/cms/banners/banner.repository.js";
import type { CmsTestimonialRepository } from "@/modules/cms/testimonials/testimonial.repository.js";
import { resolveCompletedDisplayUrls, urlFromMap } from "@/modules/upload/index.js";

import type { CmsHomeLayoutService } from "@/modules/cms/home-layout/home-layout.service.js";
import type { CmsHomeFaqRepository } from "@/modules/cms/faq/faq.repository.js";

export class CmsPublicService {
    private readonly home = new CmsHomeService();

    constructor(
        private readonly banners: CmsBannerRepository,
        private readonly testimonials: CmsTestimonialRepository,
        private readonly homeLayout: CmsHomeLayoutService,
        private readonly faqs: CmsHomeFaqRepository,
    ) {}

    async getHome(query: { cityId?: string; pincode?: string; platform?: string }) {
        const [bannerRows, testimonialRows, faqRows] = await Promise.all([
            this.banners.listPublished(),
            this.testimonials.listPublished(),
            this.faqs.listPublished(),
        ]);

        const uploadIds: string[] = [];
        for (const row of bannerRows) {
            if (row.imageUploadId) uploadIds.push(row.imageUploadId);
            if (row.mobileImageUploadId) uploadIds.push(row.mobileImageUploadId);
        }
        for (const row of testimonialRows) {
            if (row.avatarUploadId) uploadIds.push(row.avatarUploadId);
        }
        const urlMap = await resolveCompletedDisplayUrls(uploadIds);

        const banners = bannerRows.map((row) => ({
            ...row,
            imageUrl: urlFromMap(urlMap, row.imageUploadId),
            mobileImageUrl: urlFromMap(urlMap, row.mobileImageUploadId),
        }));

        const testimonials = testimonialRows.map((row) => ({
            ...row,
            avatarUrl: urlFromMap(urlMap, row.avatarUploadId),
        }));

        const resolved = this.home.resolve(banners, testimonials, faqRows, {
            cityId: query.cityId,
            platform: query.platform ?? "web",
        });
        const layoutBlocks = await this.homeLayout.resolvePublic({
            cityId: query.cityId,
            pincode: query.pincode,
            platform: query.platform ?? "web",
        });
        return { ...resolved, layoutBlocks };
    }
}
