import { Router } from "express";
import type { SectionController } from "@/modules/catalog/sections/section.controller.js";
import {
    adminSectionProductsQueryDto,
    createSectionDto,
    patchSectionDto,
    publicSectionListQueryDto,
    putSectionProductsDto,
    sectionCityOverrideParamsDto,
    sectionIdParamsDto,
} from "@/modules/catalog/sections/section.dto.js";
import { validate } from "@/shared/middlewares/validate.middleware.js";

export function createSectionPublicRouter(sectionController: SectionController) {
    const router = Router();
    router.get("/", validate(publicSectionListQueryDto, "query"), sectionController.listPublic);
    return router;
}

export function createSectionAdminRouter(sectionController: SectionController) {
    const router = Router();
    router.get("/", sectionController.listAdmin);
    router.get("/global-product-occupancy", sectionController.listGlobalProductOccupancy);
    router.post("/", validate(createSectionDto), sectionController.create);
    router.get(
        "/:id/products",
        validate(sectionIdParamsDto, "params"),
        validate(adminSectionProductsQueryDto, "query"),
        sectionController.listProducts,
    );
    router.put(
        "/:id/products",
        validate(sectionIdParamsDto, "params"),
        validate(putSectionProductsDto),
        sectionController.replaceProducts,
    );
    router.delete(
        "/:id/city-overrides/:cityId",
        validate(sectionCityOverrideParamsDto, "params"),
        sectionController.deleteCityOverride,
    );
    router.patch(
        "/:id",
        validate(sectionIdParamsDto, "params"),
        validate(patchSectionDto),
        sectionController.patch,
    );
    router.delete("/:id", validate(sectionIdParamsDto, "params"), sectionController.delete);
    return router;
}
