import { Router } from "express";
import type { AuthController } from "@/modules/identity/auth/auth.controller.js";
import {
    adminLoginDto,
    googleLoginDto,
    otpRequestDto,
    otpVerifyDto,
    refreshDto,
} from "@/modules/identity/auth/auth.dto.js";
import { authRequired } from "@/shared/middlewares/auth.middleware.js";
import { validate } from "@/shared/middlewares/validate.middleware.js";
import type { AdminAccountController } from "@/modules/identity/admin-account/admin-account.controller.js";
import { verifyEmailChangeQueryDto } from "@/modules/identity/admin-account/admin-account.dto.js";

export function createAuthRouter(
    authController: AuthController,
    adminAccountController?: AdminAccountController,
) {
    const router = Router();
    router.post("/otp/request", validate(otpRequestDto), authController.requestOtp);
    router.post("/otp/verify", validate(otpVerifyDto), authController.verifyOtp);
    router.post("/google", validate(googleLoginDto), authController.google);
    router.post("/admin/login", validate(adminLoginDto), authController.adminLogin);
    router.post("/refresh", validate(refreshDto), authController.refresh);
    router.post("/logout", authController.logout);
    router.get("/me", authRequired, authController.me);
    if (adminAccountController) {
        router.get(
            "/verify-email-change",
            validate(verifyEmailChangeQueryDto, "query"),
            adminAccountController.verifyEmailChange,
        );
    }
    return router;
}
