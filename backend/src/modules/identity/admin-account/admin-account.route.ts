import { Router } from "express";
import type { AdminAccountController } from "@/modules/identity/admin-account/admin-account.controller.js";
import {
    changeAdminEmailDto,
    changeAdminPasswordDto,
    patchAdminAccountProfileDto,
} from "@/modules/identity/admin-account/admin-account.dto.js";
import { validate } from "@/shared/middlewares/validate.middleware.js";

export function createAdminAccountRouter(controller: AdminAccountController) {
    const router = Router();
    router.get("/", controller.getAccount);
    router.patch("/profile", validate(patchAdminAccountProfileDto), controller.patchProfile);
    router.post("/change-password", validate(changeAdminPasswordDto), controller.changePassword);
    router.post("/change-email", validate(changeAdminEmailDto), controller.changeEmail);
    router.post("/skip-password-setup", controller.skipPasswordSetup);
    return router;
}
