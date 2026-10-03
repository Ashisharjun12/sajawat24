import { Router } from "express";
import type { CustomerAdminController } from "@/modules/identity/customers/customer.admin.controller.js";
import {
    adminCustomerIdParamsDto,
    adminCustomerListQueryDto,
    adminCustomerPatchDto,
} from "@/modules/identity/customers/customer.dto.js";
import { validate } from "@/shared/middlewares/validate.middleware.js";

export function createCustomerAdminRouter(controller: CustomerAdminController) {
    const router = Router();
    router.get("/", validate(adminCustomerListQueryDto, "query"), controller.list);
    router.get("/:id", validate(adminCustomerIdParamsDto, "params"), controller.get);
    router.patch(
        "/:id",
        validate(adminCustomerIdParamsDto, "params"),
        validate(adminCustomerPatchDto),
        controller.patch,
    );
    return router;
}
