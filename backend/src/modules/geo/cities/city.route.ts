import { Router } from "express";
import type { CityController } from "@/modules/geo/cities/city.controller.js";
import { adminListQueryDto, cityIdParamsDto, createCityDto, patchCityDto } from "@/modules/geo/cities/city.dto.js";
import { validate } from "@/shared/middlewares/validate.middleware.js";

export function createCityPublicRouter(cityController: CityController) {
    const router = Router();
    router.get("/", cityController.listActive);
    return router;
}

export function createCityAdminRouter(cityController: CityController) {
    const router = Router();
    router.get("/", validate(adminListQueryDto, "query"), cityController.listAdmin);
    router.post("/", validate(createCityDto), cityController.create);
    router.patch("/:id", validate(cityIdParamsDto, "params"), validate(patchCityDto), cityController.patch);
    return router;
}
