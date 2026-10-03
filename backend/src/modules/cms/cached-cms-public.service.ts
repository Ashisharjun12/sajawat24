import { cacheService } from "@/infrastructure/cache/index.js";
import type { CmsPublicService } from "@/modules/cms/cms.public.service.js";
import { CMS_CACHE_TTL, cmsHomeKey } from "@/modules/cms/cache/cms-cache.keys.js";

export class CachedCmsPublicService {
    constructor(private readonly inner: CmsPublicService) {}

    async getHome(query: { cityId?: string; pincode?: string; platform?: string }) {
        const platform = query.platform ?? "web";
        const key = cmsHomeKey(platform, query.cityId, query.pincode);
        return cacheService.getOrSet(key, CMS_CACHE_TTL.homeSeconds, () => this.inner.getHome(query));
    }
}
