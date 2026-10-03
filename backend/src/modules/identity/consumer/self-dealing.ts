import type { IVendorMemberRepository } from "@/modules/identity/vendor-members/vendor-member.repository.js";
import type { IVendorRepository } from "@/modules/identity/vendors/vendor.repository.js";

export const SELF_DEALING_CODE = "SELF_DEALING_NOT_ALLOWED";

export async function isOrderCustomerConflictWithVendor(
    orderUserId: string,
    vendorId: string,
    deps: {
        vendors: IVendorRepository;
        members: IVendorMemberRepository;
    },
): Promise<boolean> {
    const vendor = await deps.vendors.findById(vendorId);
    if (!vendor) {
        return false;
    }
    if (vendor.userId === orderUserId) {
        return true;
    }
    const membership = await deps.members.findActiveMembershipForUserOnVendor(orderUserId, vendorId);
    return Boolean(membership);
}
