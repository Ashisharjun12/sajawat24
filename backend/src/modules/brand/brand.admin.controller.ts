import type { Request } from "express";
import { ApiResponse } from "@/shared/errors/apiResponse.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import type { SiteBrandService } from "@/modules/brand/site-brand.service.js";
import type { CmsSocialLinkService } from "@/modules/cms/social-links/social-link.service.js";
import type { CmsFooterColumnService } from "@/modules/cms/footer-columns/footer-column.service.js";
import type { CmsPageService } from "@/modules/cms/pages/page.service.js";

export class BrandAdminController {
    constructor(
        private readonly siteBrand: SiteBrandService,
        private readonly socialLinks: CmsSocialLinkService,
        private readonly footerColumns: CmsFooterColumnService,
        private readonly pages: CmsPageService,
    ) {}

    getSite = asyncHandler(async (_req, res) => {
        const data = await this.siteBrand.getAdmin();
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    patchSite = asyncHandler(async (req, res) => {
        const data = await this.siteBrand.patch(req.body);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    listSocialLinks = asyncHandler(async (req, res) => {
        const data = await this.socialLinks.listAdmin(req.query);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    getSocialLink = asyncHandler(async (req, res) => {
        const data = await this.socialLinks.getAdmin(paramId(req));
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    createSocialLink = asyncHandler(async (req, res) => {
        const data = await this.socialLinks.create(req.body);
        res.status(201).json(new ApiResponse(201, data, "created"));
    });

    patchSocialLink = asyncHandler(async (req, res) => {
        const data = await this.socialLinks.patch(paramId(req), req.body);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    deleteSocialLink = asyncHandler(async (req, res) => {
        const data = await this.socialLinks.delete(paramId(req));
        res.status(200).json(new ApiResponse(200, data, "deleted"));
    });

    reorderSocialLinks = asyncHandler(async (req, res) => {
        const { ids } = req.body as { ids: string[] };
        const data = await this.socialLinks.reorder(ids);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    listFooterColumns = asyncHandler(async (_req, res) => {
        const data = await this.footerColumns.listAdmin();
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    getFooterColumn = asyncHandler(async (req, res) => {
        const data = await this.footerColumns.getAdmin(paramId(req));
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    createFooterColumn = asyncHandler(async (req, res) => {
        const data = await this.footerColumns.create(req.body);
        res.status(201).json(new ApiResponse(201, data, "created"));
    });

    patchFooterColumn = asyncHandler(async (req, res) => {
        const data = await this.footerColumns.patch(paramId(req), req.body);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    deleteFooterColumn = asyncHandler(async (req, res) => {
        const data = await this.footerColumns.delete(paramId(req));
        res.status(200).json(new ApiResponse(200, data, "deleted"));
    });

    reorderFooterColumns = asyncHandler(async (req, res) => {
        const { ids } = req.body as { ids: string[] };
        const data = await this.footerColumns.reorder(ids);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    putFooterColumnLinks = asyncHandler(async (req, res) => {
        const data = await this.footerColumns.replaceLinks(paramId(req), req.body);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    listPages = asyncHandler(async (req, res) => {
        const data = await this.pages.listAdmin(req.query);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    listPagesPicker = asyncHandler(async (_req, res) => {
        const data = await this.pages.listPicker();
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    getPage = asyncHandler(async (req, res) => {
        const data = await this.pages.getAdmin(paramId(req));
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    createPage = asyncHandler(async (req, res) => {
        const data = await this.pages.create(req.body);
        res.status(201).json(new ApiResponse(201, data, "created"));
    });

    patchPage = asyncHandler(async (req, res) => {
        const data = await this.pages.patch(paramId(req), req.body);
        res.status(200).json(new ApiResponse(200, data, "ok"));
    });

    deletePage = asyncHandler(async (req, res) => {
        const data = await this.pages.delete(paramId(req));
        res.status(200).json(new ApiResponse(200, data, "deleted"));
    });
}

function paramId(req: Request): string {
    const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    return String(id ?? "");
}
