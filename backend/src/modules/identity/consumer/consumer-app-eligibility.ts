import { ApiError } from "@/shared/errors/apiError.js";
import type { UserRole } from "@/modules/identity/users/user.schema.js";

export const CONSUMER_APP_CODES = {
    USE_ADMIN_PORTAL: "USE_ADMIN_PORTAL",
    CONSUMER_APP_FORBIDDEN: "CONSUMER_APP_FORBIDDEN",
} as const;

const CONSUMER_APP_ROLES = new Set<UserRole>(["user", "vendor", "vendor_staff"]);

export function isConsumerAppEligible(role: UserRole | undefined): boolean {
    return role != null && CONSUMER_APP_ROLES.has(role);
}

function consumerForbidden(message: string, code: string): ApiError {
    const err = ApiError.forbidden(message);
    err.code = code;
    return err;
}

export function assertConsumerAppEligible(role: UserRole): void {
    if (role === "admin") {
        throw consumerForbidden("use the admin portal to sign in", CONSUMER_APP_CODES.USE_ADMIN_PORTAL);
    }
    if (!isConsumerAppEligible(role)) {
        throw consumerForbidden("this account cannot use the consumer app", CONSUMER_APP_CODES.CONSUMER_APP_FORBIDDEN);
    }
}
