import { AssignmentRepository } from "@/modules/assignment/assignments/assignment.repository.js";
import { OrderRepository } from "@/modules/booking/orders/order.repository.js";
import { OrderService } from "@/modules/booking/orders/order.service.js";
import { initDispatchModule } from "@/modules/dispatch/index.js";
import { VendorRepository } from "@/modules/identity/vendors/vendor.repository.js";
import { notificationService } from "@/modules/notifications/index.js";
import {
    PaymentIntentRepository,
    PaymentIntentService,
} from "@/modules/payments/index.js";

let registered = false;

/** Wire DispatchService for API and BullMQ worker (instant auto-dispatch). */
export function registerDispatchModule(): void {
    if (registered) return;

    const orderRepository = new OrderRepository();
    const assignmentRepository = new AssignmentRepository();
    const vendorRepository = new VendorRepository();
    const paymentIntentService = new PaymentIntentService(
        new PaymentIntentRepository(),
        orderRepository,
        notificationService,
        () => {
            throw new Error("order service not initialized");
        },
        async () => {},
    );
    const orderServiceForDispatch = new OrderService(
        orderRepository,
        notificationService,
        paymentIntentService,
        assignmentRepository,
    );

    initDispatchModule({
        orderRepo: orderRepository,
        assignments: assignmentRepository,
        vendorRepo: vendorRepository,
        notifications: notificationService,
        reloadOrder: async (orderId) => {
            const order = await orderServiceForDispatch.getForAdmin(orderId);
            return {
                id: order.id,
                reference: order.reference,
                scheduledAt: order.scheduledAt,
                delivery: { address: order.delivery.address },
            };
        },
    });

    registered = true;
}
