import type { SiteBrandService } from "@/modules/brand/site-brand.service.js";
import type { CmsSocialLinkService } from "@/modules/cms/social-links/social-link.service.js";
import type { CmsFooterColumnService } from "@/modules/cms/footer-columns/footer-column.service.js";
import type { CmsPageService } from "@/modules/cms/pages/page.service.js";
import { resolveCompletedDisplayUrls, urlFromMap } from "@/modules/upload/index.js";

import { matchesCmsPlatform } from "@/modules/cms/cms-platforms.js";

export class SiteShellService {
    constructor(
        private readonly siteBrand: SiteBrandService,
        private readonly socialLinks: CmsSocialLinkService,
        private readonly footerColumns: CmsFooterColumnService,
        private readonly pages: CmsPageService,
    ) {}

    async get(options: { platform?: string } = {}) {
        const platform = options.platform ?? "web";

        const [brand, socialRows, columnRows] = await Promise.all([
            this.siteBrand.getPublicBrand(),
            this.socialLinks.listPublished(),
            this.footerColumns.listPublished(),
        ]);

        const filteredSocial = socialRows.filter((row) => matchesCmsPlatform(row.platforms, platform));
        const iconUrlMap = await resolveCompletedDisplayUrls(
            filteredSocial.map((row) => row.iconUploadId).filter(Boolean) as string[],
        );
        const socialLinks = filteredSocial.map((row) => ({
            id: row.id,
            label: row.label,
            href: row.href,
            iconPreset: row.iconPreset,
            iconUrl: urlFromMap(iconUrlMap, row.iconUploadId),
        }));

        const footerColumns = [];
        for (const row of columnRows) {
            if (!matchesCmsPlatform(row.platforms, platform)) continue;
            const links = await this.pages.resolveFooterLinks(row.links, platform);
            if (!links.length) continue;
            footerColumns.push({
                id: row.id,
                title: row.title,
                links,
            });
        }

        return {
            brand,
            socialLinks,
            footerColumns,
        };
    }
}
