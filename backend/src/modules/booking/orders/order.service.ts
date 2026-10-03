import { randomBytes } from "node:crypto";
import { eq, inArray } from "drizzle-orm";
import { db } from "@/db/postgres-client.js";
import { ApiError } from "@/shared/errors/apiError.js";
import { addons } from "@/modules/catalog/addons/addon.schema.js";
import { displayUrl } from "@/modules/upload/media/media.public.js";
import { uploads } from "@/modules/upload/media/media.schema.js";
import { getProductForCity, priceQuote } from "@/modules/catalog/index.js";
import { getCompletedUpload } from "@/modules/upload/index.js";
import { resolveAdminCustomProductId } from "@/modules/booking/orders/admin-custom-product.js";
import { AddonRepository } from "@/modules/catalog/addons/addon.repository.js";
import { CartRepository } from "@/modules/booking/carts/cart.repository.js";
import type { AdminCreateOrderInput } from "@/modules/booking/orders/order.admin.dto.js";
import type {
    AdminOrderListQuery,
    CreateOrderInput,
    ListOrdersQuery,
} from "@/modules/booking/orders/order.dto.js";
import type { CustomerProvisioner } from "@/modules/identity/users/customer-provisioner.service.js";
import type {
    AdminOrderListFilter,
    IOrderRepository,
    OrderInsertPayload,
    OrderItemInsert,
} from "@/modules/booking/orders/order.repository.js";
import type { OrderWithItems } from "@/modules/booking/orders/order.repository.js";
import {
    ORDER_STATUSES,
    type OrderStatus,
} from "@/modules/booking/domain/order-status.js";
import {
    assertAcceptingBookings,
    assertBookableSlot,
} from "@/modules/booking/slots/slot.service.js";
import {
    assertInstantMarketplaceAllowed,
    inferCartFulfillment,
    instantScheduledAt,
} from "@/modules/booking/lib/instant-fulfillment.js";
import { DispatchOfferRepository } from "@/modules/dispatch/offers/dispatch-offer.repository.js";
import { buildOrderTracking } from "@/modules/dispatch/tracking/tracking.service.js";
import type { PublicOrderTracking } from "@/modules/dispatch/tracking/tracking.service.js";
import { buildOrderTripRoute } from "@/modules/maps/order-route.service.js";
import type { RouteResult } from "@/modules/maps/maps.types.js";
import { scheduleBookingReminders } from "@/modules/assignment/jobs/assignment-reminder.service.js";
import { assertDeliveryLocation, getActiveCityById } from "@/modules/geo/index.js";
import { parsePagination, type Paginated } from "@/shared/http/pagination.js";
import type { INotificationService } from "@/modules/notifications/notification.service.js";
import { bookingTrackUrl } from "@/modules/notifications/lib/render.js";
import { settingService } from "@/modules/ops/index.js";
import { activeOnlineProvider } from "@/modules/ops/settings/payment-methods.js";
import type { IAssignmentRepository } from "@/modules/assignment/assignments/assignment.repository.js";
import { OrderFieldAssignmentRepository } from "@/modules/assignment/field-assignments/order-field-assignment.repository.js";
import {
    resolveServiceContact,
    type PublicServiceContact,
} from "@/modules/booking/lib/resolve-service-contact.js";
import { VendorRepository } from "@/modules/identity/vendors/vendor.repository.js";
import { UserRepository } from "@/modules/identity/users/user.repository.js";
import type { CheckoutPayload, IPaymentIntentService } from "@/modules/payments/intents/payment-intent.service.js";
import { orderFinancialService } from "@/modules/payments/order-financials/order-financial.service.js";
import { promotionService } from "@/modules/promotions/index.js";
import type { PromotionLine } from "@/modules/promotions/promotion.service.js";
import { orderPayablePaise } from "@/modules/booking/orders/order-totals.js";
import { hasDeliveryCodePending } from "@/modules/booking/delivery/delivery-code.store.js";
import type {
    CustomerReviewService,
    SubmitOrderReviewInput,
} from "@/modules/reviews/customer-reviews/customer-review.service.js";
import { logger } from "@/utils/logger.js";

const ACTIVE_TRIP_STATUSES = new Set(["ASSIGNED", "EN_ROUTE", "ON_SITE"]);

export type PublicOrderAddon = {
    id: string;
    name: string;
    pricePaise: number;
    quantity: number;
    imageUrl?: string | null;
};

export type PublicOrderItem = {
    id: string;
    productId: string;
    name: string;
    imageUrl: string | null;
    quantity: number;
    productPaise: number;
    addonsPaise: number;
    lineTotalPaise: number;
    addons: PublicOrderAddon[];
};

export type PublicOrderReview = {
    id: string;
    rating: number;
    body: string;
    reviewedAt: string;
};

export type PublicOrderReviewMeta = {
    canReview: boolean;
    reviewSubmitted: boolean;
    review: PublicOrderReview | null;
};

export type PublicOrderSummary = {
    id: string;
    reference: string;
    status: string;
    scheduledAt: string;
    subtotalPaise: number;
    cityName: string;
    pincode: string;
    delivery: {
        address: string;
        landmark: string | null;
    };
    primaryName: string;
    primaryImageUrl: string | null;
    itemCount: number;
    canReview: boolean;
    reviewSubmitted: boolean;
};

export type PublicAdminOrderSummary = PublicOrderSummary & {
    customerName: string;
    customerPhone: string;
    paymentMethod: string;
    source: string;
    assigneeName: string | null;
    createdAt: string;
    fulfillmentType: "scheduled" | "instant";
    dispatchStatus: string;
};

export type PublicAssignee = {
    id: string;
    name: string;
    phone: string | null;
    pincode: string;
    cityName: string;
    vendorResponse?: "pending" | "accepted" | "declined";
};

export type { PublicServiceContact };

export type PublicAdminDispatchOffer = {
    id: string;
    vendorName: string;
    status: string;
    offeredAt: string;
    expiresAt: string;
    respondedAt: string | null;
    distanceMeters: number | null;
    round: number;
};

export type PublicOrder = {
    id: string;
    userId: string;
    reference: string;
    status: string;
    paymentMethod: string;
    cityId: string;
    pincode: string;
    fulfillmentType: "scheduled" | "instant";
    dispatchStatus: string;
    dispatchExhaustedAt?: string | null;
    dispatchOffers?: PublicAdminDispatchOffer[];
    scheduledAt: string;
    subtotalPaise: number;
    discountPaise: number;
    totalPaise: number;
    couponCode: string | null;
    customer: {
        name: string;
        phone: string;
        email: string;
    };
    delivery: {
        address: string;
        landmark: string | null;
        cityName: string;
        pincode: string;
    };
    items: PublicOrderItem[];
    createdAt: string;
    source?: string;
    adminNotes?: string | null;
    isCustomPackage?: boolean;
    assignee?: PublicAssignee | null;
    serviceContact?: PublicServiceContact | null;
    deliveryCodePending?: boolean;
    canReview: boolean;
    reviewSubmitted: boolean;
    review: PublicOrderReview | null;
};

type OrderLineInput = {
    productId: string;
    quantity: number;
    addons: { addonId: string; quantity: number }[];
};

export type CreateOrderResult = {
    order: PublicOrder;
    checkout?: CheckoutPayload;
};

export interface IOrderService {
    listForUser(userId: string, query: ListOrdersQuery): Promise<Paginated<PublicOrderSummary>>;
    listAdmin(query: AdminOrderListQuery): Promise<Paginated<PublicAdminOrderSummary>>;
    createFromCart(userId: string, input: CreateOrderInput): Promise<CreateOrderResult>;
    createAdminOrder(adminId: string, input: AdminCreateOrderInput): Promise<CreateOrderResult>;
    getForUser(userId: string, orderId: string): Promise<PublicOrder>;
    getTrackingForUser(userId: string, orderId: string): Promise<PublicOrderTracking>;
    getRouteForUser(userId: string, orderId: string): Promise<RouteResult>;
    submitReview(
        userId: string,
        orderId: string,
        input: SubmitOrderReviewInput,
    ): Promise<PublicOrderReviewMeta>;
    getForAdmin(orderId: string): Promise<PublicOrder>;
    cancelPendingPaymentForUser(userId: string, orderId: string): Promise<PublicOrder>;
    resumeCheckoutForUser(userId: string, orderId: string): Promise<CreateOrderResult>;
    toPublic(order: OrderWithItems): PublicOrder;
    sendBookingConfirmedEmail(userId: string, order: PublicOrder): Promise<void>;
}

function makeReference(): string {
    const d = new Date();
    const y = String(d.getFullYear()).slice(-2);
    const m = String(d.getMonth() + 1).padStart(2, "0");
    const day = String(d.getDate()).padStart(2, "0");
    const rand = randomBytes(3).toString("hex").toUpperCase();
    return `DCY-${y}${m}${day}-${rand}`;
}

function normalizePincode(value: string): string {
    return value.replace(/\D/g, "").slice(0, 6);
}

const VALID_STATUSES = new Set<string>(ORDER_STATUSES);

function parseAdminStatuses(query: AdminOrderListQuery): OrderStatus[] | undefined {
    if (query.needsAssign === "true") {
        return ["CONFIRMED"];
    }
    const raw = query.status?.trim();
    if (!raw) return undefined;
    const parts = raw.split(",").map((part) => part.trim()).filter(Boolean);
    if (!parts.length) return undefined;
    for (const part of parts) {
        if (!VALID_STATUSES.has(part)) {
            throw ApiError.badRequest("invalid status");
        }
    }
    return parts as OrderStatus[];
}

function toAdminListFilter(query: AdminOrderListQuery): AdminOrderListFilter {
    return {
        q: query.q,
        statuses: parseAdminStatuses(query),
        cityId: query.cityId,
        paymentMethod: query.paymentMethod,
        sort: query.sort,
        userId: query.userId,
        vendorId: query.vendorId,
        fulfillmentType: query.fulfillmentType,
        dispatchStatus: query.dispatchStatus,
    };
}

function toPublicReview(
    review: { id: string; rating: number; body: string; reviewedAt: Date } | null | undefined,
): PublicOrderReview | null {
    if (!review) return null;
    return {
        id: review.id,
        rating: review.rating,
        body: review.body,
        reviewedAt: review.reviewedAt.toISOString(),
    };
}

function reviewMeta(
    status: string,
    review: { id: string; rating: number; body: string; reviewedAt: Date } | null | undefined,
): PublicOrderReviewMeta {
    const reviewSubmitted = Boolean(review);
    return {
        canReview: status === "COMPLETED" && !reviewSubmitted,
        reviewSubmitted,
        review: toPublicReview(review),
    };
}

export class OrderService implements IOrderService {
    private readonly carts = new CartRepository();
    private readonly addons = new AddonRepository();
    private readonly fieldAssignments = new OrderFieldAssignmentRepository();
    private readonly vendors = new VendorRepository();
    private readonly users = new UserRepository();

    constructor(
        private readonly orders: IOrderRepository,
        private readonly notifications: INotificationService,
        private readonly payments?: IPaymentIntentService,
        private readonly assignments?: IAssignmentRepository,
        private readonly customers?: CustomerProvisioner,
        private readonly customerReviews?: CustomerReviewService,
    ) {}

    async listForUser(
        userId: string,
        query: ListOrdersQuery,
    ): Promise<Paginated<PublicOrderSummary>> {
        const pagination = parsePagination(query);
        const bucket = query.bucket ?? "all";
        const result = await this.orders.listForUser(userId, pagination, bucket);
        const reviewsByOrder = this.customerReviews
            ? await this.customerReviews.findByOrderIds(result.items.map((row) => row.id))
            : new Map();
        return {
            items: result.items.map((row) => {
                const meta = reviewMeta(row.status, reviewsByOrder.get(row.id));
                return {
                    id: row.id,
                    reference: row.reference,
                    status: row.status,
                    scheduledAt: row.scheduledAt.toISOString(),
                    subtotalPaise: row.subtotalPaise,
                    cityName: row.cityName,
                    pincode: row.pincode,
                    delivery: {
                        address: row.addressLine,
                        landmark: row.landmark,
                    },
                    primaryName: row.primaryName,
                    primaryImageUrl: row.primaryImageUrl,
                    itemCount: row.itemCount,
                    canReview: meta.canReview,
                    reviewSubmitted: meta.reviewSubmitted,
                };
            }),
            page: pagination.page,
            limit: pagination.limit,
            total: result.total,
        };
    }

    async listAdmin(query: AdminOrderListQuery): Promise<Paginated<PublicAdminOrderSummary>> {
        const pagination = parsePagination(query);
        const filter = toAdminListFilter(query);
        const result = await this.orders.listAdmin(filter, pagination);
        const assignees = this.assignments
            ? await this.assignments.findAssigneesByOrderIds(result.items.map((row) => row.id))
            : new Map();
        return {
            items: result.items.map((row) => ({
                id: row.id,
                reference: row.reference,
                status: row.status,
                scheduledAt: row.scheduledAt.toISOString(),
                subtotalPaise: row.subtotalPaise,
                cityName: row.cityName,
                pincode: row.pincode,
                delivery: {
                    address: row.addressLine,
                    landmark: row.landmark,
                },
                primaryName: row.primaryName,
                primaryImageUrl: row.primaryImageUrl,
                itemCount: row.itemCount,
                customerName: row.customerName,
                customerPhone: row.customerPhone,
                paymentMethod: row.paymentMethod,
                source: row.source,
                assigneeName: assignees.get(row.id)?.name ?? null,
                createdAt: row.createdAt.toISOString(),
                fulfillmentType: row.fulfillmentType,
                dispatchStatus: row.dispatchStatus,
                canReview: false,
                reviewSubmitted: false,
            })),
            page: pagination.page,
            limit: pagination.limit,
            total: result.total,
        };
    }

    async createFromCart(userId: string, input: CreateOrderInput): Promise<CreateOrderResult> {
        const existing = await this.orders.findByIdempotency(userId, input.idempotencyKey);
        if (existing && existing.status !== "CANCELLED") {
            const loaded = await this.orders.loadWithItems(existing.id);
            if (!loaded) throw ApiError.notFound("order not found");
            const order = this.toPublic(loaded);
            if (existing.status === "PENDING_PAYMENT") {
                if (input.paymentMethod === "cod") {
                    await this.releasePendingPaymentOrder(existing.id, userId);
                } else if (input.paymentMethod === "online") {
                    if (!this.payments) {
                        throw ApiError.badRequest("online payment is not available");
                    }
                    const checkout = await this.payments.startCheckout(loaded);
                    return { order, checkout };
                } else {
                    throw ApiError.badRequest("select a payment method");
                }
            } else {
                return { order };
            }
        }

        const isOnline = input.paymentMethod === "online";
        if (isOnline && !this.payments) {
            throw ApiError.badRequest("online payment is not available");
        }

        const platform = await settingService.getPaymentMethods();
        if (isOnline) {
            if (!platform.online) {
                throw ApiError.badRequest("online payment is not enabled on the platform");
            }
            if (!activeOnlineProvider(platform)) {
                throw ApiError.badRequest("no online payment provider is enabled");
            }
        } else if (!platform.cod) {
            throw ApiError.badRequest("cash on delivery is not enabled on the platform");
        }

        const cart = await this.carts.findByUserId(userId);
        if (!cart) {
            throw ApiError.badRequest("bag is empty");
        }

        const loaded = await this.carts.loadWithItems(cart.id);
        if (!loaded?.items.length) {
            throw ApiError.badRequest("bag is empty");
        }

        if (!loaded.cityId) {
            throw ApiError.badRequest("set bag city first");
        }

        const bookingPolicy = await settingService.getBookingPolicy();
        assertAcceptingBookings(bookingPolicy);

        const fulfillmentType = await inferCartFulfillment(loaded, loaded.items, loaded.cityId);
        if (fulfillmentType === "instant") {
            await assertInstantMarketplaceAllowed();
        } else {
            assertBookableSlot(loaded.scheduledAt, bookingPolicy);
        }

        const deliveryPin = normalizePincode(input.delivery.pincode);
        if (input.delivery.cityId !== loaded.cityId) {
            throw ApiError.badRequest("delivery city does not match bag city");
        }
        await assertDeliveryLocation({ cityId: input.delivery.cityId, pincode: deliveryPin });

        const city = await getActiveCityById(loaded.cityId);
        const cityName = city.name;

        const { items, subtotalPaise } = await this.buildLineSnapshotsFromItems(
            loaded.cityId,
            loaded.items.map((item) => ({
                productId: item.productId,
                quantity: item.quantity,
                addons: item.addons.map((row) => ({
                    addonId: row.addonId,
                    quantity: row.quantity,
                })),
            })),
        );

        for (const item of loaded.items) {
            const product = await getProductForCity(item.productId, loaded.cityId);
            if (fulfillmentType === "instant" && !product.instantEnabled) {
                throw ApiError.badRequest("one or more items are not available for instant booking");
            }
            if (isOnline && !product.paymentOnline) {
                throw ApiError.badRequest("one or more items do not support online payment");
            }
            if (!isOnline && !product.paymentCod) {
                throw ApiError.badRequest("one or more items do not support cash on delivery");
            }
        }

        const scheduledAt =
            fulfillmentType === "instant"
                ? await instantScheduledAt()
                : loaded.scheduledAt!;

        let deliveryLatitude = loaded.deliveryLatitude ?? input.delivery.latitude ?? null;
        let deliveryLongitude = loaded.deliveryLongitude ?? input.delivery.longitude ?? null;
        const deliveryGeoSource =
            deliveryLatitude !== null && deliveryLongitude !== null
                ? ("geocode_manual" as const)
                : null;
        const deliveryGeoAt =
            deliveryLatitude !== null && deliveryLongitude !== null ? new Date() : null;

        const promotionLines = await this.buildPromotionLines(loaded.cityId, items);
        let discountPaise = 0;
        let couponId: string | null = null;
        let couponCode: string | null = null;
        let redemption: {
            couponId: string;
            userId: string;
            code: string;
            discountPaise: number;
        } | null = null;

        if (loaded.appliedCouponId) {
            const validated = await promotionService.validateAppliedCoupon(loaded.appliedCouponId, {
                cityId: loaded.cityId,
                subtotalPaise,
                lines: promotionLines,
                userId,
                paymentMethod: input.paymentMethod,
                requirePaymentMethod: true,
            });
            await promotionService.assertUsageLimits(validated.coupon, userId);
            discountPaise = validated.discountPaise;
            couponId = validated.coupon.id;
            couponCode = validated.coupon.code;
            redemption = {
                couponId: validated.coupon.id,
                userId,
                code: validated.coupon.code,
                discountPaise,
            };
        }

        const payload: OrderInsertPayload = {
            reference: makeReference(),
            userId,
            status: isOnline ? "PENDING_PAYMENT" : "CONFIRMED",
            paymentMethod: isOnline ? "ONLINE" : "COD",
            cityId: loaded.cityId,
            pincode: deliveryPin,
            fulfillmentType,
            dispatchStatus: fulfillmentType === "instant" ? "idle" : "idle",
            deliveryLatitude,
            deliveryLongitude,
            deliveryGeoSource,
            deliveryGeoAt,
            scheduledAt,
            subtotalPaise,
            discountPaise,
            couponId,
            couponCode,
            customerName: input.customer.name.trim(),
            customerPhone: input.customer.phone.trim(),
            customerEmail: input.customer.email.trim(),
            addressLine: input.delivery.address.trim(),
            landmark: input.delivery.landmark?.trim() || null,
            cityName,
            source: "web",
            idempotencyKey: input.idempotencyKey,
            items,
        };

        const created = await this.orders.createWithItemsAndRedemption(
            payload,
            cart.id,
            redemption,
            { clearCart: !isOnline },
        );
        await orderFinancialService.snapshotForOrder(
            created.id,
            orderPayablePaise(created),
            created.discountPaise,
        );
        const publicOrder = this.toPublic(created);
        if (isOnline) {
            const checkout = await this.payments!.startCheckout(created);
            return { order: publicOrder, checkout };
        }
        await this.sendBookingConfirmedEmail(userId, publicOrder);
        return { order: publicOrder };
    }

    async createAdminOrder(adminId: string, input: AdminCreateOrderInput): Promise<CreateOrderResult> {
        if (!this.customers) {
            throw ApiError.internalServerError("admin booking is not configured");
        }

        await this.assertOfflinePaymentAllowed();

        const user = await this.customers.findOrCreateForAdminBooking({
            phone: input.customer.phone,
            name: input.customer.name,
            email: input.customer.email,
        });

        const existing = await this.orders.findByIdempotency(user.id, input.idempotencyKey);
        if (existing) {
            const loaded = await this.orders.loadWithItems(existing.id);
            if (!loaded) throw ApiError.notFound("order not found");
            return { order: this.toPublic(loaded) };
        }

        const scheduledAt = new Date(input.scheduledAt);
        const bookingPolicy = await settingService.getBookingPolicy();
        assertAcceptingBookings(bookingPolicy);
        assertBookableSlot(scheduledAt, bookingPolicy);

        const deliveryPin = normalizePincode(input.delivery.pincode);
        await assertDeliveryLocation({ cityId: input.delivery.cityId, pincode: deliveryPin });

        const city = await getActiveCityById(input.delivery.cityId);
        const paymentMethod = input.paymentMethod === "prepaid" ? "PREPAID" : "COD";
        const customerPhone = this.customers.toOrderPhone(input.customer.phone);
        const customerEmail = input.customer.email?.trim() ?? "";

        let items: OrderItemInsert[];
        let subtotalPaise: number;
        let isCustomPackage = false;

        if (input.orderKind === "custom") {
            isCustomPackage = true;
            const built = await this.buildCustomLineSnapshot(input.customLine);
            items = [built.item];
            subtotalPaise = built.subtotalPaise;
        } else {
            const catalogLines: OrderLineInput[] = input.items.map((line) => ({
                productId: line.productId,
                quantity: line.quantity,
                addons: (line.addonIds ?? []).map((addonId) => ({ addonId, quantity: 1 })),
            }));
            const priced = await this.buildLineSnapshotsFromItems(
                input.delivery.cityId,
                catalogLines,
            );
            items = priced.items;
            subtotalPaise = priced.subtotalPaise;

            for (const line of input.items) {
                const product = await getProductForCity(line.productId, input.delivery.cityId);
                if (!product.paymentCod) {
                    throw ApiError.badRequest("one or more items do not support offline payment");
                }
            }
        }

        const payload: OrderInsertPayload = {
            reference: makeReference(),
            userId: user.id,
            status: "CONFIRMED",
            paymentMethod,
            source: "admin",
            createdByAdminId: adminId,
            adminNotes: input.adminNotes?.trim() || null,
            isCustomPackage,
            cityId: input.delivery.cityId,
            pincode: deliveryPin,
            scheduledAt,
            subtotalPaise,
            customerName: input.customer.name.trim(),
            customerPhone,
            customerEmail,
            addressLine: input.delivery.address.trim(),
            landmark: input.delivery.landmark?.trim() || null,
            cityName: city.name,
            idempotencyKey: input.idempotencyKey,
            items,
        };

        const created = await this.orders.insertOrderWithItems(payload);
        await orderFinancialService.snapshotForOrder(
            created.id,
            orderPayablePaise(created),
            created.discountPaise,
        );
        const publicOrder = this.toPublic(created);
        await this.sendBookingConfirmedEmail(user.id, publicOrder);
        return { order: publicOrder };
    }

    async getTrackingForUser(userId: string, orderId: string): Promise<PublicOrderTracking> {
        const order = await this.orders.findByIdForUser(orderId, userId);
        if (!order) {
            throw ApiError.notFound("order not found");
        }
        return buildOrderTracking(order);
    }

    async getRouteForUser(userId: string, orderId: string): Promise<RouteResult> {
        const order = await this.orders.findByIdForUser(orderId, userId);
        if (!order) {
            throw ApiError.notFound("order not found");
        }
        return buildOrderTripRoute(order);
    }

    async getForUser(userId: string, orderId: string): Promise<PublicOrder> {
        const order = await this.orders.findByIdForUser(orderId, userId);
        if (!order) {
            throw ApiError.notFound("order not found");
        }
        const loaded = await this.orders.loadWithItems(orderId);
        if (!loaded) {
            throw ApiError.notFound("order not found");
        }
        const onActiveTrip = ACTIVE_TRIP_STATUSES.has(loaded.status);
        const showServiceContact =
            this.assignments &&
            loaded.status !== "CANCELLED" &&
            (onActiveTrip || loaded.status === "COMPLETED");
        const assignee =
            onActiveTrip && this.assignments
                ? await this.assignments.findAssigneeByOrderId(orderId)
                : null;
        const serviceContact = showServiceContact
            ? await resolveServiceContact(orderId, loaded.status, {
                  assignments: this.assignments!,
                  fieldAssignments: this.fieldAssignments,
                  vendors: this.vendors,
                  users: this.users,
              })
            : null;
        const publicOrder = await this.enrichAddonImages(this.toPublic(loaded));
        const deliveryCodePending =
            loaded.status === "ON_SITE" ? await hasDeliveryCodePending(orderId) : false;
        const review = this.customerReviews
            ? await this.customerReviews.findByOrderId(orderId)
            : null;
        const meta = reviewMeta(loaded.status, review);
        return {
            ...publicOrder,
            assignee: assignee ?? null,
            serviceContact: serviceContact ?? null,
            deliveryCodePending,
            canReview: loaded.isCustomPackage ? false : meta.canReview,
            reviewSubmitted: meta.reviewSubmitted,
            review: meta.review,
        };
    }

    async submitReview(
        userId: string,
        orderId: string,
        input: SubmitOrderReviewInput,
    ): Promise<PublicOrderReviewMeta> {
        if (!this.customerReviews) {
            throw ApiError.badRequest("reviews are not available");
        }
        const order = await this.orders.findByIdForUser(orderId, userId);
        if (!order) {
            throw ApiError.notFound("order not found");
        }
        if (order.status !== "COMPLETED") {
            throw ApiError.badRequest("only completed bookings can be reviewed");
        }
        if (order.isCustomPackage) {
            throw ApiError.badRequest("custom bookings cannot be reviewed");
        }
        const loaded = await this.orders.loadWithItems(orderId);
        if (!loaded) {
            throw ApiError.notFound("order not found");
        }

        const productIds = [...new Set(loaded.items.map((item) => item.productId))];
        let productId = input.productId;
        if (!productId) {
            if (productIds.length === 1) {
                productId = productIds[0];
            } else {
                throw ApiError.badRequest("productId is required when the booking has multiple items");
            }
        } else if (!productIds.includes(productId)) {
            throw ApiError.badRequest("product not found in this booking");
        }

        const publicOrder = await this.enrichAddonImages(this.toPublic(loaded));
        const review = await this.customerReviews.createFromCustomerOrder(userId, orderId, {
            rating: input.rating,
            body: input.body,
            productId,
            reviewerName: publicOrder.customer.name,
            reviewerCity: publicOrder.delivery.cityName,
        });
        return reviewMeta("COMPLETED", review);
    }

    async cancelPendingPaymentForUser(userId: string, orderId: string): Promise<PublicOrder> {
        await this.releasePendingPaymentOrder(orderId, userId);
        const loaded = await this.orders.loadWithItems(orderId);
        if (!loaded) {
            throw ApiError.notFound("order not found");
        }
        return this.enrichAddonImages(this.toPublic(loaded));
    }

    async resumeCheckoutForUser(userId: string, orderId: string): Promise<CreateOrderResult> {
        const order = await this.orders.findByIdForUser(orderId, userId);
        if (!order) {
            throw ApiError.notFound("order not found");
        }
        if (order.status !== "PENDING_PAYMENT") {
            throw ApiError.badRequest("order is not awaiting payment");
        }
        if (!this.payments) {
            throw ApiError.badRequest("online payment is not available");
        }
        const loaded = await this.orders.loadWithItems(orderId);
        if (!loaded) {
            throw ApiError.notFound("order not found");
        }
        const checkout = await this.payments.startCheckout(loaded);
        return { order: this.toPublic(loaded), checkout };
    }

    private async releasePendingPaymentOrder(orderId: string, userId: string): Promise<void> {
        const order = await this.orders.findByIdForUser(orderId, userId);
        if (!order) {
            throw ApiError.notFound("order not found");
        }
        if (order.status !== "PENDING_PAYMENT") {
            throw ApiError.conflict("order is not awaiting payment");
        }
        const updated = await this.orders.cancelPendingPaymentForUser(orderId, userId);
        if (!updated) {
            throw ApiError.conflict("order cannot be cancelled in its current state");
        }
        await this.payments?.abandonCheckout(orderId);
        const { closeBookingChatAfterOrderCancelled } = await import(
            "@/modules/chat/lib/order-booking-chat-lifecycle.js"
        );
        await closeBookingChatAfterOrderCancelled(orderId);
    }

    async cancelOrder(orderId: string, userId: string): Promise<PublicOrder> {
        const order = await this.orders.findByIdForUser(orderId, userId);
        if (!order) {
            throw ApiError.notFound("order not found");
        }
        const updated = await this.orders.markCancelled(orderId);
        if (!updated) {
            throw ApiError.conflict("order cannot be cancelled in its current state");
        }
        const { closeBookingChatAfterOrderCancelled } = await import(
            "@/modules/chat/lib/order-booking-chat-lifecycle.js"
        );
        await closeBookingChatAfterOrderCancelled(orderId);
        const loaded = await this.orders.loadWithItems(orderId);
        if (!loaded) {
            throw ApiError.notFound("order not found");
        }
        return this.enrichAddonImages(this.toPublic(loaded));
    }

    async getForAdmin(orderId: string): Promise<PublicOrder> {
        const order = await this.orders.findById(orderId);
        if (!order) {
            throw ApiError.notFound("order not found");
        }
        const loaded = await this.orders.loadWithItems(orderId);
        if (!loaded) {
            throw ApiError.notFound("order not found");
        }
        const assignee = this.assignments
            ? await this.assignments.findAssigneeForAdminByOrderId(orderId)
            : null;
        const publicOrder = await this.enrichAddonImages(this.toPublic(loaded));

        if (order.fulfillmentType !== "instant") {
            return {
                ...publicOrder,
                assignee: assignee ?? null,
            };
        }

        const offersRepo = new DispatchOfferRepository();
        const offerRows = await offersRepo.listForOrderAdmin(orderId);

        return {
            ...publicOrder,
            assignee: assignee ?? null,
            dispatchExhaustedAt: order.dispatchExhaustedAt
                ? order.dispatchExhaustedAt.toISOString()
                : null,
            dispatchOffers: offerRows.map((row) => ({
                id: row.id,
                vendorName: row.vendorName,
                status: row.status,
                offeredAt: row.offeredAt.toISOString(),
                expiresAt: row.expiresAt.toISOString(),
                respondedAt: row.respondedAt ? row.respondedAt.toISOString() : null,
                distanceMeters: row.distanceMeters,
                round: row.round,
            })),
        };
    }

    private async enrichAddonImages(order: PublicOrder): Promise<PublicOrder> {
        const addonIds = [
            ...new Set(order.items.flatMap((item) => item.addons.map((addon) => addon.id))),
        ];
        if (addonIds.length === 0) {
            return order;
        }

        const rows = await db
            .select({
                addonId: addons.id,
                upload: uploads,
            })
            .from(addons)
            .leftJoin(uploads, eq(addons.imageUploadId, uploads.id))
            .where(inArray(addons.id, addonIds));

        const imageByAddonId = new Map<string, string | null>();
        for (const row of rows) {
            imageByAddonId.set(row.addonId, row.upload ? displayUrl(row.upload) : null);
        }

        return {
            ...order,
            items: order.items.map((item) => ({
                ...item,
                addons: item.addons.map((addon) => ({
                    ...addon,
                    imageUrl: imageByAddonId.get(addon.id) ?? null,
                })),
            })),
        };
    }

    private async assertOfflinePaymentAllowed(): Promise<void> {
        const platform = await settingService.getPaymentMethods();
        if (!platform.cod) {
            throw ApiError.badRequest("cash on delivery is not enabled on the platform");
        }
    }

    private async buildCustomLineSnapshot(
        line: { name: string; pricePaise: number; imageUploadId?: string; quantity?: number },
    ): Promise<{ item: OrderItemInsert; subtotalPaise: number }> {
        const quantity = line.quantity ?? 1;
        const productId = await resolveAdminCustomProductId();
        let imageUrl: string | null = null;

        if (line.imageUploadId) {
            const upload = await getCompletedUpload(line.imageUploadId);
            if (upload.kind !== "image") {
                throw ApiError.badRequest("custom package image must be an image upload");
            }
            imageUrl = displayUrl(upload);
        }

        const productPaise = line.pricePaise;
        const addonsPaise = 0;
        const lineTotalPaise = productPaise * quantity;

        return {
            subtotalPaise: lineTotalPaise,
            item: {
                productId,
                productName: line.name.trim(),
                imageUrl,
                quantity,
                productPaise,
                addonsPaise,
                lineTotalPaise,
                addons: [],
            },
        };
    }

    private async buildLineSnapshotsFromItems(
        cityId: string,
        lines: OrderLineInput[],
    ): Promise<{ items: OrderItemInsert[]; subtotalPaise: number }> {
        const items: OrderItemInsert[] = [];
        let subtotalPaise = 0;

        for (const line of lines) {
            const addonSelections = line.addons;
            let quote;
            try {
                quote = await priceQuote(line.productId, cityId, addonSelections);
            } catch {
                throw ApiError.badRequest(`unable to price product ${line.productId}`);
            }

            const product = await getProductForCity(line.productId, cityId);
            const imageUrl =
                product.images?.find((img) => img.kind === "image")?.url ??
                product.images?.[0]?.url ??
                null;

            const unitPriceByAddon: Record<string, number> = {};
            for (const { addonId } of addonSelections) {
                try {
                    const single = await priceQuote(line.productId, cityId, [
                        { addonId, quantity: 1 },
                    ]);
                    unitPriceByAddon[addonId] = single.addonsPaise;
                } catch {
                    throw ApiError.badRequest(`unable to price add-on for product ${line.productId}`);
                }
            }

            const lineTotalPaise = quote.totalPaise * line.quantity;
            subtotalPaise += lineTotalPaise;

            const addonSnapshots = await Promise.all(
                addonSelections.map(async ({ addonId, quantity }) => {
                    const addon = await this.addons.findById(addonId);
                    const unit = unitPriceByAddon[addonId] ?? 0;
                    return {
                        addonId,
                        addonName: addon?.name ?? "Add-on",
                        pricePaise: unit * quantity,
                        quantity,
                    };
                }),
            );

            items.push({
                productId: line.productId,
                productName: product.name,
                imageUrl,
                quantity: line.quantity,
                productPaise: quote.productPaise,
                addonsPaise: quote.addonsPaise,
                lineTotalPaise,
                addons: addonSnapshots,
            });
        }

        return { items, subtotalPaise };
    }

    private async buildPromotionLines(
        cityId: string,
        items: OrderItemInsert[],
    ): Promise<PromotionLine[]> {
        const lines: PromotionLine[] = [];
        for (const item of items) {
            const product = await getProductForCity(item.productId, cityId);
            lines.push({
                productId: item.productId,
                categoryId: product.categoryId,
                lineTotalPaise: item.lineTotalPaise,
            });
        }
        return lines;
    }

    toPublic(order: OrderWithItems): PublicOrder {
        return {
            id: order.id,
            userId: order.userId,
            reference: order.reference,
            status: order.status,
            paymentMethod: order.paymentMethod,
            cityId: order.cityId,
            pincode: order.pincode,
            fulfillmentType: order.fulfillmentType,
            dispatchStatus: order.dispatchStatus,
            scheduledAt: order.scheduledAt.toISOString(),
            subtotalPaise: order.subtotalPaise,
            discountPaise: order.discountPaise ?? 0,
            totalPaise: orderPayablePaise(order),
            couponCode: order.couponCode ?? null,
            customer: {
                name: order.customerName,
                phone: order.customerPhone,
                email: order.customerEmail,
            },
            delivery: {
                address: order.addressLine,
                landmark: order.landmark,
                cityName: order.cityName,
                pincode: order.pincode,
            },
            source: order.source,
            adminNotes: order.adminNotes,
            isCustomPackage: order.isCustomPackage,
            items: order.items.map((item) => ({
                id: item.id,
                productId: item.productId,
                name: item.productName,
                imageUrl: item.imageUrl,
                quantity: item.quantity,
                productPaise: item.productPaise,
                addonsPaise: item.addonsPaise,
                lineTotalPaise: item.lineTotalPaise,
                addons: item.addons.map((addon) => ({
                    id: addon.addonId,
                    name: addon.addonName,
                    pricePaise: addon.pricePaise,
                    quantity: addon.quantity,
                })),
            })),
            createdAt: order.createdAt.toISOString(),
            canReview: false,
            reviewSubmitted: false,
            review: null,
        };
    }

    async sendBookingConfirmedEmail(userId: string, order: PublicOrder): Promise<void> {
        if (order.fulfillmentType !== "instant") {
            await scheduleBookingReminders(order.id, new Date(order.scheduledAt));
        } else {
            const { enqueueDispatchStart } = await import(
                "@/modules/dispatch/jobs/dispatch.job.js"
            );
            await enqueueDispatchStart(order.id);
        }

        try {
            const enriched = await this.enrichAddonImages(order);
            const email = enriched.customer.email?.trim();
            await this.notifications.notify({
                event: "BOOKING_CONFIRMED",
                userId,
                recipient: {
                    email: email || undefined,
                    phone: enriched.customer.phone,
                },
                data: {
                    customerName: enriched.customer.name,
                    customerPhone: enriched.customer.phone,
                    orderId: enriched.id,
                    orderRef: enriched.reference,
                    bookingId: enriched.id,
                    trackUrl: bookingTrackUrl(enriched.id),
                    scheduledAt: enriched.scheduledAt,
                    city: enriched.delivery.cityName,
                    address: [
                        enriched.delivery.address,
                        enriched.delivery.landmark,
                        enriched.delivery.cityName,
                        enriched.delivery.pincode,
                    ]
                        .filter(Boolean)
                        .join(", "),
                    totalPaise: String(enriched.totalPaise),
                    itemsJson: JSON.stringify(
                        enriched.items.map((item) => ({
                            name: item.name,
                            imageUrl: item.imageUrl,
                            quantity: item.quantity,
                            lineTotalPaise: item.lineTotalPaise,
                            addons: item.addons.map((addon) => ({
                                name: addon.name,
                                imageUrl: addon.imageUrl ?? null,
                                quantity: addon.quantity,
                                pricePaise: addon.pricePaise,
                            })),
                        })),
                    ),
                },
                idempotencyKey: `booking-confirmed:${enriched.id}`,
            });
        } catch (err) {
            logger.error({ err, orderId: order.id }, "booking confirmed email failed");
        }
    }
}
