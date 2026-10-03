import { ApiError } from "@/shared/errors/apiError.js";
import { parsePagination } from "@/shared/http/pagination.js";
import type { CmsPageRepository } from "@/modules/cms/pages/page.repository.js";
import type { CmsPage } from "@/modules/cms/pages/page.schema.js";
import { assertCmsPageSlugAllowed, normalizeCmsPageSlug } from "@/modules/cms/pages/page-slugs.js";
import type { z } from "zod";
import type { createCmsPageDto, patchCmsPageDto } from "@/modules/cms/pages/page.dto.js";
import { invalidatePages, invalidateSiteShell } from "@/modules/cms/cache/cms-cache.invalidation.js";
import { matchesCmsPlatform } from "@/modules/cms/cms-platforms.js";

type CreateInput = z.infer<typeof createCmsPageDto>;
type PatchInput = z.infer<typeof patchCmsPageDto>;

export type FooterLinkRow = {
    label: string;
    linkType: string;
    pageId: string | null;
    href: string;
};

export class CmsPageService {
    constructor(private readonly pages: CmsPageRepository) {}

    async listAdmin(query: Record<string, unknown>) {
        const pagination = parsePagination(query);
        const { items, total } = await this.pages.list(pagination, {
            status: query.status as CreateInput["status"] | undefined,
        });
        return {
            items,
            page: pagination.page,
            limit: pagination.limit,
            total,
        };
    }

    async listPicker() {
        const items = await this.pages.listPublishedPicker();
        return { items };
    }

    async getAdmin(id: string) {
        const row = await this.pages.findById(id);
        if (!row) throw ApiError.notFound("Page not found");
        return row;
    }

    async create(input: CreateInput) {
        this.validateSlug(input.slug);
        this.assertPublishable(input.status, input.title, input.body);
        const sortIndex = input.sortIndex ?? await this.pages.nextSortIndex();
        try {
            const row = await this.pages.insert({
                slug: input.slug,
                title: input.title.trim(),
                body: input.body.trim(),
                platforms: input.platforms,
                status: input.status,
                sortIndex,
            });
            await this.afterWrite(row.slug, row.status);
            return row;
        } catch (err) {
            if (isUniqueViolation(err)) {
                throw ApiError.conflict("A page with this slug already exists");
            }
            throw err;
        }
    }

    async patch(id: string, input: PatchInput) {
        const existing = await this.pages.findById(id);
        if (!existing) throw ApiError.notFound("Page not found");
        const status = input.status ?? existing.status;
        const title = (input.title ?? existing.title).trim();
        const body = (input.body ?? existing.body).trim();
        const slug = input.slug !== undefined ? input.slug : existing.slug;
        if (input.slug !== undefined) {
            this.validateSlug(slug);
        }
        this.assertPublishable(status, title, body);
        try {
            const row = await this.pages.update(id, {
                slug: input.slug !== undefined ? slug : undefined,
                title: input.title !== undefined ? input.title.trim() : undefined,
                body: input.body !== undefined ? input.body.trim() : undefined,
                platforms: input.platforms,
                status: input.status,
                sortIndex: input.sortIndex,
            });
            if (!row) throw ApiError.notFound("Page not found");
            await this.afterWrite(row.slug, row.status, existing.slug);
            return row;
        } catch (err) {
            if (isUniqueViolation(err)) {
                throw ApiError.conflict("A page with this slug already exists");
            }
            if (isForeignKeyViolation(err)) {
                throw ApiError.conflict("Page is linked from the footer and cannot be deleted");
            }
            throw err;
        }
    }

    async delete(id: string) {
        try {
            const ok = await this.pages.delete(id);
            if (!ok) throw ApiError.notFound("Page not found");
        } catch (err) {
            if (isForeignKeyViolation(err)) {
                throw ApiError.conflict("Page is linked from the footer and cannot be deleted");
            }
            throw err;
        }
        await invalidatePages();
        await invalidateSiteShell();
        return { id };
    }

    async getPublishedBySlug(slug: string, platform: string) {
        const normalized = normalizeCmsPageSlug(slug);
        const row = await this.pages.findBySlug(normalized);
        if (!row || row.status !== "published") {
            throw ApiError.notFound("Page not found");
        }
        if (!matchesCmsPlatform(row.platforms, platform)) {
            throw ApiError.notFound("Page not found");
        }
        return this.toPublic(row);
    }

    async getPublishedById(id: string) {
        const row = await this.pages.findById(id);
        if (!row || row.status !== "published") return undefined;
        return row;
    }

    async resolveFooterLinks(
        links: FooterLinkRow[],
        platform: string,
    ): Promise<{ label: string; href: string }[]> {
        const pageIds = links
            .filter((link) => link.linkType === "page" && link.pageId)
            .map((link) => link.pageId as string);
        const pageRows = await this.pages.findByIds(pageIds);
        const pageMap = new Map(pageRows.map((row) => [row.id, row]));

        const resolved: { label: string; href: string }[] = [];
        for (const link of links) {
            if (link.linkType === "page" && link.pageId) {
                const page = pageMap.get(link.pageId);
                if (!page || page.status !== "published") continue;
                if (!matchesCmsPlatform(page.platforms, platform)) continue;
                resolved.push({ label: link.label, href: `/pages/${page.slug}` });
                continue;
            }
            if (link.linkType !== "page" && link.href.trim()) {
                resolved.push({ label: link.label, href: link.href.trim() });
            }
        }
        return resolved;
    }

    toPublic(row: CmsPage) {
        return {
            slug: row.slug,
            title: row.title,
            body: row.body,
            updatedAt: row.updatedAt,
        };
    }

    private validateSlug(slug: string) {
        try {
            assertCmsPageSlugAllowed(slug);
        } catch {
            throw ApiError.badRequest("Invalid or reserved slug");
        }
    }

    private assertPublishable(status: CreateInput["status"], title: string, body: string) {
        if (status !== "published") return;
        if (!title.trim() || !body.trim()) {
            throw ApiError.badRequest("title and body are required to publish");
        }
    }

    private async afterWrite(slug: string, status: CmsPage["status"], previousSlug?: string) {
        await invalidatePages(slug);
        if (previousSlug && previousSlug !== slug) {
            await invalidatePages(previousSlug);
        }
        await invalidateSiteShell();
    }
}

function isUniqueViolation(err: unknown): boolean {
    return typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "23505";
}

function isForeignKeyViolation(err: unknown): boolean {
    return typeof err === "object" && err !== null && "code" in err && (err as { code: string }).code === "23503";
}
