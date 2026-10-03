import { ApiError } from "@/shared/errors/apiError.js";
import type { PublicUser } from "@/modules/identity/auth/auth.service.js";
import type { VendorMemberRepository } from "@/modules/identity/vendor-members/vendor-member.repository.js";
import type { VendorRepository } from "@/modules/identity/vendors/vendor.repository.js";
import type { IUserService } from "@/modules/identity/users/user.service.js";
import { resolvePartnerCapabilities } from "@/modules/identity/partner/partner-context.js";
import type { User } from "@/modules/identity/users/user.schema.js";

export const PARTNER_LOGIN_CODES = {
    USE_STAFF_LOGIN: "USE_STAFF_LOGIN",
    USE_OWNER_LOGIN: "USE_OWNER_LOGIN",
    PARTNER_LOGIN_NOT_FOUND: "PARTNER_LOGIN_NOT_FOUND",
    LOGIN_INTENT_REQUIRED: "LOGIN_INTENT_REQUIRED",
    SHOP_NOT_ACTIVE: "SHOP_NOT_ACTIVE",
} as const;

export type PartnerLoginIntent = "owner" | "staff";

function partnerForbidden(message: string, code: string): ApiError {
    const err = ApiError.forbidden(message);
    err.code = code;
    return err;
}

function partnerBadRequest(message: string, code: string): ApiError {
    const err = ApiError.badRequest(message);
    err.code = code;
    return err;
}

export function assertPartnerLoginIntentOnProfile(
    loginIntent: PartnerLoginIntent,
    profile: PublicUser,
): void {
    if (loginIntent === "staff") {
        if (profile.role === "vendor" && profile.vendor) {
            throw partnerForbidden(
                "use vendor partner login for this account",
                PARTNER_LOGIN_CODES.USE_OWNER_LOGIN,
            );
        }
        if (profile.role !== "vendor_staff" || !profile.partnerMembership) {
            throw partnerForbidden(
                "no staff account for this phone. ask your shop owner to add you in team",
                PARTNER_LOGIN_CODES.PARTNER_LOGIN_NOT_FOUND,
            );
        }
        return;
    }
    if (profile.role === "vendor_staff" && !profile.capabilities.isShopOwner) {
        throw partnerForbidden("use staff login for this account", PARTNER_LOGIN_CODES.USE_STAFF_LOGIN);
    }
    if (profile.role !== "vendor" || !profile.vendor) {
        throw partnerForbidden(
            "no vendor partner account for this phone. register your shop or use staff login",
            PARTNER_LOGIN_CODES.USE_OWNER_LOGIN,
        );
    }
}

async function buildPublicProfile(
    user: User,
    vendorRepo: VendorRepository,
    memberRepo: VendorMemberRepository,
): Promise<PublicUser> {
    const vendor =
        user.role === "vendor" ? await vendorRepo.findPublicProfileByUserId(user.id) : undefined;
    const { capabilities, membership } = await resolvePartnerCapabilities(
        user.id,
        user.role,
        vendorRepo,
        memberRepo,
    );
    return {
        id: user.id,
        phone: user.phone,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role,
        status: user.status,
        ...(user.role === "admin" && user.mustChangePassword
            ? { mustChangePassword: Boolean(user.mustChangePassword) }
            : {}),
        linkedGoogle: Boolean(user.googleId),
        vendor,
        partnerMembership: membership,
        capabilities,
    };
}

export async function assertPartnerLoginEligibleForPhone(
    phone: string,
    loginIntent: PartnerLoginIntent,
    deps: {
        users: IUserService;
        vendorRepo: VendorRepository;
        memberRepo: VendorMemberRepository;
    },
): Promise<void> {
    const user = await deps.users.findByPhone(phone);
    if (!user) {
        if (loginIntent === "staff") {
            const invite = await deps.memberRepo.findInvitedByPhone(phone);
            if (!invite) {
                throw partnerForbidden(
                    "no staff account for this phone. ask your shop owner to add you in team",
                    PARTNER_LOGIN_CODES.PARTNER_LOGIN_NOT_FOUND,
                );
            }
            const vendor = await deps.vendorRepo.findById(invite.vendorId);
            if (!vendor || vendor.onboardingStatus !== "ACTIVE") {
                throw partnerForbidden("shop is not active", PARTNER_LOGIN_CODES.SHOP_NOT_ACTIVE);
            }
            return;
        }
        throw partnerForbidden(
            "no vendor partner account for this phone. register your shop or use staff login",
            PARTNER_LOGIN_CODES.PARTNER_LOGIN_NOT_FOUND,
        );
    }

    const profile = await buildPublicProfile(user, deps.vendorRepo, deps.memberRepo);
    assertPartnerLoginIntentOnProfile(loginIntent, profile);
}

export function requirePartnerLoginIntentForSignIn(
    partnerSignIn: boolean | undefined,
    loginIntent: PartnerLoginIntent | undefined,
): PartnerLoginIntent | undefined {
    if (!partnerSignIn) {
        return loginIntent;
    }
    if (!loginIntent) {
        throw partnerBadRequest(
            "login intent is required for partner sign in",
            PARTNER_LOGIN_CODES.LOGIN_INTENT_REQUIRED,
        );
    }
    return loginIntent;
}
