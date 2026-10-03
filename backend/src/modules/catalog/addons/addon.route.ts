import { Router } from "express";
import type { AddonController } from "@/modules/catalog/addons/addon.controller.js";
import {
    addonCityPriceDto,
    addonCityPriceParamsDto,
    addonColorIdParamsDto,
    addonIdParamsDto,
    adminAddonListQueryDto,
    createAddonColorDto,
    createAddonDto,
    patchAddonColorDto,
    patchAddonDto,
} from "@/modules/catalog/addons/addon.dto.js";
import { validate } from "@/shared/middlewares/validate.middleware.js";

export function createAddonAdminRouter(addonController: AddonController) {
    const router = Router();
    router.get("/", validate(adminAddonListQueryDto, "query"), addonController.listAdmin);
    router.post("/", validate(createAddonDto), addonController.create);
    router.get("/colors", addonController.listColors);
    router.post("/colors", validate(createAddonColorDto), addonController.createColor);
    router.patch(
        "/colors/:id",
        validate(addonColorIdParamsDto, "params"),
        validate(patchAddonColorDto),
        addonController.patchColor,
    );
    router.get("/:id/city-prices", validate(addonIdParamsDto, "params"), addonController.listPrices);
    router.put(
        "/:id/city-prices",
        validate(addonIdParamsDto, "params"),
        validate(addonCityPriceDto),
        addonController.setPrice,
    );
    router.delete(
        "/:id/city-prices/:cityId",
        validate(addonCityPriceParamsDto, "params"),
        addonController.deletePrice,
    );
    router.get("/:id", validate(addonIdParamsDto, "params"), addonController.getAdmin);
    router.patch(
        "/:id",
        validate(addonIdParamsDto, "params"),
        validate(patchAddonDto),
        addonController.patch,
    );
    return router;
}
