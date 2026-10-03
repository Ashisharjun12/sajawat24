import { Router } from "express";
import {
    addBankPayoutMethodDto,
    addUpiPayoutMethodDto,
    payoutMethodIdParamsDto,
} from "@/modules/payments/payout-methods/payout-method.dto.js";
import type { PayoutMethodController } from "@/modules/payments/payout-methods/payout-method.controller.js";
import { validate } from "@/shared/middlewares/validate.middleware.js";

export function createPayoutMethodRouter(controller: PayoutMethodController): Router {
    const router = Router();
    router.get("/", controller.list);
    router.post("/bank", validate(addBankPayoutMethodDto), controller.addBank);
    router.post("/upi", validate(addUpiPayoutMethodDto), controller.addUpi);
    router.patch(
        "/:id/default",
        validate(payoutMethodIdParamsDto, "params"),
        controller.setDefault,
    );
    router.delete("/:id", validate(payoutMethodIdParamsDto, "params"), controller.remove);
    return router;
}
