import { ApiError } from "@/shared/errors/apiError.js";
import type { IVendorRepository } from "@/modules/identity/vendors/vendor.repository.js";
import type { IVendorMemberRepository } from "@/modules/identity/vendor-members/vendor-member.repository.js";
import type { VendorMemberKind } from "@/modules/identity/vendor-members/vendor-member.schema.js";
import type { UserRole } from "@/modules/identity/users/user.schema.js";

export type PartnerMode = "owner" | "field";

export type PartnerContext = {
    userId: string;
    role: UserRole;
    vendorId: string;
    mode: PartnerMode;
    memberId: string;
    memberKind: VendorMemberKind;
    isShopOwner: boolean;
};

export type PartnerCapabilities = {
    isShopOwner: boolean;
    isFieldWorker: boolean;
    canSwitchToFieldMode: boolean;
};

export type PublicPartnerMembership = {
    vendorId: string;
    memberId: string;
    kind: VendorMemberKind;
    shopName?: string;
};

export async function resolvePartnerCapabilities(
    userId: string,
    role: UserRole,
    vendors: IVendorRepository,
    members: IVendorMemberRepository,
): Promise<{
    capabilities: PartnerCapabilities;
    membership?: PublicPartnerMembership;
    vendorId?: string;
}> {
    const ownedVendor = role === "vendor" ? await vendors.findByUserId(userId) : undefined;
    const isShopOwner = Boolean(ownedVendor?.onboardingStatus === "ACTIVE");

    let activeMember =
        role === "vendor_staff" ? await members.findActiveByUserId(userId) : undefined;

    if (isShopOwner && ownedVendor) {
        const ownerMember = await members.findActiveMembershipForUserOnVendor(
            userId,
            ownedVendor.id,
        );
        if (ownerMember) {
            activeMember = ownerMember;
        }
    }

    const isFieldWorker = Boolean(activeMember);
    const canSwitchToFieldMode = isShopOwner && isFieldWorker;

    return {
        capabilities: {
            isShopOwner,
            isFieldWorker,
            canSwitchToFieldMode,
        },
        membership: activeMember
            ? {
                  vendorId: activeMember.vendorId,
                  memberId: activeMember.id,
                  kind: activeMember.kind,
              }
            : undefined,
        vendorId: ownedVendor?.id ?? activeMember?.vendorId,
    };
}

export async function loadPartnerContext(
    userId: string,
    role: UserRole,
    modeHeader: string | undefined,
    vendors: IVendorRepository,
    members: IVendorMemberRepository,
): Promise<PartnerContext> {
    const ownedVendor = role === "vendor" ? await vendors.findByUserId(userId) : undefined;
    const isShopOwner = Boolean(ownedVendor);

    if (role === "vendor_staff") {
        const member = await members.findActiveByUserId(userId);
        if (!member) {
            throw ApiError.forbidden("staff membership not found");
        }
        const vendor = await vendors.findById(member.vendorId);
        if (!vendor || vendor.onboardingStatus !== "ACTIVE") {
            throw ApiError.forbidden("shop is not active");
        }
        if (modeHeader === "owner") {
            throw ApiError.forbidden("staff cannot use owner mode");
        }
        return {
            userId,
            role,
            vendorId: member.vendorId,
            mode: "field",
            memberId: member.id,
            memberKind: member.kind,
            isShopOwner: false,
        };
    }

    if (role === "vendor" && ownedVendor) {
        if (ownedVendor.onboardingStatus !== "ACTIVE") {
            throw ApiError.forbidden("vendor account is not active");
        }
        const requestedMode: PartnerMode = modeHeader === "field" ? "field" : "owner";
        if (requestedMode === "owner") {
            const ownerMember = await members.findOwnerMemberForVendor(ownedVendor.id);
            const memberId = ownerMember?.id;
            if (!memberId) {
                throw ApiError.forbidden("owner membership missing");
            }
            return {
                userId,
                role,
                vendorId: ownedVendor.id,
                mode: "owner",
                memberId,
                memberKind: "OWNER",
                isShopOwner: true,
            };
        }
        const member =
            await members.findActiveMembershipForUserOnVendor(userId, ownedVendor.id) ??
            (await members.findOwnerMemberForVendor(ownedVendor.id));
        if (!member || member.status !== "active") {
            throw ApiError.forbidden("field membership required");
        }
        return {
            userId,
            role,
            vendorId: ownedVendor.id,
            mode: "field",
            memberId: member.id,
            memberKind: member.kind,
            isShopOwner: true,
        };
    }

    throw ApiError.forbidden("partner access required");
}
