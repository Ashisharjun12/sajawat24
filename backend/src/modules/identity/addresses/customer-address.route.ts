import { Router } from "express";
import type { CustomerAddressController } from "@/modules/identity/addresses/customer-address.controller.js";
import {
    createCustomerAddressDto,
    customerAddressIdParamsDto,
    patchCustomerAddressDto,
} from "@/modules/identity/addresses/customer-address.dto.js";
import { authRequired } from "@/shared/middlewares/auth.middleware.js";
import { validate } from "@/shared/middlewares/validate.middleware.js";

export function createCustomerAddressRouter(controller: CustomerAddressController) {
    const router = Router();
    router.use(authRequired);
    router.get("/", controller.list);
    router.post("/", validate(createCustomerAddressDto), controller.create);
    router.patch(
        "/:id",
        validate(customerAddressIdParamsDto, "params"),
        validate(patchCustomerAddressDto),
        controller.patch,
    );
    router.delete(
        "/:id",
        validate(customerAddressIdParamsDto, "params"),
        controller.remove,
    );
    router.post(
        "/:id/default",
        validate(customerAddressIdParamsDto, "params"),
        controller.setDefault,
    );
    return router;
}
