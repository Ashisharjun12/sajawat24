import { DispatchService } from "@/modules/dispatch/dispatch.service.js";
import type { IAssignmentRepository } from "@/modules/assignment/assignments/assignment.repository.js";
import type { IOrderRepository } from "@/modules/booking/orders/order.repository.js";
import type { IVendorRepository } from "@/modules/identity/vendors/vendor.repository.js";
import type { INotificationService } from "@/modules/notifications/notification.service.js";

let dispatchService: DispatchService | null = null;

export type DispatchModuleDeps = {
    orderRepo: IOrderRepository;
    assignments: IAssignmentRepository;
    vendorRepo: IVendorRepository;
    notifications: INotificationService;
    reloadOrder: (orderId: string) => Promise<{
        reference: string;
        scheduledAt: string;
        delivery: { address: string };
        id: string;
    }>;
};

export function initDispatchModule(deps: DispatchModuleDeps): void {
    dispatchService = new DispatchService(
        deps.orderRepo,
        deps.assignments,
        deps.vendorRepo,
        deps.notifications,
        deps.reloadOrder,
    );
}

export function getDispatchService(): DispatchService {
    if (!dispatchService) {
        throw new Error("dispatch module not initialized");
    }
    return dispatchService;
}
