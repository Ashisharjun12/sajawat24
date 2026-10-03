import pino from "pino";
import { _config } from "@/config/config.js";

const isDev = _config.NODE_ENV === "development";

export function serializeErr(err: unknown) {
    const serialized = pino.stdSerializers.err(err as Error);
    if (!err || typeof err !== "object") return serialized;
    const extra = err as Record<string, unknown>;
    return {
        ...serialized,
        ...(typeof extra.code === "string" ? { code: extra.code } : {}),
        ...(typeof extra.detail === "string" ? { detail: extra.detail } : {}),
        ...(typeof extra.constraint === "string" ? { constraint: extra.constraint } : {}),
        ...(typeof extra.table === "string" ? { table: extra.table } : {}),
        ...(typeof extra.severity === "string" ? { severity: extra.severity } : {}),
    };
}

export const logger = pino({
    level: isDev ? "debug" : "info",
    serializers: {
        err: serializeErr,
        error: serializeErr,
        req: pino.stdSerializers.req,
        res: pino.stdSerializers.res,
    },
    ...(isDev && {
        transport: {
            target: "pino-pretty",
            options: {
                colorize: true,
                translateTime: "SYS:dd-mm-yyyy HH:MM:ss",
                ignore: "pid,hostname",
                singleLine: false,
            },
        },
    }),
});