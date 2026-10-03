import type { RequestHandler } from "express";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import { ApiError } from "@/shared/errors/apiError.js";
import type { UserRole } from "@/modules/identity/users/user.schema.js";

export function requireRole(...roles: UserRole[]): RequestHandler {
    return asyncHandler((req, _res, next) => {
        const role = req.actor?.role;
        if (!role || !roles.includes(role)) {
            throw ApiError.forbidden("insufficient role");
        }
        next();
    });
}
