import { ErrorRequestHandler } from "express";
import { logger } from "@/utils/logger.js";
import { ApiError } from "@/shared/errors/apiError.js";

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
    const bodyParseError =
        err instanceof SyntaxError ||
        (typeof err === "object" &&
            err !== null &&
            "type" in err &&
            (err as { type?: string }).type === "entity.parse.failed");
    const operational = (err instanceof ApiError && err.isOperational) || bodyParseError;
    const statusCode = err instanceof ApiError && err.isOperational
        ? err.statusCode
        : bodyParseError
          ? 400
          : 500;
    res.err = err instanceof Error ? err : new Error(String(err));

    const log = req.log ?? logger;
    const payload = {
        err,
        method: req.method,
        path: req.path,
        requestId: req.id,
        statusCode,
    };
    if (statusCode >= 500) {
        log.error(payload, err instanceof Error ? err.message : "unhandled error");
    } else {
        log.warn(payload, err instanceof Error ? err.message : "request failed");
    }

    if (operational) {
        const message =
            err instanceof ApiError ? err.message : "invalid json body";
        const errors = err instanceof ApiError ? err.errors : [];
        return res.status(statusCode).json({
            success: false,
            message,
            ...(err instanceof ApiError && err.code ? { code: err.code } : {}),
            errors,
        });
    }

    res.status(500).json({
        success: false,
        message: "Internal Server Error",
        errors: [],
    });
};