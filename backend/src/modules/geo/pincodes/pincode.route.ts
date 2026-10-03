import { Router } from "express";
import type { PincodeController } from "@/modules/geo/pincodes/pincode.controller.js";
import {
    adminPincodeListQueryDto,
    createPincodeDto,
    patchPincodeDto,
    pincodeIdParamsDto,
    resolvePincodeQueryDto,
} from "@/modules/geo/pincodes/pincode.dto.js";
import { validate } from "@/shared/middlewares/validate.middleware.js";

export function createPincodePublicRouter(pincodeController: PincodeController) {
    const router = Router();
    router.get("/resolve", validate(resolvePincodeQueryDto, "query"), pincodeController.resolve);
    return router;
}

export function createPincodeAdminRouter(pincodeController: PincodeController) {
    const router = Router();
    router.get("/", validate(adminPincodeListQueryDto, "query"), pincodeController.listAdmin);
    router.post("/", validate(createPincodeDto), pincodeController.create);
    router.patch(
        "/:id",
        validate(pincodeIdParamsDto, "params"),
        validate(patchPincodeDto),
        pincodeController.patch,
    );
    return router;
}
