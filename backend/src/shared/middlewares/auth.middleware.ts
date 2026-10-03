import type { RequestHandler } from "express";
import { ApiError } from "@/shared/errors/apiError.js";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import { verifyAccessToken } from "@/modules/identity/sessions/session.service.js";
import { UserRepository } from "@/modules/identity/users/user.repository.js";

const users = new UserRepository();

export const authRequired: RequestHandler = asyncHandler(async (req, _res, next) => {
    const header = req.headers.authorization;
    if (!header?.startsWith("Bearer ")) {
        throw ApiError.unauthorized("missing authorization header");
    }
    const payload = verifyAccessToken(header.slice(7));
    const user = await users.findById(payload.sub);
    if (!user) {
        throw ApiError.unauthorized("user not found");
    }
    if (user.status === "blocked") {
        throw ApiError.forbidden("account blocked");
    }
    req.actor = { id: user.id, role: user.role };
    next();
});

export const authOptional: RequestHandler = asyncHandler(async (req, _res, next) => {
    const header = req.headers.authorization;
    if (header?.startsWith("Bearer ")) {
        try {
            const payload = verifyAccessToken(header.slice(7));
            const user = await users.findById(payload.sub);
            if (user && user.status !== "blocked") {
                req.actor = { id: user.id, role: user.role };
            }
        } catch {
            // optional: ignore invalid token
        }
    }
    next();
});
