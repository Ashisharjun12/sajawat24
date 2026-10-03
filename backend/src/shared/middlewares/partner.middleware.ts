import type { RequestHandler } from "express";
import { asyncHandler } from "@/shared/middlewares/asyncHandler.js";
import { ApiError } from "@/shared/errors/apiError.js";
import { VendorRepository } from "@/modules/identity/vendors/vendor.repository.js";
import { VendorMemberRepository } from "@/modules/identity/vendor-members/vendor-member.repository.js";
import { loadPartnerContext } from "@/modules/identity/partner/partner-context.js";
import type { UserRole } from "@/modules/identity/users/user.schema.js";

const vendors = new VendorRepository();
const members = new VendorMemberRepository();

const PARTNER_ROLES: UserRole[] = ["vendor", "vendor_staff"];

export const requirePartnerRole: RequestHandler = asyncHandler((req, _res, next) => {
    const role = req.actor?.role;
    if (!role || !PARTNER_ROLES.includes(role)) {
        throw ApiError.forbidden("insufficient role");
    }
    next();
});

function modeHeader(req: { headers: Record<string, string | string[] | undefined> }): string | undefined {
    const raw = req.headers["x-decory-partner-mode"];
    if (typeof raw === "string") return raw.toLowerCase();
    if (Array.isArray(raw)) return raw[0]?.toLowerCase();
    return undefined;
}

export const attachPartnerContext: RequestHandler = asyncHandler(async (req, _res, next) => {
    if (!req.actor?.id || !req.actor.role) {
        throw ApiError.unauthorized("authentication required");
    }
    const role = req.actor.role;
    if (role !== "vendor" && role !== "vendor_staff") {
        throw ApiError.forbidden("partner access required");
    }
    req.partner = await loadPartnerContext(
        req.actor.id,
        role,
        modeHeader(req),
        vendors,
        members,
    );
    next();
});

export const requireOwnerMode: RequestHandler = asyncHandler((req, _res, next) => {
    const partner = req.partner;
    if (!partner) {
        throw ApiError.forbidden("partner context required");
    }
    if (partner.mode !== "owner" || !partner.isShopOwner) {
        throw ApiError.forbidden("owner mode required");
    }
    next();
});
