/**
 * Public API: startCheckout via IPaymentProvider, verify, ledger, vendor wallet projection.
 */
import {
    AssignmentController,
    AssignmentRepository,
    AssignmentService,
} from "@/modules/assignment/index.js";
import { CartController } from "@/modules/booking/carts/cart.controller.js";
import { CartRepository } from "@/modules/booking/carts/cart.repository.js";
import { createCartRouter } from "@/modules/booking/carts/cart.route.js";
import { CartService } from "@/modules/booking/carts/cart.service.js";
import { carts, cartItems, cartItemAddons } from "@/modules/booking/carts/cart.schema.js";
import { OrderController } from "@/modules/booking/orders/order.controller.js";
import { createOrderAdminRouter } from "@/modules/booking/orders/order.admin.route.js";
import { OrderRepository } from "@/modules/booking/orders/order.repository.js";
import { createOrderRouter } from "@/modules/booking/orders/order.route.js";
import { OrderService } from "@/modules/booking/orders/order.service.js";
import { orders, orderItems, orderItemAddons } from "@/modules/booking/orders/order.schema.js";
import { CustomerProvisioner } from "@/modules/identity/users/customer-provisioner.service.js";
import { UserRepository } from "@/modules/identity/users/user.repository.js";
import { VendorRepository } from "@/modules/identity/vendors/vendor.repository.js";
import { notificationService } from "@/modules/notifications/index.js";
import {
    PaymentIntentController,
    PaymentIntentRepository,
    PaymentIntentService,
    createPaymentIntentRouter,
} from "@/modules/payments/index.js";
import { RealtimeFactory } from "@/infrastructure/realtime/realtime.factory.js";
import { customerReviewService } from "@/modules/reviews/index.js";

const cartRepository = new CartRepository();
const cartService = new CartService(cartRepository);
const cartController = new CartController(cartService);

const orderRepository = new OrderRepository();
const assignmentRepository = new AssignmentRepository();
const vendorRepository = new VendorRepository();

const orderApi: {
    toPublic: OrderService["toPublic"];
    sendBookingConfirmedEmail: OrderService["sendBookingConfirmedEmail"];
} = {
    toPublic: () => {
        throw new Error("order service not initialized");
    },
    sendBookingConfirmedEmail: async () => {},
};

const paymentIntentService = new PaymentIntentService(
    new PaymentIntentRepository(),
    orderRepository,
    notificationService,
    (order) => orderApi.toPublic(order),
    (userId, order) => orderApi.sendBookingConfirmedEmail(userId, order),
);
const customerProvisioner = new CustomerProvisioner(new UserRepository());
const orderServiceWithPayments = new OrderService(
    orderRepository,
    notificationService,
    paymentIntentService,
    assignmentRepository,
    customerProvisioner,
    customerReviewService,
);
orderApi.toPublic = orderServiceWithPayments.toPublic.bind(orderServiceWithPayments);
orderApi.sendBookingConfirmedEmail =
    orderServiceWithPayments.sendBookingConfirmedEmail.bind(orderServiceWithPayments);

const assignmentService = new AssignmentService(
    assignmentRepository,
    orderRepository,
    vendorRepository,
    notificationService,
    RealtimeFactory.getProvider(),
);
const orderController = new OrderController(orderServiceWithPayments);
const assignmentController = new AssignmentController(assignmentService, orderServiceWithPayments);
const paymentIntentController = new PaymentIntentController(paymentIntentService);

export const cartRouter = createCartRouter(cartController);
export const orderRouter = createOrderRouter(orderController);
export const orderAdminRouter = createOrderAdminRouter(orderController, assignmentController);
export const paymentIntentRouter = createPaymentIntentRouter(paymentIntentController);

export { carts, cartItems, cartItemAddons, orders, orderItems, orderItemAddons };
