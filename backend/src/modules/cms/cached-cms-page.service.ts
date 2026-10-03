import { cacheService } from "@/infrastructure/cache/index.js";
import type { CmsPageService } from "@/modules/cms/pages/page.service.js";
import { CMS_CACHE_TTL, cmsPageKey } from "@/modules/cms/cache/cms-cache.keys.js";

export class CachedCmsPageService {
    constructor(private readonly inner: CmsPageService) {}

    async getPublishedBySlug(slug: string, platform: string) {
        const key = cmsPageKey(slug, platform);
        return cacheService.getOrSet(key, CMS_CACHE_TTL.pageSeconds, () =>
            this.inner.getPublishedBySlug(slug, platform),
        );
    }
}
