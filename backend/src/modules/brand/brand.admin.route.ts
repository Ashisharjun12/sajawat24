import { Router } from "express";
import type { BrandAdminController } from "@/modules/brand/brand.admin.controller.js";
import {
    patchSiteBrandDto,
    createCmsSocialLinkDto,
    patchCmsSocialLinkDto,
    listCmsSocialLinksQueryDto,
    reorderCmsSocialLinksDto,
    cmsSocialLinkIdParamsDto,
    createCmsFooterColumnDto,
    patchCmsFooterColumnDto,
    reorderCmsFooterColumnsDto,
    cmsFooterColumnIdParamsDto,
    putCmsFooterColumnLinksDto,
    createCmsPageDto,
    patchCmsPageDto,
    listCmsPagesQueryDto,
    cmsPageIdParamsDto,
} from "@/modules/brand/brand.dto.js";
import { validate } from "@/shared/middlewares/validate.middleware.js";

export function createBrandAdminRouter(controller: BrandAdminController) {
    const router = Router();

    router.get("/site", controller.getSite);
    router.patch("/site", validate(patchSiteBrandDto), controller.patchSite);

    router.get(
        "/social-links",
        validate(listCmsSocialLinksQueryDto, "query"),
        controller.listSocialLinks,
    );
    router.put("/social-links/reorder", validate(reorderCmsSocialLinksDto), controller.reorderSocialLinks);
    router.get(
        "/social-links/:id",
        validate(cmsSocialLinkIdParamsDto, "params"),
        controller.getSocialLink,
    );
    router.post("/social-links", validate(createCmsSocialLinkDto), controller.createSocialLink);
    router.patch(
        "/social-links/:id",
        validate(cmsSocialLinkIdParamsDto, "params"),
        validate(patchCmsSocialLinkDto),
        controller.patchSocialLink,
    );
    router.delete(
        "/social-links/:id",
        validate(cmsSocialLinkIdParamsDto, "params"),
        controller.deleteSocialLink,
    );

    router.get("/footer-columns", controller.listFooterColumns);
    router.put(
        "/footer-columns/reorder",
        validate(reorderCmsFooterColumnsDto),
        controller.reorderFooterColumns,
    );
    router.get(
        "/footer-columns/:id",
        validate(cmsFooterColumnIdParamsDto, "params"),
        controller.getFooterColumn,
    );
    router.post("/footer-columns", validate(createCmsFooterColumnDto), controller.createFooterColumn);
    router.patch(
        "/footer-columns/:id",
        validate(cmsFooterColumnIdParamsDto, "params"),
        validate(patchCmsFooterColumnDto),
        controller.patchFooterColumn,
    );
    router.delete(
        "/footer-columns/:id",
        validate(cmsFooterColumnIdParamsDto, "params"),
        controller.deleteFooterColumn,
    );
    router.put(
        "/footer-columns/:id/links",
        validate(cmsFooterColumnIdParamsDto, "params"),
        validate(putCmsFooterColumnLinksDto),
        controller.putFooterColumnLinks,
    );

    router.get("/pages/picker", controller.listPagesPicker);
    router.get("/pages", validate(listCmsPagesQueryDto, "query"), controller.listPages);
    router.get("/pages/:id", validate(cmsPageIdParamsDto, "params"), controller.getPage);
    router.post("/pages", validate(createCmsPageDto), controller.createPage);
    router.patch(
        "/pages/:id",
        validate(cmsPageIdParamsDto, "params"),
        validate(patchCmsPageDto),
        controller.patchPage,
    );
    router.delete("/pages/:id", validate(cmsPageIdParamsDto, "params"), controller.deletePage);

    return router;
}
