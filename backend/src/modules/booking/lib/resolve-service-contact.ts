import type { IAssignmentRepository } from "@/modules/assignment/assignments/assignment.repository.js";
import type { IOrderFieldAssignmentRepository } from "@/modules/assignment/field-assignments/order-field-assignment.repository.js";
import type { IVendorRepository } from "@/modules/identity/vendors/vendor.repository.js";
import type { IUserRepository } from "@/modules/identity/users/user.repository.js";

export type PublicServiceContact = {
    kind: "worker" | "shop";
    name: string;
    phone: string | null;
    shopName?: string | null;
    /** Shop / vendor support line (shown alongside worker during active trip). */
    vendorPhone?: string | null;
    vendorName?: string | null;
};

const ACTIVE_TRIP_STATUSES = new Set(["ASSIGNED", "EN_ROUTE", "ON_SITE"]);

function shopContactFields(shopName: string | null, shopPhone: string | null) {
    return {
        kind: "shop" as const,
        name: shopName ?? "Your decorator",
        phone: shopPhone,
        shopName,
        vendorPhone: shopPhone,
        vendorName: shopName,
    };
}

export async function resolveServiceContact(
    orderId: string,
    orderStatus: string,
    deps: {
        assignments: IAssignmentRepository;
        fieldAssignments: IOrderFieldAssignmentRepository;
        vendors: IVendorRepository;
        users: IUserRepository;
    },
): Promise<PublicServiceContact | null> {
    const assignment = await deps.assignments.findActiveByOrderId(orderId);
    if (!assignment) return null;

    const vendor = await deps.vendors.findById(assignment.vendorId);
    if (!vendor) return null;

    const shopDetail = await deps.vendors.findAdminDetail(vendor.id);
    const shopUser = await deps.users.findById(vendor.userId);
    const shopName = shopDetail?.name ?? shopUser?.name ?? null;
    const shopPhone = shopDetail?.phone ?? shopUser?.phone ?? null;

    if (orderStatus === "COMPLETED") {
        return shopContactFields(shopName, shopPhone);
    }

    if (ACTIVE_TRIP_STATUSES.has(orderStatus)) {
        const fieldRows = await deps.fieldAssignments.listForOrder(assignment.vendorId, orderId);
        const worker = fieldRows[0];
        if (worker?.userId) {
            const workerUser = await deps.users.findById(worker.userId);
            return {
                kind: "worker",
                name: worker.displayName || workerUser?.name || "Your decorator",
                phone: workerUser?.phone ?? null,
                shopName,
                vendorPhone: shopPhone,
                vendorName: shopName,
            };
        }
    }

    return shopContactFields(shopName, shopPhone);
}
