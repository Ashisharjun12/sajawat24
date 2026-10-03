import { AdminAccountController } from "@/modules/identity/admin-account/admin-account.controller.js";
import { AdminAccountService } from "@/modules/identity/admin-account/admin-account.service.js";
import { AdminEmailChangeRepository } from "@/modules/identity/admin-account/admin-email-change.repository.js";
import { createAdminAccountRouter } from "@/modules/identity/admin-account/admin-account.route.js";
import { AuthController } from "@/modules/identity/auth/auth.controller.js";
import { AuthService } from "@/modules/identity/auth/auth.service.js";
import { createAuthRouter } from "@/modules/identity/auth/auth.route.js";
import { SessionRepository } from "@/modules/identity/sessions/session.repository.js";
import { sessions } from "@/modules/identity/sessions/session.schema.js";
import { SessionService } from "@/modules/identity/sessions/session.service.js";
import { UserController } from "@/modules/identity/users/user.controller.js";
import { UserRepository } from "@/modules/identity/users/user.repository.js";
import { createUserRouter } from "@/modules/identity/users/user.route.js";
import { users } from "@/modules/identity/users/user.schema.js";
import { UserService } from "@/modules/identity/users/user.service.js";
import { CustomerAdminController } from "@/modules/identity/customers/customer.admin.controller.js";
import { CustomerRepository } from "@/modules/identity/customers/customer.repository.js";
import { CustomerService } from "@/modules/identity/customers/customer.service.js";
import { createCustomerAdminRouter } from "@/modules/identity/customers/customer.route.js";
import { CustomerAddressController } from "@/modules/identity/addresses/customer-address.controller.js";
import { CustomerAddressService } from "@/modules/identity/addresses/customer-address.service.js";
import { RefundRequestController } from "@/modules/booking/refunds/refund-request.controller.js";
import { RefundRequestService } from "@/modules/booking/refunds/refund-request.service.js";
import {
    VendorAdminController,
    VendorController,
} from "@/modules/identity/vendors/vendor.controller.js";
import { VendorRepository } from "@/modules/identity/vendors/vendor.repository.js";
import {
    createVendorAdminRouter,
    createVendorRouter,
} from "@/modules/identity/vendors/vendor.route.js";
import { vendors } from "@/modules/identity/vendors/vendor.schema.js";
import { VendorService } from "@/modules/identity/vendors/vendor.service.js";
import { VendorTeamController } from "@/modules/identity/vendor-members/vendor-team.controller.js";
import { VendorTeamService } from "@/modules/identity/vendor-members/vendor-team.service.js";
import { VendorMemberRepository } from "@/modules/identity/vendor-members/vendor-member.repository.js";
import {
    AssignmentRepository,
    VendorJobController,
    VendorJobRepository,
    VendorJobService,
} from "@/modules/assignment/index.js";
import { OrderRepository } from "@/modules/booking/orders/order.repository.js";
import { OrderService } from "@/modules/booking/orders/order.service.js";
import {
    notificationService,
    userNotificationController,
    vendorNotificationController,
} from "@/modules/notifications/index.js";
import {
    CollectionController,
    PaymentIntentRepository,
    PaymentIntentService,
    WalletController,
    PayoutMethodController,
    collectionService,
    walletService,
} from "@/modules/payments/index.js";
import { mediaService } from "@/modules/upload/index.js";
import { bookingChatService } from "@/modules/chat/index.js";
import { RealtimeFactory } from "@/infrastructure/realtime/realtime.factory.js";
import { registerDispatchModule } from "@/modules/dispatch/register-dispatch-module.js";
import { VendorPresenceController } from "@/modules/dispatch/presence/vendor-presence.controller.js";
import { VendorPresenceService } from "@/modules/dispatch/presence/vendor-presence.service.js";
import { settingService } from "@/modules/ops/index.js";

const userRepository = new UserRepository();
const vendorRepository = new VendorRepository();
const sessionRepository = new SessionRepository();

const userService = new UserService(userRepository);
const sessionService = new SessionService(sessionRepository, userRepository);
const vendorService = new VendorService(vendorRepository, mediaService, userService, sessionService);
const authService = new AuthService(
    userService,
    vendorService,
    sessionService,
    notificationService,
    settingService,
);
const adminAccountService = new AdminAccountService(userRepository, new AdminEmailChangeRepository());
const adminAccountController = new AdminAccountController(adminAccountService);
const authController = new AuthController(authService);
const userController = new UserController(authService);
const vendorController = new VendorController(authService, vendorService);
const vendorAdminController = new VendorAdminController(vendorService);
const customerRepository = new CustomerRepository();
const customerService = new CustomerService(customerRepository);
const customerAdminController = new CustomerAdminController(customerService);
const customerAddressService = new CustomerAddressService();
const customerAddressController = new CustomerAddressController(customerAddressService);
const refundRequestService = new RefundRequestService();
const refundRequestController = new RefundRequestController(refundRequestService);

const orderRepository = new OrderRepository();
const assignmentRepository = new AssignmentRepository();
const paymentIntentService = new PaymentIntentService(
    new PaymentIntentRepository(),
    orderRepository,
    notificationService,
    () => {
        throw new Error("order service not initialized");
    },
    async () => {},
);
const orderServiceForVendorJobs = new OrderService(
    orderRepository,
    notificationService,
    paymentIntentService,
    assignmentRepository,
);
const vendorJobService = new VendorJobService(
    new VendorJobRepository(),
    vendorRepository,
    assignmentRepository,
    orderRepository,
    notificationService,
    (orderId) => orderServiceForVendorJobs.getForAdmin(orderId),
    userRepository,
    bookingChatService,
    RealtimeFactory.getProvider(),
);
const vendorJobController = new VendorJobController(vendorJobService);

registerDispatchModule();

const vendorPresenceService = new VendorPresenceService(vendorRepository);
const vendorPresenceController = new VendorPresenceController(vendorPresenceService);
const vendorTeamService = new VendorTeamService(
    new VendorMemberRepository(),
    vendorRepository,
    userService,
    sessionService,
);
const vendorTeamController = new VendorTeamController(vendorTeamService);
const collectionController = new CollectionController(collectionService);
const walletController = new WalletController(walletService);
const payoutMethodController = new PayoutMethodController();

export const authRouter = createAuthRouter(authController, adminAccountController);
export const adminAccountAdminRouter = createAdminAccountRouter(adminAccountController);
export const userRouter = createUserRouter(
    authController,
    userController,
    userNotificationController,
    customerAddressController,
    refundRequestController,
);
export const vendorRouter = createVendorRouter(
    vendorController,
    vendorNotificationController,
    vendorJobController,
    collectionController,
    walletController,
    payoutMethodController,
    vendorTeamController,
    vendorPresenceController,
);
export const vendorAdminRouter = createVendorAdminRouter(vendorAdminController);
export const customerAdminRouter = createCustomerAdminRouter(customerAdminController);
export { users, vendors, sessions };
