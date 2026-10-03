import { pinoHttp } from "pino-http";
import { v4 as uuidv4 } from "uuid";
import { logger, serializeErr } from "@/utils/logger.js";

export const httpLogger = pinoHttp({
    logger,
    genReqId: () => uuidv4(),
    customLogLevel: (_req, res, err) => {
        if (err || res.statusCode >= 500) return "error";
        if (res.statusCode >= 400) return "warn";
        return "info";
    },
    customSuccessMessage: (req, res) => `${req.method} ${req.url} ${res.statusCode}`,
    customErrorMessage: (req, res, err) =>
        `${req.method} ${req.url} ${res.statusCode} ${err?.message ?? "request failed"}`,
    customProps: (req, res) => ({
        requestId: req.id,
        statusCode: res.statusCode,
    }),
    serializers: {
        err: serializeErr,
        req: (req) => ({
            id: req.id,
            method: req.method,
            url: req.url,
        }),
        res: (res) => ({
            statusCode: res.statusCode,
        }),
    },
    redact: ["req.headers.authorization", "req.body.password"],
});