/** Zod body/query/params validation. See docs/project-requriment.md */
import type { RequestHandler } from "express";
import type { ZodType } from "zod";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import { ApiError } from "@/shared/errors/apiError.js";

type ZodTarget = "body" | "query" | "params";

export function validate(schema: ZodType, target: ZodTarget = "body"): RequestHandler {
    return asyncHandler((req, _res, next) => {
        const parsed = schema.safeParse(req[target]);
        if (!parsed.success) {
            throw ApiError.badRequest("validation failed", parsed.error.issues);
        }
        // Express 5: req.query and req.params are getter-only. Body is still writable.
        if (target === "body") {
            req.body = parsed.data as typeof req.body;
        }
        next();
    });
}
